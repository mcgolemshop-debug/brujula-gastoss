import { z } from "zod";

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

const nombreField = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

const cargoField = z
  .string()
  .trim()
  .max(80, "Máximo 80 caracteres")
  .optional()
  .or(z.literal(""));

const rolField = z.enum(["admin", "empleado"], {
  message: "Rol inválido",
});

const passwordField = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres");

export const crearMiembroSchema = z.object({
  email: emailField,
  password: passwordField,
  nombre_completo: nombreField,
  cargo: cargoField,
  rol: rolField,
});
export type CrearMiembroInput = z.infer<typeof crearMiembroSchema>;

export const editarMiembroSchema = z.object({
  email: emailField,
  nombre_completo: nombreField,
  cargo: cargoField,
  rol: rolField,
});
export type EditarMiembroInput = z.infer<typeof editarMiembroSchema>;

export const cambiarPasswordMiembroSchema = z.object({
  password: passwordField,
});
export type CambiarPasswordMiembroInput = z.infer<
  typeof cambiarPasswordMiembroSchema
>;
