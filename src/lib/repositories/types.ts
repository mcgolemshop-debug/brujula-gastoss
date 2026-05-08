/**
 * Repository interfaces · Brújula Markets
 *
 * Las páginas y server actions consumen ESTAS interfaces, no clientes
 * concretos. Eso permite tener una implementación Mock (sin DB) durante
 * desarrollo y switchearla a Supabase cuando esté configurado, sin tocar
 * el resto del código.
 */

import type {
  Categoria,
  Gasto,
  GastoFilters,
  KpiResumen,
  Mobiliario,
  NuevoGastoInput,
  NuevoMobiliarioInput,
  NuevoReembolsoInput,
  PaginatedResult,
  Presupuesto,
  Reembolso,
  StatsPersonales,
  TasaCambio,
  User,
} from "@/types/domain";

export interface UsersRepository {
  list(): Promise<User[]>;
  byId(id: string): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  current(): Promise<User | null>;
  /** Update fields del usuario (limitado por RLS / self-update policy) */
  updateSelf(
    id: string,
    input: { nombre_completo?: string; telefono?: string | null; avatar_url?: string | null }
  ): Promise<User>;
  /** Stats agregados del usuario (mes actual + acumulado + categoría fav) */
  statsPersonales(userId: string): Promise<StatsPersonales>;
}

export interface CategoriaInput {
  nombre: string;
  icono: string;
  color: string;
  tipo: "variable" | "fijo" | "activo_fijo";
  notas?: string | null;
  presupuesto_mensual_usd?: number | null;
}

export interface CategoriasRepository {
  list(includeInactive?: boolean): Promise<Categoria[]>;
  byId(id: string): Promise<Categoria | null>;
  create(input: CategoriaInput): Promise<Categoria>;
  update(id: string, input: Partial<CategoriaInput>): Promise<Categoria>;
  toggleActiva(id: string, activa: boolean): Promise<Categoria>;
  delete(id: string): Promise<void>;
  /** Número de gastos asociados a una categoría (para validar antes de eliminar) */
  gastosCount(categoriaId: string): Promise<number>;
}

export interface GastosRepository {
  list(filters?: GastoFilters): Promise<PaginatedResult<Gasto>>;
  byId(id: string): Promise<Gasto | null>;
  create(input: NuevoGastoInput, currentUserId: string): Promise<Gasto>;
  update(id: string, input: Partial<NuevoGastoInput>): Promise<Gasto>;
  delete(id: string): Promise<void>;
  kpis(): Promise<KpiResumen>;
  topCategoriasMes(limit?: number): Promise<
    {
      categoria_id: string;
      nombre: string;
      color: string;
      total_usd: number;
      pct: number;
    }[]
  >;
}

export interface MobiliarioRepository {
  list(): Promise<Mobiliario[]>;
  byId(id: string): Promise<Mobiliario | null>;
  create(input: NuevoMobiliarioInput): Promise<Mobiliario>;
  update(id: string, input: Partial<NuevoMobiliarioInput>): Promise<Mobiliario>;
  cambiarEstado(
    id: string,
    estado: Mobiliario["estado"],
    notas?: string
  ): Promise<Mobiliario>;
  delete(id: string): Promise<void>;
}

export interface TasaCambioRepository {
  actual(): Promise<TasaCambio>;
  historico(): Promise<TasaCambio[]>;
  actualizar(valor: number, fuente: string, userId: string): Promise<TasaCambio>;
}

export interface FacturasRepository {
  upload(
    gastoId: string,
    file: File | Blob,
    fileName: string,
    userId: string
  ): Promise<{ url: string; id: string }>;
  delete(id: string): Promise<void>;
}

export interface PresupuestosRepository {
  /** Lista presupuestos del mes/año especificado, con su gasto consumido */
  listConGasto(
    mes: number,
    anio: number
  ): Promise<(Presupuesto & { gastado_usd: number })[]>;
  upsert(input: {
    categoria_id: string;
    mes: number;
    anio: number;
    monto_usd: number;
  }): Promise<Presupuesto>;
  delete(id: string): Promise<void>;
}

export interface ReembolsoFilters {
  estado?: "pendiente" | "pagado";
  beneficiario_id?: string;
}

export interface ReembolsosRepository {
  list(filters?: ReembolsoFilters): Promise<Reembolso[]>;
  byId(id: string): Promise<Reembolso | null>;
  byGastoId(gastoId: string): Promise<Reembolso | null>;
  create(input: NuevoReembolsoInput): Promise<Reembolso>;
  marcarPagado(
    id: string,
    metodo_pago: import("@/types/domain").MetodoPago,
    fecha_pago: string
  ): Promise<Reembolso>;
  delete(id: string): Promise<void>;
  /** Total pendiente por beneficiario, agregado */
  totalesPorBeneficiario(): Promise<
    {
      beneficiario_id: string;
      nombre: string;
      total_usd: number;
      total_bs: number;
      cuenta: number;
    }[]
  >;
}

export interface BulkActionsRepository {
  deleteMany(ids: string[]): Promise<{ count: number }>;
  recategorizarMany(
    ids: string[],
    nuevaCategoriaId: string
  ): Promise<{ count: number }>;
}

export interface PushSubsRepository {
  subscribe(input: {
    usuario_id: string;
    endpoint: string;
    p256dh: string;
    auth_secret: string;
    user_agent?: string;
  }): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
  /** Lista todas las subs (para enviar push masivo) */
  all(): Promise<
    {
      id: string;
      usuario_id: string;
      endpoint: string;
      p256dh: string;
      auth_secret: string;
    }[]
  >;
  /** Lista subs de admins (para alertar al admin) */
  admins(): Promise<
    {
      id: string;
      usuario_id: string;
      endpoint: string;
      p256dh: string;
      auth_secret: string;
    }[]
  >;
}

export interface Repository {
  users: UsersRepository;
  categorias: CategoriasRepository;
  gastos: GastosRepository;
  gastosBulk: BulkActionsRepository;
  mobiliario: MobiliarioRepository;
  tasaCambio: TasaCambioRepository;
  facturas: FacturasRepository;
  presupuestos: PresupuestosRepository;
  reembolsos: ReembolsosRepository;
  pushSubs: PushSubsRepository;
}
