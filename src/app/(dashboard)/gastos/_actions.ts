"use server";

import { revalidatePath } from "next/cache";
import { gastoSchema } from "@/lib/validations/gasto";
import { repo } from "@/lib/repositories";
import type { NuevoGastoInput } from "@/types/domain";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function crearGastoAction(
  input: NuevoGastoInput
): Promise<ActionResult<{ id: string; codigo: string }>> {
  // Validación
  const parsed = gastoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  try {
    const gasto = await repo.gastos.create(
      parsed.data as NuevoGastoInput,
      user.id
    );
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: gasto.id, codigo: gasto.codigo } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear gasto",
    };
  }
}

export async function eliminarGastoAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar gastos" };
  }
  try {
    await repo.gastos.delete(id);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar",
    };
  }
}

export async function actualizarGastoAction(
  id: string,
  input: Partial<NuevoGastoInput>
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  try {
    await repo.gastos.update(id, input);
    revalidatePath("/gastos");
    revalidatePath(`/gastos/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}
