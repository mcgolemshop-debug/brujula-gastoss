"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, magicLinkSchema } from "@/lib/validations/login";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Login con email + password contra Supabase Auth.
 */
export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  // Si DATA_SOURCE=mock, simulamos login (Fase 2 sin Supabase activado)
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "mock") {
    return { ok: true };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Datos inválidos";
    return { ok: false, error: first };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    // Mensajes amigables para errores comunes
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return { ok: false, error: "Correo o contraseña incorrectos" };
    }
    if (msg.includes("email not confirmed")) {
      return { ok: false, error: "Correo aún no confirmado" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Enviar magic link al correo.
 */
export async function magicLinkAction(input: {
  email: string;
}): Promise<AuthResult> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "mock") {
    return {
      ok: false,
      error: "Magic link disponible solo con Supabase activado",
    };
  }
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Correo inválido" };
  }
  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false, // no creamos cuentas desde magic link
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Sign out → limpia sesión y redirige a login.
 */
export async function signOutAction() {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "mock") {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
