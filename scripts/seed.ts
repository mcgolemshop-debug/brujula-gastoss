/**
 * Seed script · Brújula Markets
 * --------------------------------------------------------------------
 * Crea los 8 usuarios reales en auth.users (vía Admin API), las 12
 * categorías, la tasa de cambio inicial, el mobiliario inicial (10 ítems)
 * y 5 gastos de ejemplo.
 *
 * Requiere `.env.local` con SUPABASE_SERVICE_ROLE_KEY.
 * Idempotente: corre múltiples veces sin duplicar registros.
 *
 * Uso: pnpm seed
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Cargar .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ===== Datos =====

const USERS = [
  {
    email: "orlando@brujula.local",
    nombre_completo: "Orlando Velásquez",
    rol: "admin",
    cargo: "Director / Jefe",
  },
  {
    email: "arlet@brujula.local",
    nombre_completo: "Arlet Rodríguez",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "lenin@brujula.local",
    nombre_completo: "Lenin Rodríguez",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "christian@brujula.local",
    nombre_completo: "Christian Polanco",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "diego@brujula.local",
    nombre_completo: "Diego Pérez",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "sandro@brujula.local",
    nombre_completo: "Sandro Dhoy",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "luis@brujula.local",
    nombre_completo: "Luis Rodríguez",
    rol: "empleado",
    cargo: "Trader",
  },
  {
    email: "gean@brujula.local",
    nombre_completo: "Gean Carlos Moncalves",
    rol: "empleado",
    cargo: "Trader",
  },
] as const;

const PASSWORD = "Brujula2026!";

const CATEGORIAS = [
  { nombre: "Comida", icono: "UtensilsCrossed", color: "#D4A574", tipo: "variable", notas: "Alimentación equipo", orden: 1 },
  { nombre: "Ferretería", icono: "Wrench", color: "#5F5E5A", tipo: "variable", notas: "Reparaciones / Tornillería", orden: 2 },
  { nombre: "Limpieza", icono: "Sparkles", color: "#60A5FA", tipo: "variable", notas: "Productos de limpieza", orden: 3 },
  { nombre: "Repuestos", icono: "Cog", color: "#F59E0B", tipo: "variable", notas: "Para vehículos / equipos", orden: 4 },
  { nombre: "Aceites Carro/Moto", icono: "Droplets", color: "#7C2D12", tipo: "variable", notas: "Lubricantes", orden: 5 },
  { nombre: "Mobiliario", icono: "Armchair", color: "#0A2540", tipo: "activo_fijo", notas: "Va a inventario", orden: 6 },
  { nombre: "Tecnología/Dispositivos", icono: "Laptop", color: "#143659", tipo: "activo_fijo", notas: "Va a inventario", orden: 7 },
  { nombre: "Servicios", icono: "Plug", color: "#15803D", tipo: "fijo", notas: "Internet, luz, agua", orden: 8 },
  { nombre: "Combustible", icono: "Fuel", color: "#DC2626", tipo: "variable", notas: "Gasolina / Gas", orden: 9 },
  { nombre: "Medicinas", icono: "Pill", color: "#10B981", tipo: "variable", notas: "Botiquín oficina", orden: 10 },
  { nombre: "Papelería/Oficina", icono: "FileText", color: "#8B5CF6", tipo: "variable", notas: "Hojas, tinta, carpetas", orden: 11 },
  { nombre: "Otros", icono: "MoreHorizontal", color: "#6B7280", tipo: "variable", notas: "Misceláneos", orden: 12 },
];

const MOBILIARIO = [
  { codigo: "M-001", tipo: "mobiliario", descripcion: "Escritorio ejecutivo de madera", marca_modelo: "Importado", serial: "ESC-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Trading", asignado_email: "orlando@brujula.local", precio_compra_usd: 350, fecha_ingreso: "2025-01-15", notas: "Comprado al inicio de la oficina" },
  { codigo: "M-002", tipo: "mobiliario", descripcion: "Silla ergonómica", marca_modelo: "Office Pro", serial: "SIL-001", cantidad: 8, estado: "buen_estado", ubicacion: "Sala Trading", asignado_email: null, precio_compra_usd: 120, fecha_ingreso: "2025-01-15", notas: "8 sillas para los traders" },
  { codigo: "M-003", tipo: "dispositivo", descripcion: "Monitor 24 pulgadas", marca_modelo: "Samsung", serial: "SN-MON-2024-01", cantidad: 8, estado: "nuevo", ubicacion: "Sala Trading", asignado_email: null, precio_compra_usd: 180, fecha_ingreso: "2025-01-20", notas: "Monitores principales para análisis" },
  { codigo: "M-004", tipo: "dispositivo", descripcion: "PC Desktop i7", marca_modelo: "HP", serial: "SN-PC-2024-01", cantidad: 8, estado: "nuevo", ubicacion: "Sala Trading", asignado_email: null, precio_compra_usd: 850, fecha_ingreso: "2025-01-20", notas: "Equipos para trading 24/5" },
  { codigo: "M-005", tipo: "dispositivo", descripcion: "Router WiFi 6", marca_modelo: "TP-Link", serial: "RT-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Trading", asignado_email: null, precio_compra_usd: 95, fecha_ingreso: "2025-02-01", notas: "Conexión de respaldo" },
  { codigo: "M-006", tipo: "mobiliario", descripcion: "Mesa de reuniones", marca_modelo: "Local", serial: "MES-001", cantidad: 1, estado: "buen_estado", ubicacion: "Sala Reuniones", asignado_email: null, precio_compra_usd: 220, fecha_ingreso: "2025-02-10", notas: null },
  { codigo: "M-007", tipo: "equipo", descripcion: "Aire acondicionado split", marca_modelo: "LG", serial: "SN-AC-001", cantidad: 2, estado: "buen_estado", ubicacion: "Sala Trading", asignado_email: null, precio_compra_usd: 480, fecha_ingreso: "2025-03-05", notas: "Última recarga gas refrigerante" },
  { codigo: "M-008", tipo: "mobiliario", descripcion: "Archivero metálico 4 gavetas", marca_modelo: "Metal Office", serial: "ARC-001", cantidad: 2, estado: "regular", ubicacion: "Oficina Principal", asignado_email: null, precio_compra_usd: 145, fecha_ingreso: "2025-03-15", notas: "Necesita ajuste de gavetas" },
  { codigo: "M-009", tipo: "dispositivo", descripcion: "Impresora multifuncional", marca_modelo: "Epson", serial: "SN-IMP-001", cantidad: 1, estado: "buen_estado", ubicacion: "Recepción", asignado_email: null, precio_compra_usd: 280, fecha_ingreso: "2025-04-01", notas: "Tinta cargable" },
  { codigo: "M-010", tipo: "mobiliario", descripcion: "Silla vieja de visitante", marca_modelo: "Marca antigua", serial: "SIL-VIE-001", cantidad: 1, estado: "necesita_reparacion", ubicacion: "Almacén", asignado_email: null, precio_compra_usd: 0, fecha_ingreso: "2025-05-10", notas: "Considerar dar de baja" },
];

const GASTOS = [
  { fecha: "2026-05-01", hora: "09:30", usuario_email: "christian@brujula.local", categoria_nombre: "Comida", descripcion: "Carne de solomo", cantidad: 1.5, unidad: "Kg", items: 1, precio_unitario_usd: 8.5, metodo_pago: "Efectivo $", lugar_compra: "Carnicería La Estrella", numero_factura: "F-12345", observaciones: "Almuerzo del equipo" },
  { fecha: "2026-05-01", hora: "09:35", usuario_email: "christian@brujula.local", categoria_nombre: "Comida", descripcion: "Limones", cantidad: 2, unidad: "Kg", items: 1, precio_unitario_usd: 1.2, metodo_pago: "Efectivo $", lugar_compra: "Carnicería La Estrella", numero_factura: "F-12345", observaciones: "Para jugos" },
  { fecha: "2026-05-01", hora: "11:15", usuario_email: "lenin@brujula.local", categoria_nombre: "Ferretería", descripcion: "Tornillos varios + destornillador", cantidad: 1, unidad: "Set", items: 1, precio_unitario_usd: 12, metodo_pago: "Pago Móvil", lugar_compra: "Ferretería El Centro", numero_factura: "F-789", observaciones: "Reparación silla" },
  { fecha: "2026-05-02", hora: "14:20", usuario_email: "diego@brujula.local", categoria_nombre: "Aceites Carro/Moto", descripcion: "Aceite 20W50", cantidad: 1, unidad: "Galón", items: 1, precio_unitario_usd: 18, metodo_pago: "Efectivo $", lugar_compra: "Auto Repuestos JR", numero_factura: "F-456", observaciones: "Cambio aceite carro Orlando" },
  { fecha: "2026-05-02", hora: "16:00", usuario_email: "sandro@brujula.local", categoria_nombre: "Tecnología/Dispositivos", descripcion: "Mouse inalámbrico Logitech", cantidad: 1, unidad: "Unidad", items: 2, precio_unitario_usd: 25, metodo_pago: "Transferencia", lugar_compra: "TecnoStore", numero_factura: "F-2233", va_a_inventario: true, observaciones: "Para nuevos puestos de trabajo" },
];

// ===== Helpers =====

function log(level: "info" | "ok" | "warn" | "err", msg: string) {
  const prefix = {
    info: "  ",
    ok: " ✓",
    warn: " ⚠",
    err: " ✗",
  }[level];
  console.log(`${prefix} ${msg}`);
}

async function ensureUsers() {
  console.log("\n👥 Usuarios");
  const userByEmail = new Map<string, string>(); // email → id

  for (const u of USERS) {
    // ¿Ya existe?
    const { data: existing } = await sb
      .from("users")
      .select("id")
      .eq("email", u.email)
      .maybeSingle();
    if (existing) {
      userByEmail.set(u.email, existing.id);
      log("info", `${u.email} ya existe`);
      continue;
    }
    // Crear vía Admin API
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        nombre_completo: u.nombre_completo,
        rol: u.rol,
        cargo: u.cargo,
      },
    });
    if (error) {
      log("err", `${u.email}: ${error.message}`);
      continue;
    }
    if (!data.user) {
      log("err", `${u.email}: sin user en respuesta`);
      continue;
    }
    userByEmail.set(u.email, data.user.id);

    // Defensa: aseguramos que el row en public.users exista, por si el trigger
    // se saltó (idempotente con upsert).
    const { error: upsertErr } = await sb.from("users").upsert(
      {
        id: data.user.id,
        email: u.email,
        nombre_completo: u.nombre_completo,
        rol: u.rol,
        cargo: u.cargo,
      },
      { onConflict: "id" }
    );
    if (upsertErr) {
      log(
        "warn",
        `${u.email}: auth ok pero public.users falló: ${upsertErr.message}`
      );
    } else {
      log("ok", `${u.email} creado (rol: ${u.rol})`);
    }
  }
  return userByEmail;
}

async function ensureCategorias() {
  console.log("\n📂 Categorías");
  const catByName = new Map<string, string>();
  for (const c of CATEGORIAS) {
    const { data: existing } = await sb
      .from("categorias")
      .select("id")
      .eq("nombre", c.nombre)
      .maybeSingle();
    if (existing) {
      catByName.set(c.nombre, existing.id);
      log("info", `${c.nombre} ya existe`);
      continue;
    }
    const { data, error } = await sb
      .from("categorias")
      .insert(c)
      .select("id")
      .single();
    if (error) {
      log("err", `${c.nombre}: ${error.message}`);
      continue;
    }
    catByName.set(c.nombre, data.id);
    log("ok", `${c.nombre}`);
  }
  return catByName;
}

async function ensureTasa(orlandoId?: string) {
  console.log("\n💱 Tasa de cambio");
  const { data: existing } = await sb
    .from("tasa_cambio")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (existing) {
    log("info", "Ya hay tasa registrada (no se duplica)");
    return;
  }
  const { error } = await sb.from("tasa_cambio").insert({
    valor_bs_por_usd: 36.5,
    fuente: "Inicial · Excel mayo 2026",
    actualizado_por: orlandoId ?? null,
  });
  if (error) {
    log("err", error.message);
    return;
  }
  log("ok", "Tasa 36.5 Bs/USD registrada");
}

async function ensureMobiliario(userByEmail: Map<string, string>) {
  console.log("\n🪑 Mobiliario");
  for (const m of MOBILIARIO) {
    const { data: existing } = await sb
      .from("mobiliario")
      .select("id")
      .eq("codigo", m.codigo)
      .maybeSingle();
    if (existing) {
      log("info", `${m.codigo} ya existe`);
      continue;
    }
    const asignado_a = m.asignado_email
      ? userByEmail.get(m.asignado_email) ?? null
      : null;

    const { error } = await sb.from("mobiliario").insert({
      codigo: m.codigo,
      tipo: m.tipo,
      descripcion: m.descripcion,
      marca_modelo: m.marca_modelo,
      serial: m.serial,
      cantidad: m.cantidad,
      estado: m.estado,
      ubicacion: m.ubicacion,
      asignado_a,
      precio_compra_usd: m.precio_compra_usd,
      fecha_ingreso: m.fecha_ingreso,
      notas: m.notas,
    });
    if (error) {
      log("err", `${m.codigo}: ${error.message}`);
      continue;
    }
    log("ok", `${m.codigo} · ${m.descripcion}`);
  }
}

async function ensureGastos(
  userByEmail: Map<string, string>,
  catByName: Map<string, string>
) {
  console.log("\n💵 Gastos de ejemplo");
  // Si ya hay gastos, asumimos que el seed corrió antes
  const { count } = await sb
    .from("gastos")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    log("info", `Ya hay ${count} gastos · skipping`);
    return;
  }

  for (const g of GASTOS) {
    const usuario_id = userByEmail.get(g.usuario_email);
    const categoria_id = catByName.get(g.categoria_nombre);
    if (!usuario_id || !categoria_id) {
      log("warn", `Skipping gasto: usuario o categoría faltante (${g.descripcion})`);
      continue;
    }
    const { error } = await sb.from("gastos").insert({
      fecha: g.fecha,
      hora: g.hora,
      usuario_id,
      categoria_id,
      descripcion: g.descripcion,
      cantidad: g.cantidad,
      unidad: g.unidad,
      items: g.items,
      precio_unitario_usd: g.precio_unitario_usd,
      tasa_cambio: 36.5,
      metodo_pago: g.metodo_pago,
      lugar_compra: g.lugar_compra,
      numero_factura: g.numero_factura,
      va_a_inventario: ("va_a_inventario" in g ? g.va_a_inventario : false),
      observaciones: g.observaciones,
    });
    if (error) {
      log("err", `${g.descripcion}: ${error.message}`);
      continue;
    }
    log("ok", `${g.descripcion} (${g.usuario_email})`);
  }
}

// ===== Main =====

async function main() {
  console.log("🧭 Brújula Markets · Seed");
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Service role: ${SERVICE_ROLE!.slice(0, 18)}...`);

  // Smoke test: ¿la tabla users existe?
  const { error: smokeErr } = await sb.from("users").select("id").limit(1);
  if (smokeErr) {
    console.error(
      `\n❌ No se puede leer la tabla "users". Probablemente las migraciones no se aplicaron aún.\n   Detalle: ${smokeErr.message}`
    );
    console.error(
      "\n👉 Aplica primero las migraciones (ver README · sección Setup)."
    );
    process.exit(1);
  }

  const userByEmail = await ensureUsers();
  const orlandoId = userByEmail.get("orlando@brujula.local");
  const catByName = await ensureCategorias();
  await ensureTasa(orlandoId);
  await ensureMobiliario(userByEmail);
  await ensureGastos(userByEmail, catByName);

  console.log("\n✅ Seed completado.");
  console.log(`\n   Login: cualquier email de @brujula.local`);
  console.log(`   Password: ${PASSWORD}`);
  console.log(
    "\n   Cambia NEXT_PUBLIC_DATA_SOURCE=supabase en .env.local y reinicia pnpm dev."
  );
}

main().catch((e) => {
  console.error("\n💥 Seed falló:", e);
  process.exit(1);
});
