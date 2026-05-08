"use server";

import { revalidatePath } from "next/cache";
import { gastoSchema, editGastoSchema } from "@/lib/validations/gasto";
import { repo } from "@/lib/repositories";
import { sendPushToAdmins } from "@/lib/push/send";
import { formatUSD } from "@/lib/utils";
import type { NuevoGastoInput } from "@/types/domain";

/** Umbral en USD para notificar al admin de un gasto registrado */
const PUSH_THRESHOLD_USD = 100;

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

    // Push opcional al admin si el gasto supera el umbral y NO fue creado por el admin
    if (gasto.total_usd >= PUSH_THRESHOLD_USD && user.rol !== "admin") {
      sendPushToAdmins({
        title: `💸 Nuevo gasto · ${formatUSD(gasto.total_usd)}`,
        body: `${user.nombre_completo} registró: ${gasto.descripcion}`,
        url: `/gastos/${gasto.id}`,
        tag: `gasto-${gasto.id}`,
      }).catch(() => {});
    }

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

export async function eliminarGastosBulkAction(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar gastos" };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "Selecciona al menos un gasto" };
  }
  if (ids.length > 200) {
    return { ok: false, error: "Demasiados gastos (máx 200 por operación)" };
  }
  try {
    const result = await repo.gastosBulk.deleteMany(ids);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar masivamente",
    };
  }
}

export async function recategorizarGastosBulkAction(
  ids: string[],
  nuevaCategoriaId: string
): Promise<ActionResult<{ count: number }>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede recategorizar masivamente" };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "Selecciona al menos un gasto" };
  }
  if (!nuevaCategoriaId) {
    return { ok: false, error: "Selecciona la nueva categoría" };
  }
  try {
    const result = await repo.gastosBulk.recategorizarMany(ids, nuevaCategoriaId);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al recategorizar",
    };
  }
}

export async function actualizarGastoAction(
  id: string,
  input: Omit<NuevoGastoInput, "usuario_id">
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  // Validación con schema específico de edición (sin usuario_id)
  const parsed = editGastoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Verificar que existe + permisos (RLS lo hace pero damos error claro)
  const existing = await repo.gastos.byId(id);
  if (!existing) {
    return { ok: false, error: "Gasto no encontrado" };
  }
  if (user.rol !== "admin" && existing.usuario_id !== user.id) {
    return {
      ok: false,
      error: "Solo puedes editar tus propios gastos",
    };
  }

  try {
    await repo.gastos.update(id, parsed.data as Partial<NuevoGastoInput>);
    revalidatePath("/gastos");
    revalidatePath(`/gastos/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}
