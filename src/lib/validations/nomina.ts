import { z } from "zod";
import { METODOS_PAGO } from "@/lib/constants";

/** Definir / actualizar el salario mensual (USD) de un empleado */
export const salarioSchema = z.object({
  empleado_id: z.uuid({ message: "Empleado inválido" }),
  salario_mensual_usd: z
    .number({ message: "El salario debe ser un número" })
    .nonnegative("El salario no puede ser negativo")
    .max(1_000_000, "Salario fuera de rango"),
});

export type SalarioInput = z.infer<typeof salarioSchema>;

/** Registrar un pago semanal de nómina a un empleado */
export const pagoNominaSchema = z
  .object({
    empleado_id: z.uuid({ message: "Empleado inválido" }),
    semana_inicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD"),
    semana_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD"),
    salario_base_usd: z
      .number({ message: "El monto base debe ser un número" })
      .nonnegative("El monto base no puede ser negativo")
      .max(1_000_000, "Monto fuera de rango"),
    bonos_usd: z
      .number()
      .nonnegative("Los bonos no pueden ser negativos")
      .max(1_000_000, "Bono fuera de rango")
      .optional()
      .default(0),
    deducciones_usd: z
      .number()
      .nonnegative("Las deducciones no pueden ser negativas")
      .max(1_000_000, "Deducción fuera de rango")
      .optional()
      .default(0),
    metodo_pago: z.enum(METODOS_PAGO, { message: "Selecciona método de pago" }),
    notas: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .trim()
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (v) => (v.salario_base_usd + (v.bonos_usd ?? 0)) >= (v.deducciones_usd ?? 0),
    {
      message: "Las deducciones no pueden superar el salario base + bonos",
      path: ["deducciones_usd"],
    }
  );

export type PagoNominaInput = z.infer<typeof pagoNominaSchema>;
