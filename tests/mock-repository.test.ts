import { describe, it, expect, beforeAll } from "vitest";
import { mockRepository } from "@/lib/repositories/mock";

const ORLANDO_ID = "00000000-0000-0000-0000-000000000001";
const CHRISTIAN_ID = "00000000-0000-0000-0000-000000000004";

describe("mockRepository.users", () => {
  it("lista los 8 usuarios del seed", async () => {
    const users = await mockRepository.users.list();
    expect(users).toHaveLength(8);
  });

  it("Orlando es admin", async () => {
    const u = await mockRepository.users.byId(ORLANDO_ID);
    expect(u?.rol).toBe("admin");
    expect(u?.nombre_completo).toBe("Orlando Velásquez");
  });

  it("Christian es empleado", async () => {
    const u = await mockRepository.users.byId(CHRISTIAN_ID);
    expect(u?.rol).toBe("empleado");
  });

  it("byEmail devuelve null si no existe", async () => {
    const u = await mockRepository.users.byEmail("noexiste@x.com");
    expect(u).toBeNull();
  });

  it("byEmail es case-insensitive", async () => {
    const u = await mockRepository.users.byEmail("ORLANDO@BRUJULA.LOCAL");
    expect(u?.id).toBe(ORLANDO_ID);
  });
});

describe("mockRepository.categorias", () => {
  it("lista las 12 categorías ordenadas", async () => {
    const cats = await mockRepository.categorias.list();
    expect(cats.length).toBe(12);
    // Comida es orden 1
    expect(cats[0].nombre).toBe("Comida");
    expect(cats[cats.length - 1].nombre).toBe("Otros");
  });

  it("cada categoría tiene tipo válido", async () => {
    const cats = await mockRepository.categorias.list();
    for (const c of cats) {
      expect(["variable", "fijo", "activo_fijo"]).toContain(c.tipo);
    }
  });
});

describe("mockRepository.gastos", () => {
  let categoriaComida: string;

  beforeAll(async () => {
    const cats = await mockRepository.categorias.list();
    categoriaComida = cats.find((c) => c.nombre === "Comida")!.id;
  });

  it("lista los 5 gastos del seed", async () => {
    const r = await mockRepository.gastos.list();
    expect(r.total).toBe(5);
    expect(r.items).toHaveLength(5);
  });

  it("cada gasto trae usuario y categoría joineados", async () => {
    const r = await mockRepository.gastos.list();
    for (const g of r.items) {
      expect(g.usuario).toBeDefined();
      expect(g.categoria).toBeDefined();
    }
  });

  it("filtro por categoría funciona", async () => {
    const r = await mockRepository.gastos.list({
      categoria_id: categoriaComida,
    });
    // Christian tiene 2 gastos de comida en el seed
    expect(r.total).toBe(2);
  });

  it("filtro por usuario funciona", async () => {
    const r = await mockRepository.gastos.list({
      usuario_id: CHRISTIAN_ID,
    });
    expect(r.total).toBe(2);
    for (const g of r.items) expect(g.usuario_id).toBe(CHRISTIAN_ID);
  });

  it("búsqueda por descripción es case-insensitive", async () => {
    const r = await mockRepository.gastos.list({ search: "CARNE" });
    expect(r.items.some((g) => g.descripcion.includes("Carne"))).toBe(true);
  });

  it("búsqueda por código G-XXXX", async () => {
    const r = await mockRepository.gastos.list({ search: "G-0001" });
    expect(r.total).toBe(1);
    expect(r.items[0].codigo).toBe("G-0001");
  });

  it("ordenamiento por fecha descendente (default)", async () => {
    const r = await mockRepository.gastos.list({ sort: "fecha_desc" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].fecha >= r.items[i].fecha).toBe(true);
    }
  });

  it("ordenamiento por total descendente", async () => {
    const r = await mockRepository.gastos.list({ sort: "total_desc" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].total_usd >= r.items[i].total_usd).toBe(true);
    }
  });

  it("paginación funciona", async () => {
    const r = await mockRepository.gastos.list({ page: 1, page_size: 2 });
    expect(r.items.length).toBe(2);
    expect(r.total).toBe(5);
    expect(r.page).toBe(1);

    const r2 = await mockRepository.gastos.list({ page: 2, page_size: 2 });
    expect(r2.items.length).toBe(2);
    // No debe repetir items entre páginas
    const idsP1 = new Set(r.items.map((g) => g.id));
    const idsP2 = new Set(r2.items.map((g) => g.id));
    for (const id of idsP2) expect(idsP1.has(id)).toBe(false);
  });

  it("create calcula total_usd y total_bs correctamente", async () => {
    const created = await mockRepository.gastos.create(
      {
        fecha: "2026-05-15",
        hora: "10:00",
        usuario_id: ORLANDO_ID,
        categoria_id: categoriaComida,
        descripcion: "Test gasto " + Math.random(),
        cantidad: 2,
        unidad: "Kg",
        items: 3,
        precio_unitario_usd: 10,
        metodo_pago: "Efectivo $",
      },
      ORLANDO_ID
    );
    // 3 items × $10 = $30
    expect(created.total_usd).toBe(30);
    // 30 × tasa actual
    expect(created.total_bs).toBe(30 * created.tasa_cambio);
    // Código generado G-XXXX
    expect(created.codigo).toMatch(/^G-\d{4}$/);
  });

  it("kpis suma correctamente", async () => {
    const k = await mockRepository.gastos.kpis();
    expect(k.total_acumulado_usd).toBeGreaterThan(0);
    expect(k.compras_mes).toBeGreaterThanOrEqual(0);
  });

  it("topCategoriasMes devuelve ordenado por total desc", async () => {
    const r = await mockRepository.gastos.topCategoriasMes(5);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].total_usd).toBeGreaterThanOrEqual(r[i].total_usd);
    }
    // Cada item tiene los 5 campos esperados
    for (const item of r) {
      expect(item).toHaveProperty("categoria_id");
      expect(item).toHaveProperty("nombre");
      expect(item).toHaveProperty("color");
      expect(item).toHaveProperty("total_usd");
      expect(item).toHaveProperty("pct");
    }
  });
});

describe("mockRepository.mobiliario", () => {
  it("lista los 10 ítems del seed", async () => {
    const items = await mockRepository.mobiliario.list();
    expect(items).toHaveLength(10);
  });

  it("cambiarEstado actualiza el item", async () => {
    const items = await mockRepository.mobiliario.list();
    const m001 = items.find((m) => m.codigo === "M-001")!;
    expect(m001.estado).toBe("buen_estado");

    const updated = await mockRepository.mobiliario.cambiarEstado(
      m001.id,
      "regular"
    );
    expect(updated.estado).toBe("regular");

    // Verificar que persiste
    const re = await mockRepository.mobiliario.byId(m001.id);
    expect(re?.estado).toBe("regular");
  });

  it("create genera código M-XXX automáticamente", async () => {
    const created = await mockRepository.mobiliario.create({
      tipo: "dispositivo",
      descripcion: "Test device",
      cantidad: 1,
      estado: "nuevo",
      precio_compra_usd: 100,
      fecha_ingreso: "2026-05-15",
    });
    expect(created.codigo).toMatch(/^M-\d{3}$/);
  });
});

describe("mockRepository.tasaCambio", () => {
  it("actual devuelve tasa válida", async () => {
    const t = await mockRepository.tasaCambio.actual();
    expect(t.valor_bs_por_usd).toBeGreaterThan(0);
  });

  it("actualizar agrega al histórico", async () => {
    const before = await mockRepository.tasaCambio.historico();
    await mockRepository.tasaCambio.actualizar(40, "test", ORLANDO_ID);
    const after = await mockRepository.tasaCambio.historico();
    expect(after.length).toBe(before.length + 1);
    // El nuevo es el más reciente
    expect(after[0].valor_bs_por_usd).toBe(40);
    expect(after[0].fuente).toBe("test");
  });
});

describe("mockRepository.presupuestos", () => {
  let cId: string;
  beforeAll(async () => {
    const cats = await mockRepository.categorias.list();
    cId = cats.find((c) => c.nombre === "Comida")!.id;
  });

  it("upsert crea cuando no existe", async () => {
    const p = await mockRepository.presupuestos.upsert({
      categoria_id: cId,
      mes: 5,
      anio: 2026,
      monto_usd: 200,
    });
    expect(p.monto_usd).toBe(200);
  });

  it("upsert actualiza cuando ya existe (mismo cat+mes+anio)", async () => {
    await mockRepository.presupuestos.upsert({
      categoria_id: cId,
      mes: 5,
      anio: 2026,
      monto_usd: 200,
    });
    const updated = await mockRepository.presupuestos.upsert({
      categoria_id: cId,
      mes: 5,
      anio: 2026,
      monto_usd: 350,
    });
    expect(updated.monto_usd).toBe(350);

    const list = await mockRepository.presupuestos.listConGasto(5, 2026);
    const found = list.filter((p) => p.categoria_id === cId);
    expect(found).toHaveLength(1); // No duplicó
    expect(found[0].monto_usd).toBe(350);
  });

  it("listConGasto calcula gastado_usd cruzando con gastos del mes", async () => {
    await mockRepository.presupuestos.upsert({
      categoria_id: cId,
      mes: 5,
      anio: 2026,
      monto_usd: 100,
    });
    const list = await mockRepository.presupuestos.listConGasto(5, 2026);
    const comida = list.find((p) => p.categoria_id === cId)!;
    // Hay 2 gastos de Comida en mayo 2026 ($8.50 + $1.20 + extras de tests anteriores)
    expect(comida.gastado_usd).toBeGreaterThan(0);
  });
});
