/**
 * Catalejo · Contrato de datos del escáner de comprobantes.
 *
 * Fuente de verdad única del shape que devuelve la Edge Function `extraer-comprobante`.
 * La Edge Function replica este shape en su `response_schema` de Gemini (no hay
 * import cruzado entre src/ y supabase/functions/). Todo lo que llega del proveedor
 * se valida con `extraccionComprobanteSchema` (Zod) antes de usarse.
 */

import { z } from "zod";

export type TipoDocumento =
  | "factura_con_items"
  | "comprobante_sin_items"
  | "ilegible";

export type SubtipoDocumento =
  | "factura_seniat"
  | "voucher_pos"
  | "pago_movil"
  | "transferencia"
  | "zelle"
  | "otro";

export interface ItemExtraido {
  descripcion: string;
  cantidad: number;
  unidad: string;
  unidades: number;
  precio_unitario: number;
  total_linea: number;
  iva: "G" | "E" | null;
  categoria_sugerida: string | null;
  confianza: number;
}

export interface ExtraccionComprobante {
  tipo_documento: TipoDocumento;
  subtipo: SubtipoDocumento;
  moneda: "Bs" | "USD";
  comercio: { nombre: string | null; rif: string | null; direccion: string | null };
  fecha: string | null;
  hora: string | null;
  numero_documento: string | null;
  metodo_pago_sugerido: string | null;
  banco_emisor: string | null;
  banco_receptor: string | null;
  beneficiario: string | null;
  total: number | null;
  subtotal: number | null;
  iva_monto: number | null;
  alicuota_iva: number | null;
  descuento: number | null;
  conteo_items_impreso: number | null;
  items: ItemExtraido[];
  confianza_global: number;
  advertencias: string[];
}

// ---- Zod: valida lo que devuelve la Edge Function ----

const numOrNull = z.number().finite().nullable();

export const itemExtraidoSchema = z.object({
  descripcion: z.string(),
  cantidad: z.number().finite().nonnegative(),
  unidad: z.string(),
  unidades: z.number().finite().positive(),
  precio_unitario: z.number().finite().nonnegative(),
  total_linea: z.number().finite().nonnegative(),
  iva: z.enum(["G", "E"]).nullable(),
  categoria_sugerida: z.string().nullable(),
  confianza: z.number().min(0).max(1),
});

export const extraccionComprobanteSchema = z.object({
  tipo_documento: z.enum([
    "factura_con_items",
    "comprobante_sin_items",
    "ilegible",
  ]),
  subtipo: z.enum([
    "factura_seniat",
    "voucher_pos",
    "pago_movil",
    "transferencia",
    "zelle",
    "otro",
  ]),
  moneda: z.enum(["Bs", "USD"]),
  comercio: z.object({
    nombre: z.string().nullable(),
    rif: z.string().nullable(),
    direccion: z.string().nullable(),
  }),
  fecha: z.string().nullable(),
  hora: z.string().nullable(),
  numero_documento: z.string().nullable(),
  metodo_pago_sugerido: z.string().nullable(),
  banco_emisor: z.string().nullable(),
  banco_receptor: z.string().nullable(),
  beneficiario: z.string().nullable(),
  total: numOrNull,
  subtotal: numOrNull,
  iva_monto: numOrNull,
  alicuota_iva: numOrNull,
  descuento: numOrNull,
  conteo_items_impreso: z.number().int().nonnegative().nullable(),
  items: z.array(itemExtraidoSchema),
  confianza_global: z.number().min(0).max(1),
  advertencias: z.array(z.string()),
});

/** Respuesta de la Edge Function (coherente con ActionResult del proyecto) */
export type ExtraccionResponse =
  | { ok: true; data: ExtraccionComprobante }
  | { ok: false; error: string; retriable?: boolean };
