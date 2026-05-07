"use server";

import { revalidatePath } from "next/cache";
import { mobiliarioSchema, cambiarEstadoSchema } from "@/lib/validations/mobiliario";
import { repo } from "@/lib/repositories";
import type {
  EstadoMobiliario,
  NuevoMobiliarioInput,
  TipoMobiliario,
} from "@/types/domain";
import type { ActionResult } from "../gastos/_actions";

export async function crearMobiliarioAction(
  input: NuevoMobiliarioInput
): Promise<ActionResult<{ id: string; codigo: string }>> {
  const parsed = mobiliarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await repo.users.current();
  if (!user || user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede agregar mobiliario" };
  }

  try {
    const m = await repo.mobiliario.create({
      ...(parsed.data as NuevoMobiliarioInput),
      tipo: parsed.data.tipo as TipoMobiliario,
      estado: parsed.data.estado as EstadoMobiliario,
    });
    revalidatePath("/inventario");
    return { ok: true, data: { id: m.id, codigo: m.codigo } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear",
    };
  }
}

export async function cambiarEstadoMobiliarioAction(
  id: string,
  estado: EstadoMobiliario,
  notas?: string
): Promise<ActionResult<true>> {
  const parsed = cambiarEstadoSchema.safeParse({ id, estado, notas });
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const user = await repo.users.current();
  if (!user || user.rol !== "admin") {
    return {
      ok: false,
      error: "Solo el admin puede cambiar el estado del mobiliario",
    };
  }

  try {
    await repo.mobiliario.cambiarEstado(id, estado, notas);
    revalidatePath("/inventario");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al cambiar estado",
    };
  }
}

export async function eliminarMobiliarioAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user || user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar mobiliario" };
  }
  try {
    await repo.mobiliario.delete(id);
    revalidatePath("/inventario");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar",
    };
  }
}
