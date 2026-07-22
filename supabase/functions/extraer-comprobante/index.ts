// Catalejo · Edge Function `extraer-comprobante` (Deno).
// Verifica JWT → valida ruta ${uid}/scan-tmp/ → descarga imagen (service role) →
// llama a Gemini con salida estructurada → devuelve el contrato de extracción.
//
// Deploy: supabase functions deploy extraer-comprobante
// Secrets: supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.6-flash

import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { construirPrompt, construirResponseSchema } from "./prompt.ts";

// Modelo Flash GA vigente (jul 2026). Google retira versiones pinneadas cada
// ~6 meses (2.0-flash murió 2026-06-01; 2.5-flash muere 2026-10-16), así que
// esto se controla por el secret GEMINI_MODEL para poder rotarlo sin tocar código.
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

// CORS: la app (en Vercel, otro origen) llama a esta función desde el navegador,
// que primero hace un preflight OPTIONS. Hay que responderlo y adjuntar los
// headers CORS a TODAS las respuestas.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", ...CORS },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  try {
    // 1. Verificar sesión del usuario
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const {
      data: { user },
    } = await supaUser.auth.getUser();
    if (!user) return json({ ok: false, error: "No autenticado" }, 401);

    const { path, mimeType, categorias, unidades, metodos } = await req.json();

    // 2. Validar ruta: SOLO scan-tmp del propio usuario
    if (typeof path !== "string" || !path.startsWith(`${user.id}/scan-tmp/`)) {
      return json({ ok: false, error: "Ruta inválida" }, 400);
    }

    // 3. Descargar la imagen con service role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: blob, error: dlErr } = await admin.storage.from("facturas").download(path);
    if (dlErr || !blob) return json({ ok: false, error: "No se pudo leer el archivo" }, 400);
    if (blob.size > 8_000_000) return json({ ok: false, error: "Archivo demasiado grande" }, 400);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ ok: false, error: "GEMINI_API_KEY no configurada" }, 500);

    // 4. Llamar a Gemini (una sola llamada: clasifica + extrae)
    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType ?? blob.type ?? "image/jpeg",
                data: encodeBase64(new Uint8Array(await blob.arrayBuffer())),
              },
            },
            { text: construirPrompt({ categorias, unidades, metodos }) },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        response_mime_type: "application/json",
        response_schema: construirResponseSchema({ categorias, unidades, metodos }),
        maxOutputTokens: 16384,
      },
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      },
    );

    if (r.status === 429) {
      const q = await r.text().catch(() => "");
      console.error("[extraer-comprobante] 429 de Gemini:", q);
      return json(
        { ok: false, error: `cuota_agotada: ${q.slice(0, 500)}`, retriable: true },
        429
      );
    }
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error(`[extraer-comprobante] ${r.status} de Gemini:`, errText);
      return json(
        { ok: false, error: `proveedor_${r.status}: ${errText.slice(0, 400)}` },
        502
      );
    }

    const out = await r.json();
    // deno-lint-ignore no-explicit-any
    const text = (out.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p.text ?? "")
      .join("");
    if (!text) return json({ ok: false, error: "respuesta_vacia", retriable: true }, 502);

    return json({ ok: true, data: JSON.parse(text) });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
