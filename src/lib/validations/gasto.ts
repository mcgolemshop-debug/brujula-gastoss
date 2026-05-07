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
