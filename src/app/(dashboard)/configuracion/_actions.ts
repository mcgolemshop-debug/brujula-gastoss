"use server";

import { revalidatePath } from "next/cache";
import { tasaCambioSchema } from "@/lib/validations/tasa";
import { repo } from "@/lib/repositories";
import { fetchTasaActual } from "@/lib/tasa/fetch-tasa";
import type { ActionResult } from "../gastos/_actions";

export async function actualizarTasaAction(input: {
  valor_bs_por_usd: number;
  fuente: string;
}): Promise<ActionResult<{ valor: number }>> {
  const parsed = tasaCambioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  if (me.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede actualizar la tasa" };
  }

  try {
    await repo.tasaCambio.actualizar(
      parsed.data.valor_bs_por_usd,
      parsed.data.fuente,
      me.id
    );
    revalidatePath("/configuracion");
    revalidatePath("/dashboard");
    revalidatePath("/gastos");
    revalidatePath("/reportes");
    return { ok: true, data: { valor: parsed.data.valor_bs_por_usd } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

/**
 * Sincroniza la tasa actual con BCV oficial usando las fuentes externas.
 * Es el mismo flujo que el cron diario, pero gatillado manualmente desde
 * /configuracion. Devuelve el detalle de cada fuente intentada para que el
 * admin pueda diagnosticar si algo falla.
 */
export async function sincronizarTasaBcvAction(): Promise<
  ActionResult<{
    valor: number;
    fuente: string;
    skipped?: boolean;
    reason?: string;
    attempts: { fuente: string; ok: boolean; error?: string }[];
  }>
> {
  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  if (me.rol !== "admin") {
    return {
      ok: false,
      error: "Solo el admin puede sincronizar la tasa",
    };
  }

  const { result, attempts } = await fetchTasaActual();

  if (!result) {
    const detalle = attempts
      .map((a) => `${a.fuente}: ${a.error ?? "sin detalle"}`)
      .join(" · ");
    return {
      ok: false,
      error: `Todas las fuentes BCV fallaron. ${detalle}`,
    };
  }

  // Comparar con la tasa actual; si la diferencia es <0.5% no insertamos
  // (mismo criterio que el cron, evita ruido en el histórico)
  const actual = await repo.tasaCambio.actual();
  const tasaActualValor = actual.valor_bs_por_usd;
  const diffPct = Math.abs(result.valor - tasaActualValor) / tasaActualValor;

  if (diffPct < 0.005) {
    return {
      ok: true,
      data: {
        valor: result.valor,
        fuente: result.fuente,
        skipped: true,
        reason: `Diferencia ${(diffPct * 100).toFixed(2)}% < 0.5%. Tasa actual sigue vigente.`,
        attempts: attempts.map((a) => ({
          fuente: a.fuente,
          ok: a.ok,
          error: a.error,
        })),
      },
    };
  }

  try {
    await repo.tasaCambio.actualizar(result.valor, result.fuente, me.id);
    revalidatePath("/configuracion");
    revalidatePath("/dashboard");
    revalidatePath("/gastos");
    revalidatePath("/reportes");
    return {
      ok: true,
      data: {
        valor: result.valor,
        fuente: result.fuente,
        attempts: attempts.map((a) => ({
          fuente: a.fuente,
          ok: a.ok,
          error: a.error,
        })),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al guardar la tasa",
    };
  }
}
