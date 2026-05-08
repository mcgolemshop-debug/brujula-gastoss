/**
 * Cron · Envía reporte semanal por correo (cada lunes 7am)
 *
 * Vercel Cron config en vercel.json. Si RESEND_API_KEY está vacío, log y noop.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildReporteSemanalHtml,
  type ReporteSemanalData,
} from "@/lib/email/reporte-semanal";
import { sendPushToAdmins } from "@/lib/push/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return !!auth && auth === expected;
}

function getSemanaPasada(): { inicio: string; fin: string } {
  const hoy = new Date();
  // Lunes pasado
  const dow = hoy.getDay(); // 0=domingo
  const diasDesdeLunes = (dow + 6) % 7; // lunes=0, martes=1, ..., domingo=6
  const lunesEsta = new Date(hoy);
  lunesEsta.setDate(hoy.getDate() - diasDesdeLunes);
  const lunesPasado = new Date(lunesEsta);
  lunesPasado.setDate(lunesEsta.getDate() - 7);
  const domingoPasado = new Date(lunesEsta);
  domingoPasado.setDate(lunesEsta.getDate() - 1);
  return {
    inicio: lunesPasado.toISOString().slice(0, 10),
    fin: domingoPasado.toISOString().slice(0, 10),
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createSupabaseAdmin();
  const { inicio, fin } = getSemanaPasada();

  // Gastos de la semana
  const { data: gastosData, error: gErr } = await sb
    .from("gastos")
    .select(
      "id, total_usd, total_bs, fecha, categoria_id, usuario_id, categoria:categorias!gastos_categoria_id_fkey(nombre, color), usuario:users!gastos_usuario_id_fkey(nombre_completo)"
    )
    .gte("fecha", inicio)
    .lte("fecha", fin);
  if (gErr) {
    return NextResponse.json(
      { ok: false, error: gErr.message },
      { status: 500 }
    );
  }

  type Row = {
    id: string;
    total_usd: number;
    total_bs: number;
    fecha: string;
    categoria_id: string;
    usuario_id: string;
    categoria?: { nombre: string; color: string } | null;
    usuario?: { nombre_completo: string } | null;
  };
  const gastos = (gastosData ?? []) as unknown as Row[];

  const totalUsd = gastos.reduce((s, g) => s + Number(g.total_usd), 0);
  const totalBs = gastos.reduce((s, g) => s + Number(g.total_bs), 0);
  const comprasCount = gastos.length;
  const promedioCompraUsd = comprasCount > 0 ? totalUsd / comprasCount : 0;

  // Top categorías
  const catMap = new Map<
    string,
    { nombre: string; color: string; total: number }
  >();
  for (const g of gastos) {
    const ex = catMap.get(g.categoria_id) ?? {
      nombre: g.categoria?.nombre ?? "Sin categoría",
      color: g.categoria?.color ?? "#6B7280",
      total: 0,
    };
    ex.total += Number(g.total_usd);
    catMap.set(g.categoria_id, ex);
  }
  const topCategorias = Array.from(catMap.values())
    .map((v) => ({
      nombre: v.nombre,
      color: v.color,
      total_usd: v.total,
      pct: totalUsd > 0 ? (v.total / totalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.total_usd - a.total_usd);

  // Top personas
  const personasMap = new Map<
    string,
    { nombre: string; total: number; compras: number }
  >();
  for (const g of gastos) {
    const ex = personasMap.get(g.usuario_id) ?? {
      nombre: g.usuario?.nombre_completo ?? "—",
      total: 0,
      compras: 0,
    };
    ex.total += Number(g.total_usd);
    ex.compras += 1;
    personasMap.set(g.usuario_id, ex);
  }
  const topPersonas = Array.from(personasMap.values())
    .map((v) => ({
      nombre: v.nombre,
      total_usd: v.total,
      compras: v.compras,
    }))
    .sort((a, b) => b.total_usd - a.total_usd);

  // Reembolsos pendientes
  const { data: rebData } = await sb
    .from("reembolsos")
    .select("monto_usd")
    .eq("estado", "pendiente");
  const reembolsos = (rebData ?? []) as { monto_usd: number }[];
  const reembolsosPendientesUsd = reembolsos.reduce(
    (s, r) => s + Number(r.monto_usd),
    0
  );

  const data: ReporteSemanalData = {
    semanaInicio: inicio,
    semanaFin: fin,
    totalUsd,
    totalBs,
    comprasCount,
    promedioCompraUsd,
    topCategorias,
    topPersonas,
    reembolsosPendientes: reembolsos.length,
    reembolsosPendientesUsd,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://brujula-gastoss.vercel.app",
  };

  const html = buildReporteSemanalHtml(data);
  const recipient = process.env.REPORT_RECIPIENT;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  if (!apiKey || !recipient) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY o REPORT_RECIPIENT no configurado",
      preview: { totalUsd, comprasCount, semanaInicio: inicio, semanaFin: fin },
    });
  }

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to: recipient,
    subject: `📊 Brújula · Reporte semanal · ${inicio} → ${fin}`,
    html,
  });

  if (sendErr) {
    return NextResponse.json(
      { ok: false, error: sendErr.message },
      { status: 500 }
    );
  }

  // Push opcional al admin avisando del reporte
  await sendPushToAdmins({
    title: "📊 Reporte semanal enviado",
    body: `Total ${comprasCount} compras · revisa tu correo`,
    url: "/reportes",
  }).catch(() => 0);

  return NextResponse.json({
    ok: true,
    sentTo: recipient,
    semana: { inicio, fin },
    metricas: {
      totalUsd,
      comprasCount,
      reembolsosPendientes: reembolsos.length,
    },
  });
}
