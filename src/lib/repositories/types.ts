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
  PaginatedResult,
  TasaCambio,
  User,
} from "@/types/domain";

export interface UsersRepository {
  list(): Promise<User[]>;
  byId(id: string): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  current(): Promise<User | null>;
}

export interface CategoriasRepository {
  list(): Promise<Categoria[]>;
  byId(id: string): Promise<Categoria | null>;
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

export interface Repository {
  users: UsersRepository;
  categorias: CategoriasRepository;
  gastos: GastosRepository;
  mobiliario: MobiliarioRepository;
  tasaCambio: TasaCambioRepository;
  facturas: FacturasRepository;
}
