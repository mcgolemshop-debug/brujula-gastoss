"use server";

import { revalidatePath } from "next/cache";
import { categoriaSchema } from "@/lib/validations/categoria";
import { repo } from "@/lib/repositories";
import type { CategoriaFormInput } from "@/lib/validations/categoria";
import type { ActionResult } from "../gastos/_actions";

async function ensureAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  if (me.rol !== "admin") {
    return { ok: false, error: "Solo el admin gestiona categorías" };
  }
  return { ok: true };
}

function revalidateAll() {
  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  revalidatePath("/gastos");
  revalidatePath("/gastos/nuevo");
  revalidatePath("/reportes");
  revalidatePath("/presupuestos");
}

export async function crearCategoriaAction(
  input: CategoriaFormInput
): Promise<ActionResult<{ id: string; nombre: string }>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const cat = await repo.categorias.create({
      nombre: parsed.data.nombre,
      icono: parsed.data.icono,
      color: parsed.data.color,
      tipo: parsed.data.tipo,
      notas: parsed.data.notas || null,
    });
    revalidateAll();
    return { ok: true, data: { id: cat.id, nombre: cat.nombre } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.toLowerCase().includes("unique") || msg.includes("23505")) {
      return { ok: false, error: "Ya existe una categoría con ese nombre" };
    }
    return { ok: false, error: msg };
  }
}

export async function actualizarCategoriaAction(
  id: string,
  input: CategoriaFormInput
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await repo.categorias.update(id, {
      nombre: parsed.data.nombre,
      icono: parsed.data.icono,
      color: parsed.data.color,
      tipo: parsed.data.tipo,
      notas: parsed.data.notas || null,
    });
    revalidateAll();
    return { ok: true, data: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.toLowerCase().includes("unique") || msg.includes("23505")) {
      return { ok: false, error: "Ya existe otra categoría con ese nombre" };
    }
    return { ok: false, error: msg };
  }
}

export async function toggleCategoriaActivaAction(
  id: string,
  activa: boolean
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  try {
    await repo.categorias.toggleActiva(id, activa);
    revalidateAll();
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

export async function eliminarCategoriaAction(
  id: string
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  try {
    // Verificar que no tenga gastos asociados (FK on delete restrict)
    const count = await repo.categorias.gastosCount(id);
    if (count > 0) {
      return {
        ok: false,
        error: `No se puede eliminar: tiene ${count} ${count === 1 ? "gasto asociado" : "gastos asociados"}. Desactívala en su lugar para conservar el histórico.`,
      };
    }
    await repo.categorias.delete(id);
    revalidateAll();
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar",
    };
  }
}

/**
 * Cuenta cuántos gastos tiene una categoría (para mostrar info al admin
 * antes de eliminar/desactivar).
 */
export async function contarGastosCategoriaAction(
  id: string
): Promise<{ count: number }> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { count: 0 };
  try {
    return { count: await repo.categorias.gastosCount(id) };
  } catch {
    return { count: 0 };
  }
}
