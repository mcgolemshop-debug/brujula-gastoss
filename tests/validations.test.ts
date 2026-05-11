import { describe, it, expect } from "vitest";
import { gastoSchema, loteGastosSchema } from "@/lib/validations/gasto";
import { mobiliarioSchema } from "@/lib/validations/mobiliario";
import { loginSchema } from "@/lib/validations/login";
import { tasaCambioSchema } from "@/lib/validations/tasa";
import { presupuestoSchema } from "@/lib/validations/presupuesto";

// UUID v4 válido para tests (Zod 4 rechaza el nil UUID)
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("gastoSchema", () => {
  const baseValid = {
    fecha: "2026-05-07",
    hora: "14:30",
    usuario_id: VALID_UUID,
    categoria_id: VALID_UUID,
    descripcion: "Carne de solomo",
    cantidad: 1.5,
    unidad: "Kg",
    items: 1,
    precio_unitario_usd: 8.5,
    metodo_pago: "Efectivo $",
  };

  it("acepta payload válido", () => {
    const r = gastoSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it("rechaza fecha mal formada", () => {
    const r = gastoSchema.safeParse({ ...baseValid, fecha: "07/05/2026" });
    expect(r.success).toBe(false);
  });

  it("rechaza hora mal formada (24:00)", () => {
    const r = gastoSchema.safeParse({ ...baseValid, hora: "24:00" });
    expect(r.success).toBe(false);
  });

  it("acepta hora en frontera 23:59", () => {
    const r = gastoSchema.safeParse({ ...baseValid, hora: "23:59" });
    expect(r.success).toBe(true);
  });

  it("rechaza descripción muy corta", () => {
    const r = gastoSchema.safeParse({ ...baseValid, descripcion: "A" });
    expect(r.success).toBe(false);
  });

  it("rechaza precio negativo", () => {
    const r = gastoSchema.safeParse({
      ...baseValid,
      precio_unitario_usd: -5,
    });
    expect(r.success).toBe(false);
  });

  it("acepta precio cero (regalo, descuento total)", () => {
    const r = gastoSchema.safeParse({
      ...baseValid,
      precio_unitario_usd: 0,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza items <= 0", () => {
    const r = gastoSchema.safeParse({ ...baseValid, items: 0 });
    expect(r.success).toBe(false);
  });

  it("rechaza items decimales", () => {
    const r = gastoSchema.safeParse({ ...baseValid, items: 1.5 });
    expect(r.success).toBe(false);
  });

  it("rechaza unidad fuera de la lista", () => {
    const r = gastoSchema.safeParse({ ...baseValid, unidad: "Toneladas" });
    expect(r.success).toBe(false);
  });

  it("rechaza método de pago fuera de la lista", () => {
    const r = gastoSchema.safeParse({
      ...baseValid,
      metodo_pago: "Bitcoin",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza UUID mal formado", () => {
    const r = gastoSchema.safeParse({
      ...baseValid,
      usuario_id: "not-a-uuid",
    });
    expect(r.success).toBe(false);
  });
});

describe("mobiliarioSchema", () => {
  const baseValid = {
    tipo: "mobiliario",
    descripcion: "Escritorio",
    cantidad: 1,
    estado: "buen_estado",
    precio_compra_usd: 350,
    fecha_ingreso: "2025-01-15",
  };

  it("acepta payload válido", () => {
    const r = mobiliarioSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it("rechaza estado fuera de lista", () => {
    const r = mobiliarioSchema.safeParse({
      ...baseValid,
      estado: "perfecto",
    });
    expect(r.success).toBe(false);
  });

  it("acepta todos los estados válidos", () => {
    for (const estado of [
      "nuevo",
      "buen_estado",
      "regular",
      "necesita_reparacion",
      "dado_de_baja",
    ]) {
      const r = mobiliarioSchema.safeParse({ ...baseValid, estado });
      expect(r.success).toBe(true);
    }
  });

  it("rechaza cantidad cero o negativa", () => {
    expect(
      mobiliarioSchema.safeParse({ ...baseValid, cantidad: 0 }).success
    ).toBe(false);
    expect(
      mobiliarioSchema.safeParse({ ...baseValid, cantidad: -1 }).success
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("acepta email + password válidos", () => {
    const r = loginSchema.safeParse({
      email: "orlando@brujula.local",
      password: "Brujula2026!",
    });
    expect(r.success).toBe(true);
  });

  it("normaliza email a lowercase y trim", () => {
    const r = loginSchema.safeParse({
      email: "  ORLANDO@BRUJULA.LOCAL  ",
      password: "abcdef",
    });
    if (r.success) {
      expect(r.data.email).toBe("orlando@brujula.local");
    } else {
      expect.fail("Debió aceptar el email con whitespace y caps");
    }
  });

  it("rechaza email inválido", () => {
    const r = loginSchema.safeParse({
      email: "not-email",
      password: "abcdef",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza password muy corto", () => {
    const r = loginSchema.safeParse({
      email: "a@b.com",
      password: "12",
    });
    expect(r.success).toBe(false);
  });
});

describe("tasaCambioSchema", () => {
  it("acepta valor positivo", () => {
    const r = tasaCambioSchema.safeParse({
      valor_bs_por_usd: 36.5,
      fuente: "BCV",
    });
    expect(r.success).toBe(true);
  });
  it("rechaza valor cero o negativo", () => {
    expect(
      tasaCambioSchema.safeParse({ valor_bs_por_usd: 0, fuente: "BCV" })
        .success
    ).toBe(false);
    expect(
      tasaCambioSchema.safeParse({ valor_bs_por_usd: -1, fuente: "BCV" })
        .success
    ).toBe(false);
  });
});

describe("presupuestoSchema", () => {
  const baseValid = {
    categoria_id: VALID_UUID,
    mes: 5,
    anio: 2026,
    monto_usd: 200,
  };
  it("acepta payload válido", () => {
    expect(presupuestoSchema.safeParse(baseValid).success).toBe(true);
  });
  it("rechaza mes fuera de 1-12", () => {
    expect(
      presupuestoSchema.safeParse({ ...baseValid, mes: 0 }).success
    ).toBe(false);
    expect(
      presupuestoSchema.safeParse({ ...baseValid, mes: 13 }).success
    ).toBe(false);
  });
  it("acepta mes 1 y 12 (frontera)", () => {
    expect(
      presupuestoSchema.safeParse({ ...baseValid, mes: 1 }).success
    ).toBe(true);
    expect(
      presupuestoSchema.safeParse({ ...baseValid, mes: 12 }).success
    ).toBe(true);
  });
});

describe("loteGastosSchema", () => {
  const CAT_A = "550e8400-e29b-41d4-a716-446655440001";
  const CAT_B = "550e8400-e29b-41d4-a716-446655440002";
  const USER = "550e8400-e29b-41d4-a716-446655440000";

  const baseHeader = {
    fecha: "2026-05-07",
    hora: "14:30",
    usuario_id: USER,
    metodo_pago: "Efectivo $" as const,
  };

  const baseRow = {
    categoria_id: CAT_A,
    descripcion: "Café molido",
    cantidad: 1,
    unidad: "Kg" as const,
    items: 1,
    precio_unitario_usd: 12,
  };

  it("acepta lote válido con una fila", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [baseRow],
    });
    expect(r.success).toBe(true);
  });

  it("acepta lote válido con varias filas distintas", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [
        baseRow,
        { ...baseRow, descripcion: "Leche entera", categoria_id: CAT_B },
        { ...baseRow, descripcion: "Galletas", categoria_id: CAT_A },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza lote sin filas", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza lote con más de 20 filas", () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      ...baseRow,
      descripcion: `Item ${i}`,
    }));
    const r = loteGastosSchema.safeParse({ header: baseHeader, rows });
    expect(r.success).toBe(false);
  });

  it("rechaza header con fecha mal formada", () => {
    const r = loteGastosSchema.safeParse({
      header: { ...baseHeader, fecha: "07/05/2026" },
      rows: [baseRow],
    });
    expect(r.success).toBe(false);
  });

  it("marca duplicados de descripción+categoría con warning soft", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [
        baseRow,
        { ...baseRow, descripcion: "Café Molido" }, // misma categoría, mismo nombre (case-insensitive)
      ],
    });
    // El superRefine emite issue → safeParse devuelve success:false
    expect(r.success).toBe(false);
    if (!r.success) {
      const dupIssue = r.error.issues.find(
        (i) =>
          i.path.join(".") === "rows.1.descripcion" &&
          i.message.includes("duplicado")
      );
      expect(dupIssue).toBeDefined();
    }
  });

  it("NO marca duplicado cuando la categoría difiere", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [
        baseRow,
        { ...baseRow, categoria_id: CAT_B }, // mismo nombre, distinta categoría
      ],
    });
    expect(r.success).toBe(true);
  });

  it("propaga errores con path indexado por fila", () => {
    const r = loteGastosSchema.safeParse({
      header: baseHeader,
      rows: [baseRow, { ...baseRow, precio_unitario_usd: -5 }],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find(
        (i) => i.path.join(".") === "rows.1.precio_unitario_usd"
      );
      expect(issue).toBeDefined();
    }
  });
});
