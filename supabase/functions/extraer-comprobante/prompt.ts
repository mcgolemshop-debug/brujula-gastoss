// Catalejo · Prompt + response_schema para Gemini (Deno / Edge Function).
// Las listas (categorías/unidades/métodos) viajan desde el cliente para no tener
// dos fuentes de verdad.

interface Cfg {
  categorias?: string[];
  unidades?: string[];
  metodos?: string[];
}

function san(list: unknown, fallback: string[]): string[] {
  if (!Array.isArray(list)) return fallback;
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.slice(0, 40))
    .slice(0, 30);
}

const CAT_FALLBACK = [
  "Comida", "Ferretería", "Limpieza", "Repuestos", "Aceites Carro/Moto",
  "Mobiliario", "Tecnología/Dispositivos", "Servicios", "Combustible",
  "Medicinas", "Papelería/Oficina", "Otros",
];
const UNI_FALLBACK = [
  "Unidad", "Kg", "Gramos", "Litros", "ml", "Docena", "Paquete", "Caja",
  "Bolsa", "Metro", "Galón", "Par", "Set",
];
const MET_FALLBACK = [
  "Efectivo $", "Efectivo Bs", "Transferencia", "Pago Móvil", "Zelle",
  "Tarjeta", "Binance", "Otro",
];

export function construirPrompt(cfg: Cfg): string {
  const categorias = san(cfg.categorias, CAT_FALLBACK);
  const unidades = san(cfg.unidades, UNI_FALLBACK);
  const metodos = san(cfg.metodos, MET_FALLBACK);
  return `
Eres un extractor de datos de comprobantes de gasto de VENEZUELA. Recibes UNA foto
(o PDF) y devuelves EXCLUSIVAMENTE un JSON válido según el esquema configurado.
Nada de texto adicional.

TIPOS DE DOCUMENTO que verás:
A) "factura_con_items": facturas/tickets fiscales SENIAT de comercios (Farmatodo,
   supermercados, ferreterías...). Tienen encabezado con RIF y dirección, número de
   factura, fecha/hora, un desglose de ítems con precios, bloques de impuestos
   (EXENTO, BI G16,00%, IVA) y un TOTAL. Suelen indicar el pago: "TARJ. DEBITO",
   "PUNTO", "EFECTIVO".
B) "comprobante_sin_items": capturas de pago móvil (PagomóvilBDV, "PAGO MOVIL CCE",
   recibos Banesco/Provincial/etc.), transferencias, vouchers de punto de venta o
   capturas de Zelle. Traen monto, fecha, referencia/operación y a veces bancos y
   beneficiario. NO traen qué se compró.
C) "ilegible": no se distingue lo esencial (ni monto total legible).

REGLAS DE LECTURA:
1. Números en formato venezolano: punto = miles, coma = decimales ("34.955,62" =
   34955.62). En el JSON usa números con punto decimal.
2. Fechas dd-mm-aaaa o dd/mm/aaaa. NUNCA mes primero. Normaliza a "YYYY-MM-DD".
   Horas: normaliza a 24 h ("04:43:24PM" -> "16:43"). Si no hay hora en el
   documento, hora = null (NO uses la hora de la barra de estado del teléfono).
3. Una foto puede mostrar un ticket largo PARTIDO EN DOS COLUMNAS: es UN solo
   documento continuo; lee la columna izquierda completa y luego la derecha.
4. En tickets SENIAT un ítem puede ocupar 2-3 renglones: nombre (con marca (G) o
   (E)), un código interno, y una línea de cantidad tipo "0,535xBs 5.480,66",
   "3x Bs 82,31" o "0,500 KG X 277,22". Esa línea pertenece al ítem cuyo nombre la
   precede. El monto de la fila va en su total_linea. Si la columna de montos se ve
   desplazada por la foto, empareja POR ORDEN DE FILA.
5. Para cada ítem: unidades = repeticiones ("2x" -> 2; por peso -> 1);
   cantidad = peso/volumen si es por Kg/Litros (ej. 0.535), si no = unidades;
   precio_unitario = precio por unidad (o por Kg); total_linea = monto impreso.
   Copia los montos IMPRESOS tal cual: NO les agregues IVA, no recalcules.
   Registra iva = "G" o "E" según la marca de la línea.
6. Ítems repetidos idénticos: repórtalos como líneas separadas, tal como salen.
7. La descripción del ítem: límpiala de códigos numéricos internos, conserva marca
   y presentación ("Compota Heinz Manzana 12x", "Pulpa de cerdo Kg").
8. Copia también, si aparecen: subtotal, iva_monto, alicuota_iva (16 si dice
   "G16,00%"), descuento, y el conteo impreso ("# ITEMS: 8", "ARTICULOS VENDIDOS").
9. En comprobantes de pago: numero_documento = número de referencia/operación;
   metodo_pago_sugerido = "Pago Móvil" para cualquier pago móvil (BDV, CCE,
   interbancario entre teléfonos), "Transferencia" si es entre cuentas, "Tarjeta"
   para vouchers de punto, "Zelle" para Zelle (y moneda "USD"). El campo "Concepto"
   ("pago", "PagomóvilBDV") NO es una descripción de compra: ignóralo como
   descripción. items = [].
10. categoria_sugerida: elige SOLO de esta lista, por el significado del ítem:
    ${categorias.join(", ")}. Ejemplos: alimentos y bebidas -> "Comida"; aseo del
    local (escobas, lavaplatos, esponjas, papel higiénico) -> "Limpieza"; tornillos
    y herramientas -> "Ferretería"; medicinas y farmacia -> "Medicinas"; artículos de
    oficina -> "Papelería/Oficina". Si no encaja con claridad -> "Otros" o null.
11. unidad: elige SOLO de: ${unidades.join(", ")}. metodo_pago_sugerido SOLO de:
    ${metodos.join(", ")}.
12. NO INVENTES NADA. Todo dato ausente = null. confianza por ítem y
    confianza_global entre 0 y 1 (baja si la foto está borrosa o cortada). Agrega
    advertencias útiles en español ("ticket cortado abajo", "montos poco legibles").
`.trim();
}

// deno-lint-ignore no-explicit-any
export function construirResponseSchema(cfg: Cfg): any {
  const unidades = san(cfg.unidades, UNI_FALLBACK);
  const metodos = san(cfg.metodos, MET_FALLBACK);
  const S = (t: string, extra = {}) => ({ type: t, ...extra });
  return {
    type: "OBJECT",
    properties: {
      tipo_documento: S("STRING", {
        enum: ["factura_con_items", "comprobante_sin_items", "ilegible"],
      }),
      subtipo: S("STRING", {
        enum: ["factura_seniat", "voucher_pos", "pago_movil", "transferencia", "zelle", "otro"],
      }),
      moneda: S("STRING", { enum: ["Bs", "USD"] }),
      comercio: {
        type: "OBJECT",
        properties: {
          nombre: S("STRING", { nullable: true }),
          rif: S("STRING", { nullable: true }),
          direccion: S("STRING", { nullable: true }),
        },
      },
      fecha: S("STRING", { nullable: true }),
      hora: S("STRING", { nullable: true }),
      numero_documento: S("STRING", { nullable: true }),
      metodo_pago_sugerido: S("STRING", { enum: metodos, nullable: true }),
      banco_emisor: S("STRING", { nullable: true }),
      banco_receptor: S("STRING", { nullable: true }),
      beneficiario: S("STRING", { nullable: true }),
      total: S("NUMBER", { nullable: true }),
      subtotal: S("NUMBER", { nullable: true }),
      iva_monto: S("NUMBER", { nullable: true }),
      alicuota_iva: S("NUMBER", { nullable: true }),
      descuento: S("NUMBER", { nullable: true }),
      conteo_items_impreso: S("INTEGER", { nullable: true }),
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            descripcion: S("STRING"),
            cantidad: S("NUMBER"),
            unidad: S("STRING", { enum: unidades }),
            unidades: S("NUMBER"),
            precio_unitario: S("NUMBER"),
            total_linea: S("NUMBER"),
            iva: S("STRING", { enum: ["G", "E"], nullable: true }),
            categoria_sugerida: S("STRING", { nullable: true }),
            confianza: S("NUMBER"),
          },
          required: ["descripcion", "cantidad", "unidad", "unidades", "precio_unitario", "total_linea", "confianza"],
        },
      },
      confianza_global: S("NUMBER"),
      advertencias: { type: "ARRAY", items: S("STRING") },
    },
    required: ["tipo_documento", "subtipo", "moneda", "items", "confianza_global", "advertencias"],
  };
}
