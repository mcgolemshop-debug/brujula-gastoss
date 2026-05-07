"use server";

import { revalidatePath } from "next/cache";
import { tasaCambioSchema } from "@/lib/validations/tasa";
import { repo } from "@/lib/repositories";
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
