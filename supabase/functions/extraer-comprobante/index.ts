// Catalejo · Edge Function `extraer-comprobante` (Deno).
// Verifica JWT → valida ruta ${uid}/scan-tmp/ → descarga imagen (service role) →
// llama a Gemini con salida estructurada → devuelve el contrato de extracción.
//
// Deploy: supabase functions deploy extraer-comprobante
// Secrets: supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash

import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { construirPrompt, construirResponseSchema } from "./prompt.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
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
        thinkingConfig: { thinkingBudget: 0 },
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

    if (r.status === 429) return json({ ok: false, error: "cuota_agotada", retriable: true }, 429);
    if (!r.ok) return json({ ok: false, error: `proveedor_${r.status}` }, 502);

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
