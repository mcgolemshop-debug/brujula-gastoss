import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Health check endpoint para monitoreo (Vercel, UptimeRobot, etc).
 * GET /api/health → 200 OK con estado de DB
 */
export async function GET() {
  const result: {
    status: "ok" | "degraded" | "error";
    timestamp: string;
    version: string;
    data_source: string;
    db: { ok: boolean; latency_ms?: number; error?: string };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    data_source: process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock",
    db: { ok: true },
  };

  if (result.data_source === "supabase") {
    try {
      const start = Date.now();
      const sb = await createSupabaseServerClient();
      const { error } = await sb
        .from("categorias")
        .select("id", { count: "exact", head: true });
      result.db.latency_ms = Date.now() - start;
      if (error) {
        result.db.ok = false;
        result.db.error = error.message;
        result.status = "degraded";
      }
    } catch (e) {
      result.db.ok = false;
      result.db.error = e instanceof Error ? e.message : "unknown";
      result.status = "error";
    }
  }

  return NextResponse.json(result, {
    status: result.status === "error" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
