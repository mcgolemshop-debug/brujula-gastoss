"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/repositories";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  crearMiembroSchema,
  editarMiembroSchema,
  cambiarPasswordMiembroSchema,
  type CrearMiembroInput,
  type EditarMiembroInput,
} from "@/lib/validations/equipo";
import type { ActionResult } from "../gastos/_actions";

const IS_MOCK = () => process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

async function ensureAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  if (me.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede gestionar el equipo" };
  }
  return { ok: true };
}

function revalidateAll() {
  revalidatePath("/equipo");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function toggleUsuarioActivoAction(
  id: string,
  activo: boolean
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("users")
    .update({ activo })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, data: true };
}

export async function cambiarRolAction(
  id: string,
  rol: "admin" | "empleado"
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  // No permitir auto-degradación (admin no puede degradar a sí mismo)
  const me = await repo.users.current();
  if (me && me.id === id && rol === "empleado") {
    return {
      ok: false,
      error: "No puedes quitarte el rol admin a ti mismo. Pide a otro admin.",
    };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("users").update({ rol }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, data: true };
}

export async function enviarRecuperacionAction(
  email: string
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: true };
}

/**
 * Crea un nuevo miembro del equipo.
 * - Crea auth user con email + password
 * - Trigger handle_new_user crea row en public.users con rol/cargo
 * - Defensive upsert en public.users por si el trigger se salta algo
 */
export async function crearMiembroAction(
  input: CrearMiembroInput
): Promise<ActionResult<{ id: string; email: string }>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  if (IS_MOCK()) {
    return {
      ok: false,
      error: "Crear miembros requiere Supabase configurado",
    };
  }

  const parsed = crearMiembroSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const admin = createSupabaseAdmin();

  // Verificar que el email no esté en uso
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: "Ese correo ya está registrado",
      fieldErrors: { email: ["Ya existe un miembro con este correo"] },
    };
  }

  // Crear vía Admin API
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: parsed.data.nombre_completo,
      rol: parsed.data.rol,
      cargo: parsed.data.cargo || null,
    },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: "Sin user en respuesta de Supabase" };
  }

  // Defensive upsert
  const { error: upsertErr } = await admin.from("users").upsert(
    {
      id: data.user.id,
      email: parsed.data.email,
      nombre_completo: parsed.data.nombre_completo,
      rol: parsed.data.rol,
      cargo: parsed.data.cargo || null,
      activo: true,
    },
    { onConflict: "id" }
  );
  if (upsertErr) {
    return {
      ok: false,
      error: `Auth creado pero public.users falló: ${upsertErr.message}`,
    };
  }

  revalidateAll();
  return {
    ok: true,
    data: { id: data.user.id, email: parsed.data.email },
  };
}

/**
 * Actualiza datos básicos del miembro (email, nombre, cargo, rol).
 * Si cambia email, también lo cambia en auth.users.
 */
export async function actualizarMiembroAction(
  id: string,
  input: EditarMiembroInput
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  if (IS_MOCK()) {
    return { ok: false, error: "Editar miembros requiere Supabase configurado" };
  }

  const parsed = editarMiembroSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const me = await repo.users.current();
  if (me && me.id === id && parsed.data.rol === "empleado") {
    return {
      ok: false,
      error: "No puedes quitarte el rol admin a ti mismo",
    };
  }

  const admin = createSupabaseAdmin();

  // Si cambió el email, validar que no esté en uso por otro
  const { data: existing } = await admin
    .from("users")
    .select("id, email")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return { ok: false, error: "Miembro no encontrado" };
  }
  if (existing.email !== parsed.data.email) {
    const { data: clash } = await admin
      .from("users")
      .select("id")
      .eq("email", parsed.data.email)
      .maybeSingle();
    if (clash && clash.id !== id) {
      return {
        ok: false,
        error: "Ese correo ya pertenece a otro miembro",
        fieldErrors: { email: ["Ya está en uso"] },
      };
    }

    // Actualizar email en auth.users
    const { error: authErr } = await admin.auth.admin.updateUserById(id, {
      email: parsed.data.email,
      email_confirm: true,
    });
    if (authErr) {
      return { ok: false, error: `Auth: ${authErr.message}` };
    }
  }

  // Actualizar public.users
  const { error: dbErr } = await admin
    .from("users")
    .update({
      email: parsed.data.email,
      nombre_completo: parsed.data.nombre_completo,
      cargo: parsed.data.cargo || null,
      rol: parsed.data.rol,
    })
    .eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidateAll();
  return { ok: true, data: true };
}

/**
 * Cambia la contraseña de un miembro (admin no necesita la contraseña actual).
 */
export async function cambiarPasswordMiembroAction(
  id: string,
  input: { password: string }
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  if (IS_MOCK()) {
    return {
      ok: false,
      error: "Cambiar contraseña requiere Supabase configurado",
    };
  }

  const parsed = cambiarPasswordMiembroSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Contraseña inválida",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: true };
}

/**
 * Elimina permanentemente un miembro: borra de auth.users (cascade borra public.users).
 * - No permite auto-eliminación
 * - Si tiene gastos asociados, falla con mensaje claro (FK on delete restrict)
 */
export async function eliminarMiembroAction(
  id: string
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  if (IS_MOCK()) {
    return {
      ok: false,
      error: "Eliminar miembros requiere Supabase configurado",
    };
  }

  const me = await repo.users.current();
  if (me && me.id === id) {
    return {
      ok: false,
      error: "No puedes eliminarte a ti mismo. Pide a otro admin.",
    };
  }

  const admin = createSupabaseAdmin();

  // Verificar gastos asociados
  const { count } = await admin
    .from("gastos")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", id);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: tiene ${count} ${count === 1 ? "gasto registrado" : "gastos registrados"}. Desactívalo en su lugar para conservar el histórico.`,
    };
  }

  // Eliminar auth user (cascade borra public.users por la FK on delete cascade)
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, data: true };
}
