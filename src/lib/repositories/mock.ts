/**
 * Mock Repository · Brújula Markets
 *
 * Implementación in-memory con datos pre-poblados del Excel original.
 * Útil durante Fase 2 antes de tener Supabase configurado.
 *
 * Limitación: los datos NO persisten entre restarts del servidor.
 * Para producción, switchear a SupabaseRepository.
 */

import type {
  Categoria,
  EstadoMobiliario,
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
import {
  CATEGORIAS_DEFAULT,
  EQUIPO_DEFAULT,
  MOBILIARIO_DEFAULT,
  GASTOS_EJEMPLO,
  DEFAULT_TASA_CAMBIO,
} from "@/lib/constants";
import type {
  CategoriasRepository,
  FacturasRepository,
  GastosRepository,
  MobiliarioRepository,
  Repository,
  TasaCambioRepository,
  UsersRepository,
} from "./types";

// ===== STORE =====
class MockStore {
  users = new Map<string, User>();
  categorias = new Map<string, Categoria>();
  gastos = new Map<string, Gasto>();
  mobiliario = new Map<string, Mobiliario>();
  tasaCambio: TasaCambio[] = [];
  /** UUID del usuario "actual" (Orlando por defecto) — Fase 2 sin Auth real */
  currentUserId: string = "00000000-0000-0000-0000-000000000001";
  initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.seedUsers();
    this.seedCategorias();
    this.seedTasa();
    this.seedMobiliario();
    this.seedGastos();
  }

  private seedUsers() {
    EQUIPO_DEFAULT.forEach((u, i) => {
      const id = `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`;
      this.users.set(id, {
        id,
        nombre_completo: u.nombre_completo,
        email: u.email,
        rol: u.rol,
        cargo: u.cargo,
        telefono: null,
        avatar_url: null,
        activo: true,
        created_at: new Date().toISOString(),
      });
    });
  }

  private seedCategorias() {
    CATEGORIAS_DEFAULT.forEach((c, i) => {
      const id = `cat-${String(i + 1).padStart(3, "0")}-${c.nombre.toLowerCase().replace(/\W/g, "")}`;
      // Convertir a UUID-like para mock
      const uuid = `${id.padEnd(36, "0")}`.slice(0, 36);
      this.categorias.set(uuid, {
        id: uuid,
        nombre: c.nombre,
        icono: c.icono,
        color: c.color,
        tipo: c.tipo,
        presupuesto_mensual_usd: null,
        notas: c.notas,
        activa: true,
        orden: i + 1,
      });
    });
  }

  private seedTasa() {
    this.tasaCambio.push({
      id: "tasa-001",
      valor_bs_por_usd: DEFAULT_TASA_CAMBIO,
      fuente: "Inicial · Excel mayo 2026",
      actualizado_por: this.currentUserId,
      created_at: new Date().toISOString(),
    });
  }

  private seedMobiliario() {
    MOBILIARIO_DEFAULT.forEach((m, i) => {
      const id = `mob-${String(i + 1).padStart(3, "0")}`.padEnd(36, "0").slice(0, 36);
      const orlandoId = "00000000-0000-0000-0000-000000000001";
      this.mobiliario.set(id, {
        id,
        codigo: m.codigo,
        tipo: m.tipo as Mobiliario["tipo"],
        descripcion: m.descripcion,
        marca_modelo: m.marca_modelo,
        serial: m.serial,
        cantidad: m.cantidad,
        estado: m.estado as Mobiliario["estado"],
        ubicacion: m.ubicacion,
        asignado_a: m.asignado_a === "Orlando Velásquez" ? orlandoId : null,
        precio_compra_usd: m.precio_compra_usd,
        fecha_ingreso: m.fecha_ingreso,
        fecha_ultimo_mantenimiento: null,
        notas: m.notas,
        foto_url: null,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  private seedGastos() {
    const userByName: Record<string, string> = {};
    Array.from(this.users.values()).forEach((u) => {
      userByName[u.nombre_completo] = u.id;
    });
    const catByName: Record<string, string> = {};
    Array.from(this.categorias.values()).forEach((c) => {
      catByName[c.nombre] = c.id;
    });

    GASTOS_EJEMPLO.forEach((g) => {
      const id = `gas-${g.codigo.toLowerCase()}`.padEnd(36, "0").slice(0, 36);
      const total_usd = g.precio_unitario_usd * g.items;
      const tasa = DEFAULT_TASA_CAMBIO;
      this.gastos.set(id, {
        id,
        codigo: g.codigo,
        fecha: g.fecha,
        hora: g.hora,
        usuario_id: userByName[g.usuario] ?? this.currentUserId,
        categoria_id: catByName[g.categoria] ?? "",
        descripcion: g.descripcion,
        cantidad: g.cantidad,
        unidad: g.unidad,
        items: g.items,
        precio_unitario_usd: g.precio_unitario_usd,
        total_usd,
        tasa_cambio: tasa,
        total_bs: total_usd * tasa,
        metodo_pago: g.metodo_pago as Gasto["metodo_pago"],
        lugar_compra: g.lugar_compra,
        numero_factura: g.numero_factura,
        va_a_inventario: "va_a_inventario" in g ? !!g.va_a_inventario : false,
        mobiliario_id: null,
        observaciones: g.observaciones ?? null,
        created_at: `${g.fecha}T${g.hora}:00.000Z`,
        updated_at: `${g.fecha}T${g.hora}:00.000Z`,
      });
    });
  }
}

// Singleton
const store = new MockStore();

// Inicializar al cargar el módulo
store.init();

// ===== UUID generator simple =====
function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`.padEnd(36, "0").slice(0, 36);
}

// ===== Helpers =====
function nextCodigo(prefix: "G" | "M", existing: string[], pad: number) {
  const max = existing
    .filter((c) => c.startsWith(`${prefix}-`))
    .map((c) => parseInt(c.slice(2), 10))
    .filter((n) => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

function joinGasto(g: Gasto): Gasto {
  return {
    ...g,
    usuario: store.users.get(g.usuario_id),
    categoria: store.categorias.get(g.categoria_id) ?? undefined,
    facturas: [],
  };
}

// ===== Implementations =====
export const mockUsers: UsersRepository = {
  async list() {
    return Array.from(store.users.values()).filter((u) => u.activo);
  },
  async byId(id) {
    return store.users.get(id) ?? null;
  },
  async byEmail(email) {
    return (
      Array.from(store.users.values()).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  },
  async current() {
    return store.users.get(store.currentUserId) ?? null;
  },

  async updateSelf(id, input) {
    const existing = store.users.get(id);
    if (!existing) throw new Error("Usuario no encontrado");
    const merged = {
      ...existing,
      ...(input.nombre_completo !== undefined && {
        nombre_completo: input.nombre_completo,
      }),
      ...(input.telefono !== undefined && { telefono: input.telefono }),
      ...(input.avatar_url !== undefined && { avatar_url: input.avatar_url }),
    };
    store.users.set(id, merged);
    return merged;
  },

  async statsPersonales(userId) {
    const today = new Date();
    const ymStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const all = Array.from(store.gastos.values()).filter(
      (g) => g.usuario_id === userId
    );
    const mes = all.filter((g) => g.fecha.startsWith(ymStart));

    const total_mes = mes.reduce((s, g) => s + g.total_usd, 0);
    const total_acum = all.reduce((s, g) => s + g.total_usd, 0);
    const promedio_compra =
      mes.length > 0 ? total_mes / mes.length : 0;

    // Categoría favorita (por # de compras, fallback total)
    const catCount = new Map<string, { compras: number; total: number }>();
    for (const g of all) {
      const ex = catCount.get(g.categoria_id) ?? { compras: 0, total: 0 };
      ex.compras += 1;
      ex.total += g.total_usd;
      catCount.set(g.categoria_id, ex);
    }
    let catFav:
      | {
          categoria_id: string;
          nombre: string;
          color: string;
          icono: string;
          compras: number;
          total_usd: number;
        }
      | undefined;
    if (catCount.size > 0) {
      const [favId, favData] = Array.from(catCount.entries()).sort(
        (a, b) => b[1].compras - a[1].compras || b[1].total - a[1].total
      )[0];
      const cat = store.categorias.get(favId);
      if (cat) {
        catFav = {
          categoria_id: favId,
          nombre: cat.nombre,
          color: cat.color,
          icono: cat.icono,
          compras: favData.compras,
          total_usd: favData.total,
        };
      }
    }

    const ultimaCompra = all.sort((a, b) =>
      (b.fecha + b.hora).localeCompare(a.fecha + a.hora)
    )[0]?.fecha;

    return {
      total_mes_usd: total_mes,
      compras_mes: mes.length,
      promedio_compra_usd: promedio_compra,
      total_acumulado_usd: total_acum,
      compras_totales: all.length,
      categoria_favorita: catFav,
      ultima_compra_fecha: ultimaCompra,
      ultimo_signin: new Date().toISOString(),
    };
  },
};

export const mockCategorias: CategoriasRepository = {
  async list(includeInactive = false) {
    const all = Array.from(store.categorias.values());
    return (includeInactive ? all : all.filter((c) => c.activa)).sort(
      (a, b) => a.orden - b.orden
    );
  },
  async byId(id) {
    return store.categorias.get(id) ?? null;
  },
  async create(input) {
    const id = uid("cat");
    const maxOrden = Math.max(
      0,
      ...Array.from(store.categorias.values()).map((c) => c.orden)
    );
    const cat: Categoria = {
      id,
      nombre: input.nombre,
      icono: input.icono,
      color: input.color,
      tipo: input.tipo,
      presupuesto_mensual_usd: input.presupuesto_mensual_usd ?? null,
      notas: input.notas ?? null,
      activa: true,
      orden: maxOrden + 1,
    };
    store.categorias.set(id, cat);
    return cat;
  },
  async update(id, input) {
    const existing = store.categorias.get(id);
    if (!existing) throw new Error("Categoría no encontrada");
    const merged: Categoria = { ...existing, ...input } as Categoria;
    store.categorias.set(id, merged);
    return merged;
  },
  async toggleActiva(id, activa) {
    const existing = store.categorias.get(id);
    if (!existing) throw new Error("Categoría no encontrada");
    const merged: Categoria = { ...existing, activa };
    store.categorias.set(id, merged);
    return merged;
  },
  async delete(id) {
    store.categorias.delete(id);
  },
  async gastosCount(categoriaId) {
    return Array.from(store.gastos.values()).filter(
      (g) => g.categoria_id === categoriaId
    ).length;
  },
};

export const mockGastos: GastosRepository = {
  async list(filters: GastoFilters = {}) {
    let items = Array.from(store.gastos.values()).map(joinGasto);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (g) =>
          g.descripcion.toLowerCase().includes(q) ||
          g.codigo.toLowerCase().includes(q) ||
          g.lugar_compra?.toLowerCase().includes(q) ||
          g.numero_factura?.toLowerCase().includes(q) ||
          g.usuario?.nombre_completo.toLowerCase().includes(q)
      );
    }
    if (filters.categoria_id)
      items = items.filter((g) => g.categoria_id === filters.categoria_id);
    if (filters.usuario_id)
      items = items.filter((g) => g.usuario_id === filters.usuario_id);
    if (filters.metodo_pago)
      items = items.filter((g) => g.metodo_pago === filters.metodo_pago);
    if (filters.fecha_desde)
      items = items.filter((g) => g.fecha >= filters.fecha_desde!);
    if (filters.fecha_hasta)
      items = items.filter((g) => g.fecha <= filters.fecha_hasta!);
    if (filters.va_a_inventario !== undefined)
      items = items.filter((g) => g.va_a_inventario === filters.va_a_inventario);

    // Sort
    const sort = filters.sort ?? "fecha_desc";
    items.sort((a, b) => {
      switch (sort) {
        case "fecha_asc":
          return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora);
        case "fecha_desc":
          return b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora);
        case "total_asc":
          return a.total_usd - b.total_usd;
        case "total_desc":
          return b.total_usd - a.total_usd;
        case "codigo_desc":
          return b.codigo.localeCompare(a.codigo);
        default:
          return 0;
      }
    });

    const total = items.length;
    const page = filters.page ?? 1;
    const page_size = filters.page_size ?? 25;
    const start = (page - 1) * page_size;
    return {
      items: items.slice(start, start + page_size),
      total,
      page,
      page_size,
    };
  },

  async byId(id) {
    const g = store.gastos.get(id);
    return g ? joinGasto(g) : null;
  },

  async create(input, currentUserId) {
    const id = uid("gas");
    const tasa = store.tasaCambio[store.tasaCambio.length - 1].valor_bs_por_usd;
    const total_usd = input.precio_unitario_usd * input.items;
    const codigo = nextCodigo(
      "G",
      Array.from(store.gastos.values()).map((g) => g.codigo),
      4
    );
    const now = new Date().toISOString();
    const g: Gasto = {
      id,
      codigo,
      fecha: input.fecha,
      hora: input.hora,
      usuario_id: input.usuario_id || currentUserId,
      categoria_id: input.categoria_id,
      descripcion: input.descripcion,
      cantidad: input.cantidad,
      unidad: input.unidad,
      items: input.items,
      precio_unitario_usd: input.precio_unitario_usd,
      total_usd,
      tasa_cambio: tasa,
      total_bs: total_usd * tasa,
      metodo_pago: input.metodo_pago,
      lugar_compra: input.lugar_compra ?? null,
      numero_factura: input.numero_factura ?? null,
      va_a_inventario: input.va_a_inventario ?? false,
      mobiliario_id: input.mobiliario_id ?? null,
      observaciones: input.observaciones ?? null,
      created_at: now,
      updated_at: now,
    };
    store.gastos.set(id, g);
    return joinGasto(g);
  },

  async update(id, input) {
    const existing = store.gastos.get(id);
    if (!existing) throw new Error("Gasto no encontrado");
    const merged: Gasto = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    } as Gasto;
    if (input.precio_unitario_usd !== undefined || input.items !== undefined) {
      merged.total_usd = merged.precio_unitario_usd * merged.items;
      merged.total_bs = merged.total_usd * merged.tasa_cambio;
    }
    store.gastos.set(id, merged);
    return joinGasto(merged);
  },

  async delete(id) {
    store.gastos.delete(id);
  },

  async kpis() {
    const today = new Date();
    const ymStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const all = Array.from(store.gastos.values());
    const mes = all.filter((g) => g.fecha.startsWith(ymStart));
    const total_acumulado = all.reduce((s, g) => s + g.total_usd, 0);
    const mes_total = mes.reduce((s, g) => s + g.total_usd, 0);
    const dias = new Set(mes.map((g) => g.fecha)).size || 1;
    return {
      total_acumulado_usd: total_acumulado,
      mes_actual_usd: mes_total,
      promedio_diario_usd: mes_total / dias,
      compras_mes: mes.length,
      delta_vs_mes_anterior_pct: 0, // sin histórico real en mock
    };
  },

  async topCategoriasMes(limit = 5) {
    const today = new Date();
    const ymStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const all = Array.from(store.gastos.values()).filter((g) =>
      g.fecha.startsWith(ymStart)
    );
    const sumByCat = new Map<string, number>();
    all.forEach((g) =>
      sumByCat.set(g.categoria_id, (sumByCat.get(g.categoria_id) ?? 0) + g.total_usd)
    );
    const totalMes = Array.from(sumByCat.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(sumByCat.entries())
      .map(([cat_id, total]) => {
        const c = store.categorias.get(cat_id);
        return {
          categoria_id: cat_id,
          nombre: c?.nombre ?? "Sin categoría",
          color: c?.color ?? "#6B7280",
          total_usd: total,
          pct: (total / totalMes) * 100,
        };
      })
      .sort((a, b) => b.total_usd - a.total_usd)
      .slice(0, limit);
  },
};

export const mockMobiliario: MobiliarioRepository = {
  async list() {
    return Array.from(store.mobiliario.values()).filter((m) => m.activo);
  },
  async byId(id) {
    return store.mobiliario.get(id) ?? null;
  },
  async create(input) {
    const id = uid("mob");
    const codigo = nextCodigo(
      "M",
      Array.from(store.mobiliario.values()).map((m) => m.codigo),
      3
    );
    const now = new Date().toISOString();
    const m: Mobiliario = {
      id,
      codigo,
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
      fecha_ultimo_mantenimiento: null,
      notas: input.notas ?? null,
      foto_url: null,
      activo: true,
      created_at: now,
      updated_at: now,
    };
    store.mobiliario.set(id, m);
    return m;
  },
  async update(id, input) {
    const existing = store.mobiliario.get(id);
    if (!existing) throw new Error("Mobiliario no encontrado");
    const merged: Mobiliario = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    } as Mobiliario;
    store.mobiliario.set(id, merged);
    return merged;
  },
  async cambiarEstado(id, estado: EstadoMobiliario, notas) {
    const existing = store.mobiliario.get(id);
    if (!existing) throw new Error("Mobiliario no encontrado");
    const merged: Mobiliario = {
      ...existing,
      estado,
      notas: notas ?? existing.notas,
      updated_at: new Date().toISOString(),
    };
    store.mobiliario.set(id, merged);
    return merged;
  },
  async delete(id) {
    store.mobiliario.delete(id);
  },
};

export const mockTasaCambio: TasaCambioRepository = {
  async actual() {
    return store.tasaCambio[store.tasaCambio.length - 1];
  },
  async historico() {
    return [...store.tasaCambio].reverse();
  },
  async actualizar(valor, fuente, userId) {
    const t: TasaCambio = {
      id: uid("tasa"),
      valor_bs_por_usd: valor,
      fuente,
      actualizado_por: userId,
      created_at: new Date().toISOString(),
    };
    store.tasaCambio.push(t);
    return t;
  },
};

export const mockFacturas: FacturasRepository = {
  async upload(_gastoId, _file, fileName, _userId) {
    return {
      url: `/_mock/facturas/${fileName}`,
      id: uid("fac"),
    };
  },
  async delete() {
    // no-op en mock
  },
};

// Presupuestos in-memory
const presupuestosStore = new Map<
  string,
  {
    id: string;
    categoria_id: string;
    mes: number;
    anio: number;
    monto_usd: number;
    created_at: string;
  }
>();

export const mockPresupuestos = {
  async listConGasto(mes: number, anio: number) {
    const ymStart = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const nextMes =
      mes === 12
        ? `${anio + 1}-01-01`
        : `${anio}-${String(mes + 1).padStart(2, "0")}-01`;

    const presupuestos = Array.from(presupuestosStore.values()).filter(
      (p) => p.mes === mes && p.anio === anio
    );

    return presupuestos.map((p) => {
      const gastosCat = Array.from(store.gastos.values()).filter(
        (g) =>
          g.categoria_id === p.categoria_id &&
          g.fecha >= ymStart &&
          g.fecha < nextMes
      );
      const gastado = gastosCat.reduce((s, g) => s + g.total_usd, 0);
      return {
        ...p,
        categoria: store.categorias.get(p.categoria_id),
        gastado_usd: gastado,
      };
    });
  },

  async upsert(input: {
    categoria_id: string;
    mes: number;
    anio: number;
    monto_usd: number;
  }) {
    const existing = Array.from(presupuestosStore.values()).find(
      (p) =>
        p.categoria_id === input.categoria_id &&
        p.mes === input.mes &&
        p.anio === input.anio
    );
    if (existing) {
      existing.monto_usd = input.monto_usd;
      presupuestosStore.set(existing.id, existing);
      return existing;
    }
    const id = uid("pre");
    const item = {
      id,
      ...input,
      created_at: new Date().toISOString(),
    };
    presupuestosStore.set(id, item);
    return item;
  },

  async delete(id: string) {
    presupuestosStore.delete(id);
  },
};

export const mockRepository: Repository = {
  users: mockUsers,
  categorias: mockCategorias,
  gastos: mockGastos,
  mobiliario: mockMobiliario,
  tasaCambio: mockTasaCambio,
  facturas: mockFacturas,
  presupuestos: mockPresupuestos,
};
