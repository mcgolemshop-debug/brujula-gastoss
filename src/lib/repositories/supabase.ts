/**
 * Supabase Repository · Brújula Markets
 *
 * Implementación real contra Supabase Cloud. Activada cuando
 * NEXT_PUBLIC_DATA_SOURCE=supabase y las env vars están presentes.
 *
 * Convenciones:
 * - Devuelve siempre el shape del dominio (src/types/domain.ts)
 * - RLS filtra automáticamente por current user (admin ve todo, empleado solo lo suyo)
 * - Errores propagados como Error con `.message` legible
 *
 * Nota: hasta que se regeneren los tipos con `pnpm db:types`, los casts
 * usan `as unknown as Foo` (Database type es permisivo).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import type {
  CategoriasRepository,
  FacturasRepository,
  GastosRepository,
  MobiliarioRepository,
  Repository,
  TasaCambioRepository,
  UsersRepository,
} from "./types";

// =====================================================================
// Helpers
// =====================================================================

async function client() {
  return await createSupabaseServerClient();
}

function checkErr(error: unknown, ctx: string) {
  if (!error) return;
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "Error desconocido";
  throw new Error(`${ctx}: ${msg}`);
}

function asArray<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

function asMaybe<T>(data: unknown): T | null {
  return (data ?? null) as T | null;
}

function asOne<T>(data: unknown): T {
  return data as T;
}

function joinShape(includeFacturas = false): string {
  const facturas = includeFacturas ? ",\n    facturas(*)" : "";
  return `
    *,
    usuario:users!gastos_usuario_id_fkey(id, nombre_completo, email, rol, cargo, avatar_url, activo, created_at),
    categoria:categorias!gastos_categoria_id_fkey(*)${facturas}
  `;
}

// =====================================================================
// Users
// =====================================================================

const supabaseUsers: UsersRepository = {
  async list() {
    const sb = await client();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("activo", true)
      .order("nombre_completo");
    checkErr(error, "users.list");
    return asArray<User>(data);
  },

  async byId(id) {
    const sb = await client();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    checkErr(error, "users.byId");
    return asMaybe<User>(data);
  },

  async byEmail(email) {
    const sb = await client();
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    checkErr(error, "users.byEmail");
    return asMaybe<User>(data);
  },

  async current() {
    const sb = await client();
    const {
      data: { user: authUser },
    } = await sb.auth.getUser();
    if (!authUser) return null;

    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();
    checkErr(error, "users.current");
    return asMaybe<User>(data);
  },
};

// =====================================================================
// Categorías
// =====================================================================

const supabaseCategorias: CategoriasRepository = {
  async list() {
    const sb = await client();
    const { data, error } = await sb
      .from("categorias")
      .select("*")
      .eq("activa", true)
      .order("orden");
    checkErr(error, "categorias.list");
    return asArray<Categoria>(data);
  },

  async byId(id) {
    const sb = await client();
    const { data, error } = await sb
      .from("categorias")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    checkErr(error, "categorias.byId");
    return asMaybe<Categoria>(data);
  },
};

// =====================================================================
// Gastos
// =====================================================================

const supabaseGastos: GastosRepository = {
  async list(filters: GastoFilters = {}): Promise<PaginatedResult<Gasto>> {
    const sb = await client();

    let q = sb.from("gastos").select(joinShape(), { count: "exact" });

    if (filters.categoria_id) q = q.eq("categoria_id", filters.categoria_id);
    if (filters.usuario_id) q = q.eq("usuario_id", filters.usuario_id);
    if (filters.metodo_pago) q = q.eq("metodo_pago", filters.metodo_pago);
    if (filters.fecha_desde) q = q.gte("fecha", filters.fecha_desde);
    if (filters.fecha_hasta) q = q.lte("fecha", filters.fecha_hasta);
    if (filters.va_a_inventario !== undefined) {
      q = q.eq("va_a_inventario", filters.va_a_inventario);
    }
    if (filters.search) {
      const search = filters.search.trim();
      q = q.or(
        `descripcion.ilike.%${search}%,codigo.ilike.%${search}%,lugar_compra.ilike.%${search}%,numero_factura.ilike.%${search}%`
      );
    }

    const sort = filters.sort ?? "fecha_desc";
    if (sort === "fecha_desc") {
      q = q.order("fecha", { ascending: false }).order("hora", { ascending: false });
    } else if (sort === "fecha_asc") {
      q = q.order("fecha", { ascending: true }).order("hora", { ascending: true });
    } else if (sort === "total_desc") {
      q = q.order("total_usd", { ascending: false });
    } else if (sort === "total_asc") {
      q = q.order("total_usd", { ascending: true });
    } else if (sort === "codigo_desc") {
      q = q.order("codigo", { ascending: false });
    }

    const page = filters.page ?? 1;
    const pageSize = filters.page_size ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error, count } = await q;
    checkErr(error, "gastos.list");

    return {
      items: asArray<Gasto>(data),
      total: count ?? 0,
      page,
      page_size: pageSize,
    };
  },

  async byId(id) {
    const sb = await client();
    const { data, error } = await sb
      .from("gastos")
      .select(joinShape(true))
      .eq("id", id)
      .maybeSingle();
    checkErr(error, "gastos.byId");
    return asMaybe<Gasto>(data);
  },

  async create(input: NuevoGastoInput, currentUserId: string) {
    const sb = await client();

    const { data: tasaRow, error: tasaErr } = await sb
      .from("tasa_actual")
      .select("valor_bs_por_usd")
      .maybeSingle();
    checkErr(tasaErr, "gastos.create (tasa)");
    const tasa =
      (tasaRow as unknown as { valor_bs_por_usd?: number } | null)
        ?.valor_bs_por_usd ?? 36.5;

    const payload = {
      fecha: input.fecha,
      hora: input.hora,
      usuario_id: input.usuario_id || currentUserId,
      categoria_id: input.categoria_id,
      descripcion: input.descripcion,
      cantidad: input.cantidad,
      unidad: input.unidad,
      items: input.items,
      precio_unitario_usd: input.precio_unitario_usd,
      tasa_cambio: tasa,
      metodo_pago: input.metodo_pago,
      lugar_compra: input.lugar_compra ?? null,
      numero_factura: input.numero_factura ?? null,
      va_a_inventario: input.va_a_inventario ?? false,
      mobiliario_id: input.mobiliario_id ?? null,
      observaciones: input.observaciones ?? null,
    };

    const { data, error } = await sb
      .from("gastos")
      .insert(payload)
      .select(joinShape())
      .single();
    checkErr(error, "gastos.create");
    return asOne<Gasto>(data);
  },

  async update(id, input) {
    const sb = await client();
    const { data, error } = await sb
      .from("gastos")
      .update(input)
      .eq("id", id)
      .select(joinShape())
      .single();
    checkErr(error, "gastos.update");
    return asOne<Gasto>(data);
  },

  async delete(id) {
    const sb = await client();
    const { error } = await sb.from("gastos").delete().eq("id", id);
    checkErr(error, "gastos.delete");
  },

  async kpis(): Promise<KpiResumen> {
    const sb = await client();
    const today = new Date();
    const ymStart = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ymPrevStart = `${lastMonth.getFullYear()}-${String(
      lastMonth.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const ymPrevEnd = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const { data: mesData, error: mesErr } = await sb
      .from("gastos")
      .select("total_usd, fecha")
      .gte("fecha", ymStart);
    checkErr(mesErr, "gastos.kpis (mes)");

    const { data: prevData, error: prevErr } = await sb
      .from("gastos")
      .select("total_usd")
      .gte("fecha", ymPrevStart)
      .lt("fecha", ymPrevEnd);
    checkErr(prevErr, "gastos.kpis (mes prev)");

    const { data: totalData, error: totErr } = await sb
      .from("gastos")
      .select("total_usd");
    checkErr(totErr, "gastos.kpis (total)");

    type Row = { total_usd: number; fecha?: string };
    const mes = asArray<Row>(mesData);
    const prev = asArray<Row>(prevData);
    const total = asArray<Row>(totalData);

    const mesUsd = mes.reduce((s, r) => s + Number(r.total_usd), 0);
    const prevUsd = prev.reduce((s, r) => s + Number(r.total_usd), 0);
    const totalUsd = total.reduce((s, r) => s + Number(r.total_usd), 0);
    const dias = new Set(mes.map((r) => r.fecha)).size || 1;
    const delta = prevUsd > 0 ? ((mesUsd - prevUsd) / prevUsd) * 100 : 0;

    return {
      total_acumulado_usd: totalUsd,
      mes_actual_usd: mesUsd,
      promedio_diario_usd: mesUsd / dias,
      compras_mes: mes.length,
      delta_vs_mes_anterior_pct: delta,
    };
  },

  async topCategoriasMes(limit = 5) {
    const sb = await client();
    const today = new Date();
    const ymStart = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const { data, error } = await sb
      .from("gastos")
      .select(
        "categoria_id, total_usd, categoria:categorias!gastos_categoria_id_fkey(nombre, color)"
      )
      .gte("fecha", ymStart);
    checkErr(error, "gastos.topCategoriasMes");

    type Row = {
      categoria_id: string;
      total_usd: number;
      categoria?: { nombre: string; color: string } | null;
    };
    const rows = asArray<Row>(data);
    const sumByCat = new Map<
      string,
      { total: number; nombre: string; color: string }
    >();
    for (const r of rows) {
      const existing = sumByCat.get(r.categoria_id) ?? {
        total: 0,
        nombre: r.categoria?.nombre ?? "Sin categoría",
        color: r.categoria?.color ?? "#6B7280",
      };
      existing.total += Number(r.total_usd);
      sumByCat.set(r.categoria_id, existing);
    }
    const totalMes =
      Array.from(sumByCat.values()).reduce((a, b) => a + b.total, 0) || 1;

    return Array.from(sumByCat.entries())
      .map(([categoria_id, v]) => ({
        categoria_id,
        nombre: v.nombre,
        color: v.color,
        total_usd: v.total,
        pct: (v.total / totalMes) * 100,
      }))
      .sort((a, b) => b.total_usd - a.total_usd)
      .slice(0, limit);
  },
};

// =====================================================================
// Mobiliario
// =====================================================================

const supabaseMobiliario: MobiliarioRepository = {
  async list() {
    const sb = await client();
    const { data, error } = await sb
      .from("mobiliario")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false });
    checkErr(error, "mobiliario.list");
    return asArray<Mobiliario>(data);
  },

  async byId(id) {
    const sb = await client();
    const { data, error } = await sb
      .from("mobiliario")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    checkErr(error, "mobiliario.byId");
    return asMaybe<Mobiliario>(data);
  },

  async create(input: NuevoMobiliarioInput) {
    const sb = await client();
    const payload = {
      tipo: input.tipo,
      descripcion: input.descripcion,
      marca_modelo: input.marca_modelo ?? null,
      serial: input.serial ?? null,
      cantidad: input.cantidad,
      estado: input.estado,
      ubicacion: input.ubicacion ?? null,
      asignado_a: input.asignado_a ?? null,
      precio_compra_usd: input.precio_compra_usd,
      fecha_ingreso: input.fecha_ingreso,
      notas: input.notas ?? null,
    };
    const { data, error } = await sb
      .from("mobiliario")
      .insert(payload)
      .select("*")
      .single();
    checkErr(error, "mobiliario.create");
    return asOne<Mobiliario>(data);
  },

  async update(id, input) {
    const sb = await client();
    const { data, error } = await sb
      .from("mobiliario")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    checkErr(error, "mobiliario.update");
    return asOne<Mobiliario>(data);
  },

  async cambiarEstado(id, estado, notas) {
    const sb = await client();
    const update: Record<string, unknown> = { estado };
    if (notas) update.notas = notas;
    const { data, error } = await sb
      .from("mobiliario")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    checkErr(error, "mobiliario.cambiarEstado");
    return asOne<Mobiliario>(data);
  },

  async delete(id) {
    const sb = await client();
    const { error } = await sb.from("mobiliario").delete().eq("id", id);
    checkErr(error, "mobiliario.delete");
  },
};

// =====================================================================
// Tasa de cambio
// =====================================================================

const supabaseTasa: TasaCambioRepository = {
  async actual() {
    const sb = await client();
    const { data, error } = await sb
      .from("tasa_actual")
      .select("*")
      .maybeSingle();
    checkErr(error, "tasa.actual");
    if (!data) {
      return {
        id: "default",
        valor_bs_por_usd: 36.5,
        fuente: "default",
        actualizado_por: null,
        created_at: new Date().toISOString(),
      };
    }
    return asOne<TasaCambio>(data);
  },

  async historico() {
    const sb = await client();
    const { data, error } = await sb
      .from("tasa_cambio")
      .select("*")
      .order("created_at", { ascending: false });
    checkErr(error, "tasa.historico");
    return asArray<TasaCambio>(data);
  },

  async actualizar(valor, fuente, userId) {
    const sb = await client();
    const { data, error } = await sb
      .from("tasa_cambio")
      .insert({
        valor_bs_por_usd: valor,
        fuente,
        actualizado_por: userId,
      })
      .select("*")
      .single();
    checkErr(error, "tasa.actualizar");
    return asOne<TasaCambio>(data);
  },
};

// =====================================================================
// Facturas (Storage)
// =====================================================================

const supabaseFacturas: FacturasRepository = {
  async upload(gastoId, file, fileName, userId) {
    const sb = await client();
    const ext = fileName.split(".").pop() ?? "jpg";
    const safeName = `${gastoId}-${Date.now()}.${ext}`;
    const path = `${userId}/${gastoId}/${safeName}`;

    const { error: uploadErr } = await sb.storage
      .from("facturas")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    checkErr(uploadErr, "facturas.upload");

    const { data: urlData } = sb.storage.from("facturas").getPublicUrl(path);

    const { data, error } = await sb
      .from("facturas")
      .insert({
        gasto_id: gastoId,
        url_storage: path,
        nombre_archivo: fileName,
        tamano_bytes: "size" in file ? (file as File).size : null,
        mime_type: "type" in file ? (file as File).type : null,
        subida_por: userId,
      })
      .select("id")
      .single();
    checkErr(error, "facturas.upload (meta)");

    return {
      url: urlData.publicUrl,
      id: asOne<{ id: string }>(data).id,
    };
  },

  async delete(id) {
    const sb = await client();
    const { data: factura } = await sb
      .from("facturas")
      .select("url_storage")
      .eq("id", id)
      .maybeSingle();
    const path = (factura as unknown as { url_storage?: string } | null)
      ?.url_storage;
    if (path) {
      await sb.storage.from("facturas").remove([path]);
    }
    const { error } = await sb.from("facturas").delete().eq("id", id);
    checkErr(error, "facturas.delete");
  },
};

// =====================================================================
// Presupuestos
// =====================================================================

const supabasePresupuestos = {
  async listConGasto(mes: number, anio: number) {
    const sb = await client();
    const ymStart = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const nextMes =
      mes === 12
        ? `${anio + 1}-01-01`
        : `${anio}-${String(mes + 1).padStart(2, "0")}-01`;

    const { data: presupuestosData, error: pErr } = await sb
      .from("presupuestos")
      .select("*, categoria:categorias!presupuestos_categoria_id_fkey(*)")
      .eq("mes", mes)
      .eq("anio", anio);
    checkErr(pErr, "presupuestos.list");

    type PresupuestoRow = {
      id: string;
      categoria_id: string;
      mes: number;
      anio: number;
      monto_usd: number;
      created_at: string;
      categoria?: Categoria;
    };
    const presupuestos = asArray<PresupuestoRow>(presupuestosData);
    if (presupuestos.length === 0) return [];

    const { data: gastosData, error: gErr } = await sb
      .from("gastos")
      .select("categoria_id, total_usd")
      .gte("fecha", ymStart)
      .lt("fecha", nextMes);
    checkErr(gErr, "presupuestos.gastos");

    type GastoSum = { categoria_id: string; total_usd: number };
    const gastos = asArray<GastoSum>(gastosData);
    const gastadoPorCat = new Map<string, number>();
    for (const g of gastos) {
      gastadoPorCat.set(
        g.categoria_id,
        (gastadoPorCat.get(g.categoria_id) ?? 0) + Number(g.total_usd)
      );
    }

    return presupuestos.map((p) => ({
      ...p,
      gastado_usd: gastadoPorCat.get(p.categoria_id) ?? 0,
    }));
  },

  async upsert(input: {
    categoria_id: string;
    mes: number;
    anio: number;
    monto_usd: number;
  }) {
    const sb = await client();
    const { data, error } = await sb
      .from("presupuestos")
      .upsert(input, { onConflict: "categoria_id,mes,anio" })
      .select("*")
      .single();
    checkErr(error, "presupuestos.upsert");
    return asOne<{
      id: string;
      categoria_id: string;
      mes: number;
      anio: number;
      monto_usd: number;
      created_at: string;
    }>(data);
  },

  async delete(id: string) {
    const sb = await client();
    const { error } = await sb.from("presupuestos").delete().eq("id", id);
    checkErr(error, "presupuestos.delete");
  },
};

// =====================================================================
// Repository (export)
// =====================================================================

export const supabaseRepository: Repository = {
  users: supabaseUsers,
  categorias: supabaseCategorias,
  gastos: supabaseGastos,
  mobiliario: supabaseMobiliario,
  tasaCambio: supabaseTasa,
  facturas: supabaseFacturas,
  presupuestos: supabasePresupuestos,
};
