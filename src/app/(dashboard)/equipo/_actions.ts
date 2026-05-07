"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/repositories";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "../gastos/_actions";

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

  revalidatePath("/equipo");
  return { ok: true, data: true };
}

export async function cambiarRolAction(
  id: string,
  rol: "admin" | "empleado"
): Promise<ActionResult<true>> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("users").update({ rol }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/equipo");
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
