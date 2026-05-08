/**
 * Ruta de debug temporal — devuelve el error exacto que está fallando en /reembolsos.
 * Acceso libre (no autenticado) para diagnóstico rápido.
 * Eliminar este archivo cuando se resuelva.
 */

import { NextResponse } from "next/server";
import { repo } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. users.current
  try {
    const u = await repo.users.current();
    results.usersCurrent = {
      ok: true,
      user: u ? { id: u.id, rol: u.rol, email: u.email } : null,
    };
  } catch (e) {
    results.usersCurrent = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    };
  }

  // 2. reembolsos.list
  try {
    const list = await repo.reembolsos.list({});
    results.reembolsosList = { ok: true, count: list.length };
  } catch (e) {
    results.reembolsosList = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    };
  }

  // 3. reembolsos.totalesPorBeneficiario
  try {
    const tot = await repo.reembolsos.totalesPorBeneficiario();
    results.reembolsosTotales = { ok: true, count: tot.length };
  } catch (e) {
    results.reembolsosTotales = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    };
  }

  // 4. tasa.actual
  try {
    const t = await repo.tasaCambio.actual();
    results.tasaActual = { ok: true, valor: t.valor_bs_por_usd };
  } catch (e) {
    results.tasaActual = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    };
  }

  return NextResponse.json(results, { status: 200 });
}
