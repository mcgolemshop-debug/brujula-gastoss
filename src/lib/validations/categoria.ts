import { z } from "zod";

export const CATEGORIA_TIPOS = ["variable", "fijo", "activo_fijo"] as const;

/** Iconos curados disponibles para categorías (Lucide icon names) */
export const ICONOS_CATEGORIA = [
  // Comida y bebida
  "UtensilsCrossed",
  "Coffee",
  "Beer",
  "Wine",
  "Pizza",
  "Sandwich",
  "Apple",
  "Beef",
  "Milk",
  "Cookie",
  "Drumstick",
  // Casa, limpieza, herramientas
  "Home",
  "Sparkles",
  "Wrench",
  "Hammer",
  "Brush",
  "Plug",
  "Lightbulb",
  // Tecnología
  "Laptop",
  "Smartphone",
  "Headphones",
  "Cpu",
  "Wifi",
  "Monitor",
  "Mouse",
  // Transporte
  "Car",
  "Bike",
  "Bus",
  "Plane",
  "Fuel",
  "Droplets",
  // Trabajo, oficina, finanzas
  "Briefcase",
  "FileText",
  "Building2",
  "Users",
  "Calendar",
  "Receipt",
  "CreditCard",
  "DollarSign",
  "Coins",
  // Mobiliario
  "Armchair",
  "Bed",
  "Cog",
  // Salud
  "Heart",
  "Pill",
  "Stethoscope",
  // Otros
  "ShoppingBag",
  "Gift",
  "Tag",
  "Box",
  "Package",
  "Boxes",
  "Music",
  "Film",
  "BookOpen",
  "Gamepad2",
  "Dumbbell",
  "MoreHorizontal",
] as const;

/** Paleta de colores disponibles (compatibles con la marca + variedad) */
export const COLORES_CATEGORIA = [
  "#0A2540", // navy
  "#143659", // navy-light
  "#D4A574", // gold
  "#B88857", // gold-dark
  "#5F5E5A", // graphite
  "#15803D", // green
  "#10B981", // emerald
  "#60A5FA", // blue
  "#1E40AF", // blue-dark
  "#8B5CF6", // purple
  "#DC2626", // red
  "#F59E0B", // amber
  "#7C2D12", // brown
  "#EC4899", // pink
  "#6B7280", // gray
] as const;

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres")
    .trim(),
  icono: z.enum(ICONOS_CATEGORIA, { message: "Icono inválido" }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido"),
  tipo: z.enum(CATEGORIA_TIPOS, { message: "Tipo inválido" }),
  notas: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});
export type CategoriaFormInput = z.infer<typeof categoriaSchema>;

export const TIPO_LABELS: Record<(typeof CATEGORIA_TIPOS)[number], string> = {
  variable: "Variable",
  fijo: "Fijo (mensual recurrente)",
  activo_fijo: "Activo fijo (va a inventario)",
};
