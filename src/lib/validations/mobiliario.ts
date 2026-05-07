import { z } from "zod";
import { TIPOS_MOBILIARIO, UBICACIONES } from "@/lib/constants";

const ESTADO_VALUES = [
  "nuevo",
  "buen_estado",
  "regular",
  "necesita_reparacion",
  "dado_de_baja",
] as const;

export const mobiliarioSchema = z.object({
  tipo: z.enum(TIPOS_MOBILIARIO, { message: "Selecciona el tipo" }),
  descripcion: z
    .string()
    .min(2, "Descripción demasiado corta")
    .max(200, "Máximo 200 caracteres")
    .trim(),
  marca_modelo: z
    .string()
    .max(120, "Máximo 120 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  serial: z
    .string()
    .max(120, "Máximo 120 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  cantidad: z
    .number({ message: "Cantidad debe ser un número" })
    .int("Debe ser entero")
    .positive("Mínimo 1")
    .max(10000, "Máximo 10,000"),
  estado: z.enum(ESTADO_VALUES, { message: "Selecciona el estado" }),
  ubicacion: z
    .enum(UBICACIONES, { message: "Selecciona ubicación" })
    .optional(),
  asignado_a: z.uuid().nullable().optional(),
  precio_compra_usd: z
    .number({ message: "Precio debe ser un número" })
    .nonnegative("No puede ser negativo")
    .max(1000000, "Precio fuera de rango"),
  fecha_ingreso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD"),
  fecha_ultimo_mantenimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type MobiliarioFormInput = z.infer<typeof mobiliarioSchema>;

export const cambiarEstadoSchema = z.object({
  id: z.uuid(),
  estado: z.enum(ESTADO_VALUES),
  notas: z.string().max(500).optional().or(z.literal("")),
});
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
