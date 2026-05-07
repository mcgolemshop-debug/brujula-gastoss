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

/**
 * Sube la foto de factura al bucket "facturas" y registra metadata.
 * Se llama después de crearGastoAction si hay foto adjunta.
 */
export async function subirFacturaAction(
  gastoId: string,
  formData: FormData
): Promise<ActionResult<{ url: string; id: string }>> {
  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Archivo inválido" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Archivo muy grande (máx 10 MB)" };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Tipo de archivo no permitido" };
  }

  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  try {
    const result = await repo.facturas.upload(
      gastoId,
      file,
      file.name,
      user.id
    );
    revalidatePath(`/gastos/${gastoId}`);
    revalidatePath("/gastos");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error subiendo factura",
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
