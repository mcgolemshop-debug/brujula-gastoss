/**
 * Web Push · helper server-side para enviar notificaciones.
 *
 * Usa la lib `web-push` con las VAPID keys del .env. Si la sub está caducada
 * (410 Gone), la elimina automáticamente.
 *
 * IMPORTANT: solo importar desde server-side (API routes, cron, server actions).
 */

import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

interface PushSubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
}

async function sendOne(sub: PushSubRow, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth_secret,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "statusCode" in err
        ? Number((err as { statusCode: number }).statusCode)
        : 0;
    if (code === 404 || code === 410) {
      // Sub caducada — la borramos
      const sb = createSupabaseAdmin();
      await sb
        .from("notificaciones_push_subs")
        .delete()
        .eq("endpoint", sub.endpoint);
    }
    return false;
  }
}

async function sendToSubs(
  subs: PushSubRow[],
  payload: PushPayload
): Promise<number> {
  if (!ensureConfigured() || subs.length === 0) return 0;
  const results = await Promise.allSettled(subs.map((s) => sendOne(s, payload)));
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

/** Envía push a todos los admin del sistema */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("notificaciones_push_subs")
    .select(
      "id, endpoint, p256dh, auth_secret, users!notificaciones_push_subs_usuario_id_fkey!inner(rol)"
    )
    .eq("users.rol", "admin");
  if (error || !data) return 0;
  return sendToSubs(data as unknown as PushSubRow[], payload);
}

/** Envía push a un usuario específico */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("notificaciones_push_subs")
    .select("id, endpoint, p256dh, auth_secret")
    .eq("usuario_id", userId);
  if (error || !data) return 0;
  return sendToSubs(data as unknown as PushSubRow[], payload);
}

/** Envía push a todo el equipo */
export async function sendPushToAll(payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("notificaciones_push_subs")
    .select("id, endpoint, p256dh, auth_secret");
  if (error || !data) return 0;
  return sendToSubs(data as unknown as PushSubRow[], payload);
}
