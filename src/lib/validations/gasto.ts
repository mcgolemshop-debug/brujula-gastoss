import { z } from "zod";
import { METODOS_PAGO, UNIDADES } from "@/lib/constants";

export const gastoSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD"),
  hora: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora en formato HH:mm"),
  usuario_id: z.uuid({ message: "Usuario inválido" }),
  categoria_id: z.uuid({ message: "Selecciona una categoría" }),
  descripcion: z
    .string()
    .min(2, "Descripción demasiado corta (mín 2 caracteres)")
    .max(200, "Descripción demasiado larga (máx 200)")
    .trim(),
  cantidad: z
    .number({ message: "La cantidad debe ser un número" })
    .nonnegative("La cantidad no puede ser negativa")
    .max(100000, "Cantidad fuera de rango"),
  unidad: z.enum(UNIDADES, { message: "Selecciona una unidad" }),
  items: z
    .number({ message: "Items debe ser un número entero" })
    .int("Items debe ser entero")
    .positive("Mínimo 1 item")
    .max(10000, "Máximo 10,000 items"),
  precio_unitario_usd: z
    .number({ message: "Precio debe ser un número" })
    .nonnegative("El precio no puede ser negativo")
    .max(1000000, "Precio fuera de rango"),
  metodo_pago: z.enum(METODOS_PAGO, { message: "Selecciona un método de pago" }),
  lugar_compra: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  numero_factura: z
    .string()
    .max(80, "Máximo 80 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  va_a_inventario: z.boolean().optional(),
  mobiliario_id: z.uuid().nullable().optional(),
  observaciones: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type GastoFormInput = z.infer<typeof gastoSchema>;

/** Validación parcial usada por el multi-step form (un paso a la vez) */
export const gastoStepSchemas = {
  categoria: gastoSchema.pick({ categoria_id: true }),
  detalles: gastoSchema.pick({
    descripcion: true,
    cantidad: true,
    unidad: true,
    items: true,
    precio_unitario_usd: true,
  }),
  pago: gastoSchema.pick({
    fecha: true,
    hora: true,
    metodo_pago: true,
    lugar_compra: true,
    numero_factura: true,
  }),
  inventario: gastoSchema.pick({
    va_a_inventario: true,
    observaciones: true,
  }),
} as const;

/**
 * Schema para edición de gasto: omite usuario_id (no se cambia el autor)
 * y la tasa de cambio queda inmutable. El código G-XXXX tampoco se edita.
 */
export const editGastoSchema = gastoSchema.omit({ usuario_id: true });
export type EditGastoFormInput = z.infer<typeof editGastoSchema>;

/**
 * === Lote de gastos ===
 * Registro de varios gastos a la vez compartiendo meta-datos.
 *
 * Header: campos comunes (fecha, hora, usuario, método de pago, lugar, número factura).
 * Rows: campos únicos por gasto (descripción, cantidad, unidad, items, precio, categoría…).
 */

export const loteHeaderSchema = gastoSchema.pick({
  fecha: true,
  hora: true,
  usuario_id: true,
  metodo_pago: true,
  lugar_compra: true,
  numero_factura: true,
});

export const loteRowSchema = gastoSchema.pick({
  categoria_id: true,
  descripcion: true,
  cantidad: true,
  unidad: true,
  items: true,
  precio_unitario_usd: true,
  observaciones: true,
  va_a_inventario: true,
  mobiliario_id: true,
});

export const loteGastosSchema = z
  .object({
    header: loteHeaderSchema,
    rows: z
      .array(loteRowSchema)
      .min(1, "Agrega al menos un gasto al lote")
      .max(20, "Máximo 20 gastos por lote"),
  })
  .superRefine((val, ctx) => {
    // Warning suave si dos filas son iguales (misma categoría + descripción).
    // No bloquea el submit; el usuario decide.
    const seen = new Map<string, number>();
    val.rows.forEach((r, i) => {
      const key = `${r.categoria_id}::${r.descripcion.toLowerCase().trim()}`;
      const prev = seen.get(key);
      if (prev !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["rows", i, "descripcion"],
          message: `Posible duplicado de la fila #${prev + 1}`,
        });
      } else {
        seen.set(key, i);
      }
    });
  });

export type LoteHeaderInput = z.infer<typeof loteHeaderSchema>;
export type LoteRowInput = z.infer<typeof loteRowSchema>;
export type LoteGastosInput = z.infer<typeof loteGastosSchema>;
