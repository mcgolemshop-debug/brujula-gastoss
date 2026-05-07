import { z } from "zod";

// trim + lowercase + validar email · mantiene string en input y output
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({ message: "Correo inválido" })
      .min(3, "Correo demasiado corto")
      .max(120, "Correo demasiado largo")
  );

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(128, "Máximo 128 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: emailField,
});
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
