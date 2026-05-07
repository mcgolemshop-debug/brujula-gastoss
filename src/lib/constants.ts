/**
 * Brújula Markets · Constantes de negocio
 * Extraídas del Excel de Orlando (Control_Gastos_Oficina_Trading.xlsx)
 */

export const APP_NAME = "Brújula Markets";
export const APP_TAGLINE = "Sistema de Control de Gastos";
export const OFFICE_TYPE = "Oficina de Trading Forex";

// === Tasa de cambio inicial (Bs por 1 USD) — del Excel ===
export const DEFAULT_TASA_CAMBIO = 36.5;

// === Roles ===
export const ROLES = {
  ADMIN: "admin",
  EMPLEADO: "empleado",
} as const;
export type Rol = (typeof ROLES)[keyof typeof ROLES];

// === Categorías de gasto (12) ===
export const CATEGORIA_TIPOS = {
  VARIABLE: "variable",
  FIJO: "fijo",
  ACTIVO_FIJO: "activo_fijo",
} as const;
export type CategoriaTipo = (typeof CATEGORIA_TIPOS)[keyof typeof CATEGORIA_TIPOS];

export const CATEGORIAS_DEFAULT = [
  { nombre: "Comida", icono: "UtensilsCrossed", color: "#D4A574", tipo: "variable", notas: "Alimentación equipo" },
  { nombre: "Ferretería", icono: "Wrench", color: "#5F5E5A", tipo: "variable", notas: "Reparaciones / Tornillería" },
  { nombre: "Limpieza", icono: "Sparkles", color: "#60A5FA", tipo: "variable", notas: "Productos de limpieza" },
  { nombre: "Repuestos", icono: "Cog", color: "#F59E0B", tipo: "variable", notas: "Para vehículos / equipos" },
  { nombre: "Aceites Carro/Moto", icono: "Droplets", color: "#7C2D12", tipo: "variable", notas: "Lubricantes" },
  { nombre: "Mobiliario", icono: "Armchair", color: "#0A2540", tipo: "activo_fijo", notas: "Va a inventario" },
  { nombre: "Tecnología/Dispositivos", icono: "Laptop", color: "#143659", tipo: "activo_fijo", notas: "Va a inventario" },
  { nombre: "Servicios", icono: "Plug", color: "#15803D", tipo: "fijo", notas: "Internet, luz, agua" },
  { nombre: "Combustible", icono: "Fuel", color: "#DC2626", tipo: "variable", notas: "Gasolina / Gas" },
  { nombre: "Medicinas", icono: "Pill", color: "#10B981", tipo: "variable", notas: "Botiquín oficina" },
  { nombre: "Papelería/Oficina", icono: "FileText", color: "#8B5CF6", tipo: "variable", notas: "Hojas, tinta, carpetas" },
  { nombre: "Otros", icono: "MoreHorizontal", color: "#6B7280", tipo: "variable", notas: "Misceláneos" },
] as const;

// === Equipo (8 personas — del Excel) ===
export const EQUIPO_DEFAULT = [
  { nombre_completo: "Orlando Velásquez", email: "orlando@brujula.local", rol: "admin" as const, cargo: "Director / Jefe" },
  { nombre_completo: "Arlet Rodríguez", email: "arlet@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Lenin Rodríguez", email: "lenin@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Christian Polanco", email: "christian@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Diego Pérez", email: "diego@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Sandro Dhoy", email: "sandro@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Luis Rodríguez", email: "luis@brujula.local", rol: "empleado" as const, cargo: "Trader" },
  { nombre_completo: "Gean Carlos Moncalves", email: "gean@brujula.local", rol: "empleado" as const, cargo: "Trader" },
];

// === Unidades de medida (13) ===
export const UNIDADES = [
  "Unidad",
  "Kg",
  "Gramos",
  "Litros",
  "ml",
  "Docena",
  "Paquete",
  "Caja",
  "Bolsa",
  "Metro",
  "Galón",
  "Par",
  "Set",
] as const;
export type Unidad = (typeof UNIDADES)[number];

// === Métodos de pago (8) ===
export const METODOS_PAGO = [
  "Efectivo $",
  "Efectivo Bs",
  "Transferencia",
  "Pago Móvil",
  "Zelle",
  "Tarjeta",
  "Binance",
  "Otro",
] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

// === Estados de mobiliario ===
export const ESTADOS_MOBILIARIO = [
  { value: "nuevo", label: "Nuevo", color: "success" },
  { value: "buen_estado", label: "Buen estado", color: "success" },
  { value: "regular", label: "Regular", color: "warning" },
  { value: "necesita_reparacion", label: "Necesita reparación", color: "destructive" },
  { value: "dado_de_baja", label: "Dado de baja", color: "muted" },
] as const;
export type EstadoMobiliario = (typeof ESTADOS_MOBILIARIO)[number]["value"];

// === Tipos de mobiliario ===
export const TIPOS_MOBILIARIO = [
  "mobiliario",
  "dispositivo",
  "equipo",
  "vehiculo",
  "otro",
] as const;
export type TipoMobiliario = (typeof TIPOS_MOBILIARIO)[number];

// === Ubicaciones ===
export const UBICACIONES = [
  "Sala Trading",
  "Oficina Principal",
  "Recepción",
  "Cocina",
  "Baño",
  "Almacén",
  "Sala Reuniones",
  "Otro",
] as const;
export type Ubicacion = (typeof UBICACIONES)[number];

// === Mobiliario inicial (10 ítems del Excel) ===
export const MOBILIARIO_DEFAULT = [
  { codigo: "M-001", tipo: "mobiliario", descripcion: "Escritorio ejecutivo de madera", marca_modelo: "Importado", serial: "ESC-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Trading", asignado_a: "Orlando Velásquez", precio_compra_usd: 350, fecha_ingreso: "2025-01-15", notas: "Comprado al inicio de la oficina" },
  { codigo: "M-002", tipo: "mobiliario", descripcion: "Silla ergonómica", marca_modelo: "Office Pro", serial: "SIL-001", cantidad: 8, estado: "buen_estado", ubicacion: "Sala Trading", asignado_a: null, precio_compra_usd: 120, fecha_ingreso: "2025-01-15", notas: "8 sillas para los traders" },
  { codigo: "M-003", tipo: "dispositivo", descripcion: "Monitor 24 pulgadas", marca_modelo: "Samsung", serial: "SN-MON-2024-01", cantidad: 8, estado: "nuevo", ubicacion: "Sala Trading", asignado_a: null, precio_compra_usd: 180, fecha_ingreso: "2025-01-20", notas: "Monitores principales para análisis" },
  { codigo: "M-004", tipo: "dispositivo", descripcion: "PC Desktop i7", marca_modelo: "HP", serial: "SN-PC-2024-01", cantidad: 8, estado: "nuevo", ubicacion: "Sala Trading", asignado_a: null, precio_compra_usd: 850, fecha_ingreso: "2025-01-20", notas: "Equipos para trading 24/5" },
  { codigo: "M-005", tipo: "dispositivo", descripcion: "Router WiFi 6", marca_modelo: "TP-Link", serial: "RT-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Trading", asignado_a: null, precio_compra_usd: 95, fecha_ingreso: "2025-02-01", notas: "Conexión de respaldo" },
  { codigo: "M-006", tipo: "mobiliario", descripcion: "Mesa de reuniones", marca_modelo: "Local", serial: "MES-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Reuniones", asignado_a: null, precio_compra_usd: 220, fecha_ingreso: "2025-02-10", notas: null },
  { codigo: "M-007", tipo: "equipo", descripcion: "Aire acondicionado split", marca_modelo: "LG", serial: "SN-AC-001", cantidad: 2, estado: "buen_estado", ubicacion: "Sala Trading", asignado_a: null, precio_compra_usd: 480, fecha_ingreso: "2025-03-05", notas: "Última recarga gas refrigerante" },
  { codigo: "M-008", tipo: "mobiliario", descripcion: "Archivero metálico 4 gavetas", marca_modelo: "Metal Office", serial: "ARC-001", cantidad: 2, estado: "regular", ubicacion: "Oficina Principal", asignado_a: null, precio_compra_usd: 145, fecha_ingreso: "2025-03-15", notas: "Necesita ajuste de gavetas" },
  { codigo: "M-009", tipo: "dispositivo", descripcion: "Impresora multifuncional", marca_modelo: "Epson", serial: "SN-IMP-001", cantidad: 1, estado: "buen_estado", ubicacion: "Recepción", asignado_a: null, precio_compra_usd: 280, fecha_ingreso: "2025-04-01", notas: "Tinta cargable" },
  { codigo: "M-010", tipo: "mobiliario", descripcion: "Silla vieja de visitante", marca_modelo: "Marca antigua", serial: "SIL-VIE-001", cantidad: 1, estado: "necesita_reparacion", ubicacion: "Almacén", asignado_a: null, precio_compra_usd: 0, fecha_ingreso: "2025-05-10", notas: "Considerar dar de baja" },
];

// === Gastos de ejemplo (5 del Excel) — para seed ===
export const GASTOS_EJEMPLO = [
  { codigo: "G-0001", fecha: "2026-05-01", hora: "09:30", usuario: "Christian Polanco", categoria: "Comida", descripcion: "Carne de solomo", cantidad: 1.5, unidad: "Kg", items: 1, precio_unitario_usd: 8.5, metodo_pago: "Efectivo $", lugar_compra: "Carnicería La Estrella", numero_factura: "F-12345", observaciones: "Almuerzo del equipo" },
  { codigo: "G-0002", fecha: "2026-05-01", hora: "09:35", usuario: "Christian Polanco", categoria: "Comida", descripcion: "Limones", cantidad: 2, unidad: "Kg", items: 1, precio_unitario_usd: 1.2, metodo_pago: "Efectivo $", lugar_compra: "Carnicería La Estrella", numero_factura: "F-12345", observaciones: "Para jugos" },
  { codigo: "G-0003", fecha: "2026-05-01", hora: "11:15", usuario: "Lenin Rodríguez", categoria: "Ferretería", descripcion: "Tornillos varios + destornillador", cantidad: 1, unidad: "Set", items: 1, precio_unitario_usd: 12, metodo_pago: "Pago Móvil", lugar_compra: "Ferretería El Centro", numero_factura: "F-789", observaciones: "Reparación silla" },
  { codigo: "G-0004", fecha: "2026-05-02", hora: "14:20", usuario: "Diego Pérez", categoria: "Aceites Carro/Moto", descripcion: "Aceite 20W50", cantidad: 1, unidad: "Galón", items: 1, precio_unitario_usd: 18, metodo_pago: "Efectivo $", lugar_compra: "Auto Repuestos JR", numero_factura: "F-456", observaciones: "Cambio aceite carro Orlando" },
  { codigo: "G-0005", fecha: "2026-05-02", hora: "16:00", usuario: "Sandro Dhoy", categoria: "Tecnología/Dispositivos", descripcion: "Mouse inalámbrico Logitech", cantidad: 1, unidad: "Unidad", items: 2, precio_unitario_usd: 25, metodo_pago: "Transferencia", lugar_compra: "TecnoStore", numero_factura: "F-2233", observaciones: "Para nuevos puestos de trabajo", va_a_inventario: true },
];
