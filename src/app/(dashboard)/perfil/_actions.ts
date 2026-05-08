"use server";

import { revalidatePath } from "next/cache";
import {
  datosPerfilSchema,
  cambiarPasswordSchema,
} from "@/lib/validations/perfil";
import { repo } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import type { ActionResult } from "../gastos/_actions";

const IS_MOCK = () => process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

/**
 * Actualiza nombre + teléfono del usuario actual.
 */
export async function actualizarDatosPerfilAction(input: {
  nombre_completo: string;
  telefono?: string;
}): Promise<ActionResult<true>> {
  const parsed = datosPerfilSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };

  try {
    await repo.users.updateSelf(me.id, {
      nombre_completo: parsed.data.nombre_completo,
      telefono:
        parsed.data.telefono === "" || parsed.data.telefono === undefined
          ? null
          : parsed.data.telefono,
    });
    revalidatePath("/perfil");
    revalidatePath("/", "layout");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}

/**
 * Cambia la contraseña del usuario actual.
 * Verifica la contraseña actual antes de cambiarla.
 */
export async function cambiarPasswordAction(input: {
  actual: string;
  nueva: string;
  confirmar: string;
}): Promise<ActionResult<true>> {
  const parsed = cambiarPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const first = Object.values(fieldErrors).flat()[0] ?? "Datos inválidos";
    return { ok: false, error: first, fieldErrors };
  }

  if (IS_MOCK()) {
    return {
      ok: false,
      error: "Cambio de contraseña requiere Supabase configurado",
    };
  }

  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };

  const sb = await createSupabaseServerClient();

  // 1. Verificar contraseña actual
  const { error: verifyErr } = await sb.auth.signInWithPassword({
    email: me.email,
    password: parsed.data.actual,
  });
  if (verifyErr) {
    return { ok: false, error: "Contraseña actual incorrecta" };
  }

  // 2. Actualizar a la nueva
  const { error } = await sb.auth.updateUser({
    password: parsed.data.nueva,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, data: true };
}

/**
 * Sube avatar al bucket "avatars" y actualiza users.avatar_url.
 */
export async function subirAvatarAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Archivo inválido" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Archivo muy grande (máx 5 MB)" };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Solo JPG, PNG o WebP" };
  }

  if (IS_MOCK()) {
    return {
      ok: false,
      error: "Subida de avatar requiere Supabase configurado",
    };
  }

  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };

  const sb = await createSupabaseServerClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${me.id}/avatar-${Date.now()}.${ext}`;

  // Borrar avatares previos del usuario (limpieza)
  const { data: prev } = await sb.storage.from("avatars").list(me.id, {
    limit: 100,
  });
  if (prev && prev.length > 0) {
    await sb.storage
      .from("avatars")
      .remove(prev.map((f) => `${me.id}/${f.name}`));
  }

  const { error: upErr } = await sb.storage
    .from("avatars")
    .upload(fileName, file, { cacheControl: "3600", upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: urlData } = sb.storage.from("avatars").getPublicUrl(fileName);
  // Cache-buster para que el browser no muestre versión vieja
  const url = `${urlData.publicUrl}?v=${Date.now()}`;

  await repo.users.updateSelf(me.id, { avatar_url: url });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true, data: { url } };
}

/**
 * Elimina avatar del bucket + setea avatar_url a null.
 */
export async function eliminarAvatarAction(): Promise<ActionResult<true>> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }

  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };

  const sb = await createSupabaseServerClient();

  const { data: prev } = await sb.storage.from("avatars").list(me.id, {
    limit: 100,
  });
  if (prev && prev.length > 0) {
    await sb.storage
      .from("avatars")
      .remove(prev.map((f) => `${me.id}/${f.name}`));
  }

  await repo.users.updateSelf(me.id, { avatar_url: null });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { ok: true, data: true };
}

/**
 * Cierra todas las sesiones del usuario en otros dispositivos.
 * Mantiene la sesión actual activa.
 */
export async function cerrarOtrasSesionesAction(): Promise<
  ActionResult<true>
> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signOut({ scope: "others" });
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: true };
}

/**
 * Envía un push de prueba al usuario actual (verifica que su sub está activa).
 */
export async function enviarPushPruebaAction(): Promise<ActionResult<{ count: number }>> {
  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  try {
    const count = await sendPushToUser(me.id, {
      title: "🔔 Prueba de notificación",
      body: "Si ves esto, las notificaciones push están funcionando.",
      url: "/perfil",
      tag: "test-push",
    });
    if (count === 0) {
      return {
        ok: false,
        error: "No tienes ninguna suscripción activa en este navegador",
      };
    }
    return { ok: true, data: { count } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error enviando push",
    };
  }
}

/**
 * Inscribe el usuario actual a 2FA TOTP. Devuelve el QR + secret.
 */
export async function enrollMfaAction(): Promise<
  ActionResult<{ factorId: string; qrCode: string; secret: string }>
> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Brújula Markets",
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Sin datos de enroll" };
  return {
    ok: true,
    data: {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

/**
 * Verifica el código TOTP que ingresa el usuario para confirmar el 2FA.
 */
export async function verifyMfaAction(input: {
  factorId: string;
  code: string;
}): Promise<ActionResult<true>> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }
  if (!/^\d{6}$/.test(input.code)) {
    return { ok: false, error: "El código debe ser 6 dígitos" };
  }
  const sb = await createSupabaseServerClient();
  const { data: challengeData, error: chErr } = await sb.auth.mfa.challenge({
    factorId: input.factorId,
  });
  if (chErr || !challengeData) {
    return { ok: false, error: chErr?.message ?? "No se pudo emitir reto MFA" };
  }
  const { error: verErr } = await sb.auth.mfa.verify({
    factorId: input.factorId,
    challengeId: challengeData.id,
    code: input.code,
  });
  if (verErr) return { ok: false, error: verErr.message };
  revalidatePath("/perfil");
  return { ok: true, data: true };
}

/**
 * Quita el factor 2FA del usuario.
 */
export async function unenrollMfaAction(
  factorId: string
): Promise<ActionResult<true>> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }
  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/perfil");
  return { ok: true, data: true };
}

/**
 * Devuelve los factores MFA inscritos del usuario actual.
 */
export async function listMfaFactorsAction(): Promise<
  ActionResult<{ factors: { id: string; status: string; friendly_name: string | null }[] }>
> {
  if (IS_MOCK()) {
    return { ok: true, data: { factors: [] } };
  }
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.auth.mfa.listFactors();
  if (error) return { ok: false, error: error.message };
  const factors =
    data?.totp.map((f) => ({
      id: f.id,
      status: f.status,
      friendly_name: f.friendly_name ?? null,
    })) ?? [];
  return { ok: true, data: { factors } };
}

/**
 * Elimina la cuenta del usuario actual (irreversible).
 * No expuesto en UI por defecto pero disponible si admin lo necesita.
 */
export async function eliminarMiCuentaAction(): Promise<ActionResult<true>> {
  if (IS_MOCK()) {
    return { ok: false, error: "Requiere Supabase configurado" };
  }
  const me = await repo.users.current();
  if (!me) return { ok: false, error: "No autenticado" };
  if (me.rol === "admin") {
    return {
      ok: false,
      error: "Un admin no puede auto-eliminarse. Pide a otro admin.",
    };
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(me.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}
