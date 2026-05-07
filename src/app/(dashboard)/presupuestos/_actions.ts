"use server";

import { revalidatePath } from "next/cache";
import { presupuestoSchema } from "@/lib/validations/presupuesto";
import { repo } from "@/lib/repositories";
import type { ActionResult } from "../gastos/_actions";

export async function upsertPresupuestoAction(input: {
  categoria_id: string;
  mes: number;
  anio: number;
  monto_usd: number;
}): Promise<ActionResult<true>> {
  const parsed = presupuestoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await repo.users.current();
  if (!user || user.rol !== "admin") {
    return { ok: false, error: "Solo el admin gestiona presupuestos" };
  }

  try {
    await repo.presupuestos.upsert(parsed.data);
    revalidatePath("/presupuestos");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al guardar presupuesto",
    };
  }
}

export async function eliminarPresupuestoAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user || user.rol !== "admin") {
    return { ok: false, error: "Solo admin" };
  }
  try {
    await repo.presupuestos.delete(id);
    revalidatePath("/presupuestos");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}
