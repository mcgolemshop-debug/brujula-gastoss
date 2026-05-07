/**
 * Tipos de dominio · Brújula Markets
 * Independientes del schema de DB para que el UI no se rompa al cambiar el repositorio.
 */

export type Rol = "admin" | "empleado";
export type CategoriaTipo = "variable" | "fijo" | "activo_fijo";
export type EstadoMobiliario =
  | "nuevo"
  | "buen_estado"
  | "regular"
  | "necesita_reparacion"
  | "dado_de_baja";
export type TipoMobiliario =
  | "mobiliario"
  | "dispositivo"
  | "equipo"
  | "vehiculo"
  | "otro";
export type MetodoPago =
  | "Efectivo $"
  | "Efectivo Bs"
  | "Transferencia"
  | "Pago Móvil"
  | "Zelle"
  | "Tarjeta"
  | "Binance"
  | "Otro";
export type AccionAuditoria = "crear" | "editar" | "eliminar";

export interface User {
  id: string;
  nombre_completo: string;
  email: string;
  rol: Rol;
  cargo: string | null;
  telefono: string | null;
  avatar_url: string | null;
  activo: boolean;
  created_at: string;
}

export interface StatsPersonales {
  total_mes_usd: number;
  compras_mes: number;
  promedio_compra_usd: number;
  total_acumulado_usd: number;
  compras_totales: number;
  categoria_favorita?: {
    categoria_id: string;
    nombre: string;
    color: string;
    icono: string;
    compras: number;
    total_usd: number;
  };
  ultima_compra_fecha?: string;
  ultimo_signin?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  tipo: CategoriaTipo;
  presupuesto_mensual_usd: number | null;
  notas: string | null;
  activa: boolean;
  orden: number;
}

export interface Factura {
  id: string;
  gasto_id: string;
  url_storage: string;
  nombre_archivo: string;
  tamano_bytes: number | null;
  mime_type: string | null;
  subida_por: string | null;
  created_at: string;
}

export interface Gasto {
  id: string;
  codigo: string;
  fecha: string;
  hora: string;
  usuario_id: string;
  categoria_id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  items: number;
  precio_unitario_usd: number;
  total_usd: number;
  tasa_cambio: number;
  total_bs: number;
  metodo_pago: MetodoPago;
  lugar_compra: string | null;
  numero_factura: string | null;
  va_a_inventario: boolean;
  mobiliario_id: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins opcionales (poblados por el repository)
  usuario?: User;
  categoria?: Categoria;
  facturas?: Factura[];
}

export interface Mobiliario {
  id: string;
  codigo: string;
  tipo: TipoMobiliario;
  descripcion: string;
  marca_modelo: string | null;
  serial: string | null;
  cantidad: number;
  estado: EstadoMobiliario;
  ubicacion: string | null;
  asignado_a: string | null;
  precio_compra_usd: number;
  fecha_ingreso: string;
  fecha_ultimo_mantenimiento: string | null;
  notas: string | null;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins opcionales
  asignado?: User | null;
}

export interface TasaCambio {
  id: string;
  valor_bs_por_usd: number;
  fuente: string;
  actualizado_por: string | null;
  created_at: string;
}

export interface Presupuesto {
  id: string;
  categoria_id: string;
  mes: number;
  anio: number;
  monto_usd: number;
  created_at: string;
  // Join
  categoria?: Categoria;
  gastado_usd?: number; // computed: suma de gastos del periodo
}

// === Filtros & queries ===

export interface GastoFilters {
  search?: string;
  categoria_id?: string;
  usuario_id?: string;
  metodo_pago?: MetodoPago;
  fecha_desde?: string;
  fecha_hasta?: string;
  va_a_inventario?: boolean;
  sort?: "fecha_desc" | "fecha_asc" | "total_desc" | "total_asc" | "codigo_desc";
  page?: number;
  page_size?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// === Inputs (creación / edición) ===

export interface NuevoGastoInput {
  fecha: string;
  hora: string;
  usuario_id: string;
  categoria_id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  items: number;
  precio_unitario_usd: number;
  metodo_pago: MetodoPago;
  lugar_compra?: string | null;
  numero_factura?: string | null;
  va_a_inventario?: boolean;
  mobiliario_id?: string | null;
  observaciones?: string | null;
  /** Foto factura (FormData con File) — el repo se encarga de subirla a storage */
  factura_file?: File | null;
}

export interface NuevoMobiliarioInput {
  tipo: TipoMobiliario;
  descripcion: string;
  marca_modelo?: string | null;
  serial?: string | null;
  cantidad: number;
  estado: EstadoMobiliario;
  ubicacion?: string | null;
  asignado_a?: string | null;
  precio_compra_usd: number;
  fecha_ingreso: string;
  notas?: string | null;
  foto_file?: File | null;
}

export interface KpiResumen {
  total_acumulado_usd: number;
  mes_actual_usd: number;
  promedio_diario_usd: number;
  compras_mes: number;
  delta_vs_mes_anterior_pct: number;
}
