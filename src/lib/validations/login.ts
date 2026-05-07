import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "Correo inválido" })
    .min(3, "Correo demasiado corto")
    .max(120, "Correo demasiado largo")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(128, "Máximo 128 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: z.email({ message: "Correo inválido" }).toLowerCase().trim(),
});
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
