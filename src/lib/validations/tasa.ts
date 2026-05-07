import { z } from "zod";

export const tasaCambioSchema = z.object({
  valor_bs_por_usd: z
    .number({ message: "Tasa debe ser un número" })
    .positive("Debe ser mayor a cero")
    .max(1000000, "Valor fuera de rango"),
  fuente: z
    .string()
    .min(2, "Especifica una fuente")
    .max(80, "Máximo 80 caracteres")
    .trim(),
});
export type TasaCambioInput = z.infer<typeof tasaCambioSchema>;
