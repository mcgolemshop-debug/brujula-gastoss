/**
 * Catalejo · Mapper determinista.
 *
 * El LLM transcribe; el mapper CALCULA. Nunca se confía en la aritmética del
 * modelo: aquí se hace el prorrateo de IVA, el manejo de líneas por peso, la
 * fusión de duplicados, el parseo de fechas venezolanas y la conversión Bs→USD.
 * Todas las funciones son puras (fácil de testear).
 */

import type { ExtraccionComprobante, ItemExtraido } from "./contract";
import { UNIDADES, METODOS_PAGO } from "@/lib/constants";
import type { MetodoPago } from "@/types/domain";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/** Normaliza texto para comparar: minúsculas, sin acentos, espacios colapsados */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Fecha y hora (formato venezolano)
// ---------------------------------------------------------------------------

/** "25-06-2026" | "25/06/2026" | "2026-06-25" → "2026-06-25". null si inválida. */
export function parseFechaVe(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // Ya viene ISO
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return validarFecha(+y, +mo, +d) ? `${y}-${mo}-${d}` : null;
  }
  // dd-mm-yyyy o dd/mm/yyyy (NUNCA mes primero en Venezuela)
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const d = +m[1];
    const mo = +m[2];
    const y = +m[3];
    return validarFecha(y, mo, d)
      ? `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      : null;
  }
  return null;
}

function validarFecha(y: number, mo: number, d: number): boolean {
  return y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
}

/** "04:43:24PM" | "21:09" | "9:05 am" → "16:43" | "21:09" | "09:05". null si no hay. */
export function parseHoraVe(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // 12h con AM/PM
  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp])[Mm]?\.?$/);
  if (m) {
    let h = +m[1];
    const min = +m[2];
    const pm = /[Pp]/.test(m[3]);
    if (h === 12) h = 0;
    if (pm) h += 12;
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  // 24h
  m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const h = +m[1];
    const min = +m[2];
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Enums del sistema
// ---------------------------------------------------------------------------

/** Match contra UNIDADES; fallback "Unidad" */
export function mapUnidad(u: string | null | undefined): string {
  if (!u) return "Unidad";
  const n = normalizar(u);
  const hit = UNIDADES.find((x) => normalizar(x) === n);
  if (hit) return hit;
  // Sinónimos comunes
  if (/^(kilo|kilogramo|kg)/.test(n)) return "Kg";
  if (/^(litro|lt|l)$/.test(n)) return "Litros";
  if (/^(gr|gramo)/.test(n)) return "Gramos";
  if (/^(und|un|u|pieza|pza)$/.test(n)) return "Unidad";
  return "Unidad";
}

export interface CategoriaRef {
  id: string;
  nombre: string;
}

/** Resuelve el nombre sugerido → categoria_id real. Fallback "Otros". */
export function mapCategoria(
  sugerida: string | null | undefined,
  categorias: CategoriaRef[]
): { id: string; fallback: boolean } {
  const otros =
    categorias.find((c) => normalizar(c.nombre) === "otros") ?? categorias[0];
  if (!sugerida) return { id: otros?.id ?? "", fallback: true };
  const n = normalizar(sugerida);
  const hit = categorias.find((c) => normalizar(c.nombre) === n);
  if (hit) return { id: hit.id, fallback: false };
  return { id: otros?.id ?? "", fallback: true };
}

/** Deriva método de pago válido desde la sugerencia o el subtipo. */
export function mapMetodoPago(
  sugerido: string | null | undefined,
  subtipo: ExtraccionComprobante["subtipo"],
  moneda: "Bs" | "USD"
): MetodoPago | null {
  if (sugerido) {
    const n = normalizar(sugerido);
    const hit = METODOS_PAGO.find((m) => normalizar(m) === n);
    if (hit) return hit;
  }
  switch (subtipo) {
    case "pago_movil":
      return "Pago Móvil";
    case "transferencia":
      return "Transferencia";
    case "voucher_pos":
      return "Tarjeta";
    case "zelle":
      return "Zelle";
    default:
      return moneda === "USD" ? "Efectivo $" : null;
  }
}

// ---------------------------------------------------------------------------
// IVA + duplicados
// ---------------------------------------------------------------------------

export interface ItemProrrateado extends ItemExtraido {
  total_linea_final: number; // con IVA si aplica (en la moneda del documento)
  precio_unitario_final: number; // por unidad, con IVA si aplica
}

/**
 * Regla dura: en tickets SENIAT los precios por línea vienen SIN IVA. Se recarga
 * la alícuota a las líneas gravadas (G); las exentas (E) quedan intactas. Si el
 * documento no distingue G/E (todos iva=null) NO se prorratea.
 */
export function prorratearItems(
  ex: ExtraccionComprobante
): ItemProrrateado[] {
  const distingue = ex.items.some((it) => it.iva === "G" || it.iva === "E");
  const alicuota =
    ex.alicuota_iva ?? (ex.iva_monto && ex.iva_monto > 0 ? 16 : 0);

  return ex.items.map((it) => {
    const factor = distingue && it.iva === "G" ? 1 + alicuota / 100 : 1;
    const total_linea_final = round2(it.total_linea * factor);
    const unidades = it.unidades > 0 ? it.unidades : 1;
    const precio_unitario_final = round2(total_linea_final / unidades);
    return { ...it, total_linea_final, precio_unitario_final };
  });
}

/** Fusiona líneas idénticas (misma descripción + mismo precio unitario final). */
export function fusionarDuplicados(
  items: ItemProrrateado[]
): ItemProrrateado[] {
  const map = new Map<string, ItemProrrateado>();
  for (const it of items) {
    const key = `${normalizar(it.descripcion)}|${it.precio_unitario_final}`;
    const prev = map.get(key);
    if (prev) {
      prev.unidades += it.unidades;
      prev.total_linea_final = round2(
        prev.total_linea_final + it.total_linea_final
      );
      if (normalizar(prev.unidad) === normalizar(it.unidad)) {
        prev.cantidad = round4(prev.cantidad + it.cantidad);
      }
    } else {
      map.set(key, { ...it });
    }
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Construcción del prefill
// ---------------------------------------------------------------------------

export interface MapperContext {
  /** Bs por 1 USD (para convertir el monto guardado a USD) */
  tasa: number;
  usuarioId: string;
  categorias: CategoriaRef[];
}

export interface FilaPrefill {
  categoria_id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  items: number;
  /** Guardado en USD (la UI lo muestra en Bs vía MoneyInput en modo Bs) */
  precio_unitario_usd: number;
  observaciones: string;
  va_a_inventario: boolean;
  mobiliario_id: null;
  /** Marca para resaltar la fila en la UI (baja confianza / categoría fallback) */
  _revisar: boolean;
}

export interface HeaderPrefill {
  fecha: string;
  hora: string;
  usuario_id: string;
  metodo_pago: MetodoPago | "";
  lugar_compra: string;
  numero_factura: string;
}

export interface PrefillMeta {
  comercio: string | null;
  totalImpresoBs: number | null;
  sumaFilasBs: number;
  cuadra: boolean;
  conteoEsperado: number | null;
  conteoObtenido: number;
}

export type Prefill =
  | {
      destino: "lote";
      moneda: "Bs" | "USD";
      header: HeaderPrefill;
      rows: FilaPrefill[];
      advertencias: string[];
      meta: PrefillMeta;
    }
  | {
      destino: "gasto";
      moneda: "Bs" | "USD";
      // Campos del gasto individual (descripcion y categoria las pone el humano)
      values: {
        fecha: string;
        hora: string;
        metodo_pago: MetodoPago | "";
        lugar_compra: string;
        numero_factura: string;
        cantidad: number;
        unidad: string;
        items: number;
        precio_unitario_usd: number;
        observaciones: string;
      };
      advertencias: string[];
      meta: PrefillMeta;
    }
  | { destino: "ilegible"; advertencias: string[] };

/** Convierte un monto de la moneda del documento a USD (para guardar). */
function aUsd(monto: number, moneda: "Bs" | "USD", tasa: number): number {
  if (moneda === "USD") return round4(monto);
  if (!(tasa > 0)) return round4(monto); // defensivo: sin tasa no convertimos
  return round4(monto / tasa);
}

function lugarDeCompra(ex: ExtraccionComprobante): string {
  const partes = [ex.comercio.nombre, ex.comercio.direccion].filter(Boolean);
  return partes.join(" · ").slice(0, 200);
}

function observacionesPago(ex: ExtraccionComprobante): string {
  const bits: string[] = [];
  if (ex.banco_emisor || ex.banco_receptor) {
    bits.push(
      `${ex.banco_emisor ?? "?"} → ${ex.banco_receptor ?? "?"}`.replace(
        " → ?",
        ""
      )
    );
  }
  if (ex.beneficiario) bits.push(`benef. ${ex.beneficiario}`);
  return bits.length ? `Catalejo: ${bits.join(" · ")}`.slice(0, 500) : "";
}

const TOL = (total: number) => Math.max(5, total * 0.005);

export function construirPrefill(
  ex: ExtraccionComprobante,
  ctx: MapperContext
): Prefill {
  if (ex.tipo_documento === "ilegible") {
    return {
      destino: "ilegible",
      advertencias: ex.advertencias.length
        ? ex.advertencias
        : ["No se pudo leer el comprobante."],
    };
  }

  const fecha = parseFechaVe(ex.fecha) ?? "";
  const hora = parseHoraVe(ex.hora) ?? "";
  const metodo = mapMetodoPago(ex.metodo_pago_sugerido, ex.subtipo, ex.moneda);
  const advertencias = [...ex.advertencias];
  if (!hora) advertencias.push("El comprobante no indica la hora.");

  // --- Comprobante sin ítems → gasto individual ---
  const conItems =
    ex.tipo_documento === "factura_con_items" && ex.items.length >= 1;

  if (!conItems) {
    const totalBs = ex.total ?? 0;
    const meta: PrefillMeta = {
      comercio: ex.comercio.nombre,
      totalImpresoBs: ex.total,
      sumaFilasBs: totalBs,
      cuadra: true,
      conteoEsperado: null,
      conteoObtenido: 0,
    };
    return {
      destino: "gasto",
      moneda: ex.moneda,
      values: {
        fecha,
        hora,
        metodo_pago: metodo ?? "",
        lugar_compra: lugarDeCompra(ex),
        numero_factura: ex.numero_documento ?? "",
        cantidad: 1,
        unidad: "Unidad",
        items: 1,
        precio_unitario_usd: aUsd(totalBs, ex.moneda, ctx.tasa),
        observaciones: observacionesPago(ex),
      },
      advertencias,
      meta,
    };
  }

  // --- Factura con ítems → lote (o 1 gasto si hay una sola fila) ---
  const prorrateados = prorratearItems(ex);
  const fusionados = fusionarDuplicados(prorrateados);

  const sumaFilasBs = round2(
    fusionados.reduce((s, it) => s + it.total_linea_final, 0)
  );
  const cuadra =
    ex.total == null || Math.abs(sumaFilasBs - ex.total) <= TOL(ex.total);
  if (!cuadra && ex.total != null) {
    advertencias.push(
      `La suma de las filas (Bs ${sumaFilasBs.toLocaleString("es-VE")}) no coincide con el total del comprobante (Bs ${ex.total.toLocaleString("es-VE")}): revisa los montos.`
    );
  }
  if (
    ex.conteo_items_impreso != null &&
    ex.conteo_items_impreso !== prorrateados.length
  ) {
    advertencias.push(
      `El comprobante declara ${ex.conteo_items_impreso} artículos pero se leyeron ${prorrateados.length}: puede faltar alguna línea.`
    );
  }

  const rows: FilaPrefill[] = fusionados.map((it) => {
    const cat = mapCategoria(it.categoria_sugerida, ctx.categorias);
    const revisar = cat.fallback || it.confianza < 0.7;
    return {
      categoria_id: cat.id,
      descripcion: it.descripcion,
      cantidad: it.cantidad > 0 ? it.cantidad : 1,
      unidad: mapUnidad(it.unidad),
      items: it.unidades > 0 ? it.unidades : 1,
      precio_unitario_usd: aUsd(it.precio_unitario_final, ex.moneda, ctx.tasa),
      observaciones: "",
      va_a_inventario: false,
      mobiliario_id: null,
      _revisar: revisar,
    };
  });

  const meta: PrefillMeta = {
    comercio: ex.comercio.nombre,
    totalImpresoBs: ex.total,
    sumaFilasBs,
    cuadra,
    conteoEsperado: ex.conteo_items_impreso,
    conteoObtenido: rows.length,
  };

  const header: HeaderPrefill = {
    fecha,
    hora,
    usuario_id: ctx.usuarioId,
    metodo_pago: metodo ?? "",
    lugar_compra: lugarDeCompra(ex),
    numero_factura: ex.numero_documento ?? "",
  };

  // Una sola fila → gasto individual (mismo mapeo, sin armar un lote de 1)
  if (rows.length === 1) {
    const r = rows[0];
    return {
      destino: "gasto",
      moneda: ex.moneda,
      values: {
        fecha,
        hora,
        metodo_pago: metodo ?? "",
        lugar_compra: header.lugar_compra,
        numero_factura: header.numero_factura,
        cantidad: r.cantidad,
        unidad: r.unidad,
        items: r.items,
        precio_unitario_usd: r.precio_unitario_usd,
        observaciones: r.observaciones,
      },
      advertencias,
      meta,
    };
  }

  return { destino: "lote", moneda: ex.moneda, header, rows, advertencias, meta };
}
