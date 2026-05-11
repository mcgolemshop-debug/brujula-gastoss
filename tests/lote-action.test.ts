import { describe, it, expect, beforeEach, vi } from "vitest";

const ADMIN_ID = "550e8400-e29b-41d4-a716-446655440000";
const EMPLOYEE_ID = "550e8400-e29b-41d4-a716-446655440099";
const CAT_A = "550e8400-e29b-41d4-a716-446655440001";
const CAT_B = "550e8400-e29b-41d4-a716-446655440002";

// Estado mockeable que cada test puede reescribir
const state = {
  currentUser: {
    id: EMPLOYEE_ID,
    rol: "empleado" as "admin" | "empleado",
    nombre_completo: "Empleado Test",
    email: "emp@brujula.local",
  },
  createImpl: vi.fn(),
  deleteImpl: vi.fn(),
  uploadImpl: vi.fn(),
  pushImpl: vi.fn(),
};

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
}));

vi.mock("@/lib/repositories", () => ({
  repo: {
    users: {
      current: async () => state.currentUser,
    },
    gastos: {
      create: (...args: unknown[]) => state.createImpl(...args),
      delete: (...args: unknown[]) => state.deleteImpl(...args),
    },
    facturas: {
      upload: (...args: unknown[]) => state.uploadImpl(...args),
    },
  },
}));

vi.mock("@/lib/push/send", () => ({
  sendPushToAdmins: (...args: unknown[]) => state.pushImpl(...args),
}));

// Importar DESPUÉS de configurar los mocks
import { crearLoteGastosAction } from "@/app/(dashboard)/gastos/_actions";
import type { LoteGastosInput } from "@/lib/validations/gasto";

const baseHeader = {
  fecha: "2026-05-07",
  hora: "14:30",
  usuario_id: EMPLOYEE_ID,
  metodo_pago: "Efectivo $" as const,
  lugar_compra: "Supermercado",
  numero_factura: "",
};

const baseRow = {
  categoria_id: CAT_A,
  descripcion: "Café molido",
  cantidad: 1,
  unidad: "Kg" as const,
  items: 1,
  precio_unitario_usd: 12,
};

function buildLote(rows: number, perRowUsd = 12): LoteGastosInput {
  return {
    header: baseHeader,
    rows: Array.from({ length: rows }, (_, i) => ({
      ...baseRow,
      descripcion: `Item ${i + 1}`,
      precio_unitario_usd: perRowUsd,
      categoria_id: i % 2 === 0 ? CAT_A : CAT_B,
    })),
  };
}

let createCounter = 0;
beforeEach(() => {
  vi.clearAllMocks();
  createCounter = 0;
  state.currentUser = {
    id: EMPLOYEE_ID,
    rol: "empleado",
    nombre_completo: "Empleado Test",
    email: "emp@brujula.local",
  };
  state.createImpl.mockImplementation(async (input: { precio_unitario_usd: number; items: number }) => {
    createCounter += 1;
    return {
      id: `gasto-${createCounter}`,
      codigo: `G-${String(createCounter).padStart(4, "0")}`,
      total_usd: input.precio_unitario_usd * input.items,
    };
  });
  state.deleteImpl.mockResolvedValue(undefined);
  state.uploadImpl.mockResolvedValue({ url: "x", id: "fac-1" });
  state.pushImpl.mockResolvedValue(0);
});

describe("crearLoteGastosAction", () => {
  it("crea N gastos secuencialmente y devuelve los códigos", async () => {
    const result = await crearLoteGastosAction(buildLote(3, 10));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.creados).toHaveLength(3);
      expect(result.data.total_usd).toBe(30);
      expect(state.createImpl).toHaveBeenCalledTimes(3);
    }
  });

  it("rollback: si falla la fila 2, elimina la 1 y reporta el error", async () => {
    state.createImpl
      .mockImplementationOnce(async () => ({
        id: "gasto-1",
        codigo: "G-0001",
        total_usd: 10,
      }))
      .mockImplementationOnce(async () => {
        throw new Error("UNIQUE constraint failed");
      });
    const result = await crearLoteGastosAction(buildLote(3, 10));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("fila 2");
      expect(result.error).toContain("UNIQUE");
    }
    expect(state.deleteImpl).toHaveBeenCalledWith("gasto-1");
  });

  it("rechaza si el input es inválido (sin filas)", async () => {
    const result = await crearLoteGastosAction({
      header: baseHeader,
      rows: [],
    });
    expect(result.ok).toBe(false);
    expect(state.createImpl).not.toHaveBeenCalled();
  });

  it("rechaza si el usuario no es admin y header.usuario_id es otro", async () => {
    const result = await crearLoteGastosAction({
      header: { ...baseHeader, usuario_id: ADMIN_ID },
      rows: [baseRow],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/admin/i);
    }
    expect(state.createImpl).not.toHaveBeenCalled();
  });

  it("dispara push agregada UNA sola vez si total ≥ $100 y user empleado", async () => {
    // 11 filas × $10 = $110
    const result = await crearLoteGastosAction(buildLote(11, 10));
    expect(result.ok).toBe(true);
    expect(state.pushImpl).toHaveBeenCalledTimes(1);
  });

  it("NO dispara push si total < $100", async () => {
    const result = await crearLoteGastosAction(buildLote(5, 10));
    expect(result.ok).toBe(true);
    expect(state.pushImpl).not.toHaveBeenCalled();
  });

  it("NO dispara push si el usuario es admin (aunque ≥ $100)", async () => {
    state.currentUser = {
      id: ADMIN_ID,
      rol: "admin",
      nombre_completo: "Admin",
      email: "admin@brujula.local",
    };
    const result = await crearLoteGastosAction({
      header: { ...baseHeader, usuario_id: ADMIN_ID },
      rows: Array.from({ length: 11 }, (_, i) => ({
        ...baseRow,
        descripcion: `Item ${i + 1}`,
        precio_unitario_usd: 10,
        categoria_id: i % 2 === 0 ? CAT_A : CAT_B,
      })),
    });
    expect(result.ok).toBe(true);
    expect(state.pushImpl).not.toHaveBeenCalled();
  });
});
