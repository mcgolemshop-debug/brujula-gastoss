/**
 * Cron · Actualización automática de la tasa Bs/USD
 *
 * Se llama desde Vercel Cron (config en vercel.json) una vez al día.
 * Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}` automáticamente.
 *
 * Si la nueva tasa varía >10% vs. la última, dispara push notification al admin.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchTasaActual } from "@/lib/tasa/fetch-tasa";
import { sendPushToAdmins } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return !!auth && auth === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createSupabaseAdmin();

  // Tasa actual en DB
  const { data: actualRow } = await sb
    .from("tasa_actual")
    .select("valor_bs_por_usd, created_at")
    .maybeSingle();
  const tasaActual =
    (actualRow as unknown as { valor_bs_por_usd?: number } | null)
      ?.valor_bs_por_usd ?? null;

  // Fetch externa
  const result = await fetchTasaActual();
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "No se pudo obtener tasa de ninguna fuente" },
      { status: 502 }
    );
  }

  // Si la diferencia es <0.5%, no insertamos para no llenar histórico
  if (
    tasaActual !== null &&
    Math.abs(result.valor - tasaActual) / tasaActual < 0.005
  ) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Diferencia <0.5% — no se inserta",
      tasaActual,
      tasaNueva: result.valor,
    });
  }

  const { error } = await sb.from("tasa_cambio").insert({
    valor_bs_por_usd: result.valor,
    fuente: result.fuente,
    actualizado_por: null,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // Si cambió >10%, alertamos
  let pushSent = 0;
  if (
    tasaActual !== null &&
    Math.abs(result.valor - tasaActual) / tasaActual > 0.1
  ) {
    const direction = result.valor > tasaActual ? "subió" : "bajó";
    const pct = (
      ((result.valor - tasaActual) / tasaActual) *
      100
    ).toFixed(1);
    pushSent = await sendPushToAdmins({
      title: `📈 Tasa Bs/USD ${direction} ${pct}%`,
      body: `Nueva tasa: Bs ${result.valor.toFixed(2)} · Antes: Bs ${tasaActual.toFixed(2)}`,
      url: "/configuracion",
    }).catch(() => 0);
  }

  return NextResponse.json({
    ok: true,
    tasaAnterior: tasaActual,
    tasaNueva: result.valor,
    fuente: result.fuente,
    pushSent,
  });
}
