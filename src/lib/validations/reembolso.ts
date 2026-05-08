import { z } from "zod";
import { METODOS_PAGO } from "@/lib/constants";

export const reembolsoSchema = z.object({
  gasto_id: z.uuid({ message: "Gasto inválido" }),
  beneficiario_id: z.uuid({ message: "Beneficiario inválido" }),
  monto_usd: z
    .number({ message: "Monto USD requerido" })
    .positive("Monto debe ser mayor a 0")
    .max(1_000_000, "Monto fuera de rango"),
  monto_bs: z
    .number({ message: "Monto Bs requerido" })
    .nonnegative("Monto Bs no puede ser negativo")
    .max(1_000_000_000, "Monto Bs fuera de rango"),
  notas: z.string().max(500, "Máximo 500 caracteres").trim().optional().or(z.literal("")),
});

export type ReembolsoFormInput = z.infer<typeof reembolsoSchema>;

export const marcarPagadoSchema = z.object({
  metodo_pago: z.enum(METODOS_PAGO, { message: "Selecciona método de pago" }),
  fecha_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD"),
});

export type MarcarPagadoInput = z.infer<typeof marcarPagadoSchema>;
