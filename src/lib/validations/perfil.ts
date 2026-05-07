import { z } from "zod";

export const datosPerfilSchema = z.object({
  nombre_completo: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres")
    .trim(),
  telefono: z
    .string()
    .trim()
    .regex(
      /^[\d\s+\-()]*$/,
      "Solo números, espacios y los caracteres + - ( )"
    )
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
});
export type DatosPerfilInput = z.infer<typeof datosPerfilSchema>;

export const cambiarPasswordSchema = z
  .object({
    actual: z.string().min(6, "Mínimo 6 caracteres"),
    nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres"),
    confirmar: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.nueva === data.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  })
  .refine((data) => data.actual !== data.nueva, {
    message: "La nueva debe ser distinta a la actual",
    path: ["nueva"],
  });
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
