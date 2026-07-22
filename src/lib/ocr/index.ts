/**
 * Catalejo · Orquestador cliente del escaneo de comprobantes.
 * comprime → sube a Storage tmp → invoca la Edge Function → valida con Zod.
 * En modo mock (NEXT_PUBLIC_DATA_SOURCE=mock) devuelve fixtures reales sin red.
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { comprimirComprobante } from "./compress";
import {
  extraccionComprobanteSchema,
  type ExtraccionComprobante,
} from "./contract";

let mockIdx = 0;

/** Carga diferida de fixtures: solo en modo mock, fuera del bundle de producción. */
async function fixtureMock(): Promise<ExtraccionComprobante> {
  const mods = await Promise.all([
    import("./__fixtures__/farmatodo.json"),
    import("./__fixtures__/misuper.json"),
    import("./__fixtures__/redvital.json"),
    import("./__fixtures__/banesco.json"),
    import("./__fixtures__/bdv.json"),
    import("./__fixtures__/cce.json"),
  ]);
  const ex = mods[mockIdx % mods.length].default as unknown as ExtraccionComprobante;
  mockIdx++;
  return ex;
}

export interface EscanearConfig {
  usuarioId: string;
  categoriasNombres: string[];
  unidades: string[];
  metodos: string[];
  signal?: AbortSignal;
}

export interface EscaneoResultado {
  extraccion: ExtraccionComprobante;
  tmpPath: string | null; // null en mock
}

export class EscaneoError extends Error {
  retriable: boolean;
  constructor(message: string, retriable = false) {
    super(message);
    this.retriable = retriable;
  }
}

const IS_MOCK = () => process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

export async function escanearComprobante(
  file: File,
  cfg: EscanearConfig
): Promise<EscaneoResultado> {
  // --- Modo mock: fixtures, sin red ---
  if (IS_MOCK()) {
    const ex = await fixtureMock();
    await new Promise((r) => setTimeout(r, 400)); // simula latencia
    return { extraccion: structuredClone(ex), tmpPath: null };
  }

  const supabase = createSupabaseBrowserClient();

  // 1. Comprimir
  const { blob, mimeType } = await comprimirComprobante(file);

  // 2. Subir a tmp bajo el prefijo del propio usuario
  const ext = mimeType === "application/pdf" ? "pdf" : "jpg";
  const tmpPath = `${cfg.usuarioId}/scan-tmp/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("facturas")
    .upload(tmpPath, blob, { contentType: mimeType, upsert: false });
  if (upErr) throw new EscaneoError(`No se pudo subir la imagen: ${upErr.message}`);

  // 3. Invocar la Edge Function (fetch directo → soporta AbortController)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/extraer-comprobante`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        path: tmpPath,
        mimeType,
        categorias: cfg.categoriasNombres,
        unidades: cfg.unidades,
        metodos: cfg.metodos,
      }),
      signal: cfg.signal,
    });
  } catch {
    if (cfg.signal?.aborted) throw new EscaneoError("Escaneo cancelado");
    throw new EscaneoError("No se pudo contactar el lector", true);
  }

  const body = await res.json().catch(() => null);
  if (res.status === 429) {
    throw new EscaneoError(
      "El lector alcanzó su límite por hoy. Registra manual o intenta más tarde.",
      true
    );
  }
  if (!res.ok || !body?.ok) {
    throw new EscaneoError(
      body?.error ?? `Error del lector (${res.status})`,
      body?.retriable ?? false
    );
  }

  // 4. Validar el shape con Zod (nunca confiar en el proveedor)
  const parsed = extraccionComprobanteSchema.safeParse(body.data);
  if (!parsed.success) {
    throw new EscaneoError("El lector devolvió datos con formato inesperado");
  }

  return { extraccion: parsed.data, tmpPath };
}

export { construirPrefill } from "./mapper";
export type { Prefill } from "./mapper";
