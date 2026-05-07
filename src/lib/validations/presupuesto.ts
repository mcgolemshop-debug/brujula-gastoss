import { z } from "zod";

export const presupuestoSchema = z.object({
  categoria_id: z.uuid({ message: "Selecciona una categoría" }),
  mes: z
    .number({ message: "Mes debe ser número" })
    .int()
    .min(1, "Mes válido: 1-12")
    .max(12, "Mes válido: 1-12"),
  anio: z
    .number({ message: "Año debe ser número" })
    .int()
    .min(2024, "Año mínimo 2024")
    .max(2050, "Año máximo 2050"),
  monto_usd: z
    .number({ message: "Monto debe ser número" })
    .nonnegative("No puede ser negativo")
    .max(1000000, "Fuera de rango"),
});
export type PresupuestoFormInput = z.infer<typeof presupuestoSchema>;
