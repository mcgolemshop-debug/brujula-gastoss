import { describe, it, expect, beforeEach, vi } from "vitest";

const ADMIN_ID = "550e8400-e29b-41d4-a716-446655440000";
const EMP_ID = "550e8400-e29b-41d4-a716-446655440099";

const state = {
  currentUser: {
    id: ADMIN_ID,
    rol: "admin" as "admin" | "empleado",
    nombre_completo: "Orlando",
    email: "orlando@brujula.local",
  },
  empleado: {
    id: EMP_ID,
    nombre_completo: "Christian Polanco",
    rol: "empleado",
  },
  pagosDeSemana: [] as { empleado_id: string }[],
  categorias: [{ id: "cat-nomina", nombre: "Nómina" }],
  gastosCreate: vi.fn(),
  gastosDelete: vi.fn(),
  nominasCreate: vi.fn(),
  categoriasCreate: vi.fn(),
};

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("@/lib/repositories", () => ({
  repo: {
    users: {
      current: async () => state.currentUser,
      byId: async (id: string) => (id === EMP_ID ? state.empleado : null),
    },
    categorias: {
      list: async () => state.categorias,
      create: (...a: unknown[]) => state.categoriasCreate(...a),
    },
    gastos: {
      create: (...a: unknown[]) => state.gastosCreate(...a),
      delete: (...a: unknown[]) => state.gastosDelete(...a),
    },
    nominas: {
      pagosDeSemana: async () => state.pagosDeSemana,
      create: (...a: unknown[]) => state.nominasCreate(...a),
      byId: async () => null,
      delete: async () => {},
    },
    tasaCambio: {
      actual: async () => ({ valor_bs_por_usd: 500 }),
    },
  },
}));

import { registrarPagoNominaAction } from "@/app/(dashboard)/nomina/_actions";

const baseInput = {
  empleado_id: EMP_ID,
  semana_inicio: "2026-05-04",
  semana_fin: "2026-05-10",
  salario_base_usd: 100,
  bonos_usd: 0,
  deducciones_usd: 0,
  metodo_pago: "Efectivo Bs" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.currentUser = {
    id: ADMIN_ID,
    rol: "admin",
    nombre_completo: "Orlando",
    email: "orlando@brujula.local",
  };
  state.pagosDeSemana = [];
  state.categorias = [{ id: "cat-nomina", nombre: "Nómina" }];
  state.gastosCreate.mockResolvedValue({ id: "gasto-1", codigo: "G-0001" });
  state.nominasCreate.mockResolvedValue({ id: "nom-1", codigo: "N-0001" });
});

describe("registrarPagoNominaAction", () => {
  it("crea gasto + pago con el total correcto (base + bonos - deducciones)", async () => {
    const r = await registrarPagoNominaAction({
      ...baseInput,
      salario_base_usd: 100,
      bonos_usd: 20,
      deducciones_usd: 30,
    });
    expect(r.ok).toBe(true);
    // Gasto creado con total 90 USD como precio_unitario_usd
    expect(state.gastosCreate).toHaveBeenCalledTimes(1);
    const gastoArg = state.gastosCreate.mock.calls[0][0] as {
      precio_unitario_usd: number;
      categoria_id: string;
    };
    expect(gastoArg.precio_unitario_usd).toBe(90);
    expect(gastoArg.categoria_id).toBe("cat-nomina");
    // Pago creado, enlazado al gasto, con la tasa actual
    expect(state.nominasCreate).toHaveBeenCalledTimes(1);
    const pagoArg = state.nominasCreate.mock.calls[0][0] as {
      gasto_id: string;
      tasa_cambio: number;
    };
    expect(pagoArg.gasto_id).toBe("gasto-1");
    expect(pagoArg.tasa_cambio).toBe(500);
  });

  it("rechaza doble pago de la misma semana al mismo empleado", async () => {
    state.pagosDeSemana = [{ empleado_id: EMP_ID }];
    const r = await registrarPagoNominaAction(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/ya tiene un pago/i);
    expect(state.gastosCreate).not.toHaveBeenCalled();
  });

  it("rechaza si el usuario no es admin", async () => {
    state.currentUser = {
      id: EMP_ID,
      rol: "empleado",
      nombre_completo: "Christian",
      email: "c@brujula.local",
    };
    const r = await registrarPagoNominaAction(baseInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/admin/i);
    expect(state.gastosCreate).not.toHaveBeenCalled();
  });

  it("rechaza si las deducciones dejan el total en 0 o negativo", async () => {
    const r = await registrarPagoNominaAction({
      ...baseInput,
      salario_base_usd: 100,
      bonos_usd: 0,
      deducciones_usd: 100,
    });
    expect(r.ok).toBe(false);
    expect(state.gastosCreate).not.toHaveBeenCalled();
  });

  it("crea la categoría Nómina si no existe", async () => {
    state.categorias = []; // no existe
    state.categoriasCreate.mockResolvedValue({ id: "cat-nueva" });
    const r = await registrarPagoNominaAction(baseInput);
    expect(r.ok).toBe(true);
    expect(state.categoriasCreate).toHaveBeenCalledTimes(1);
    const gastoArg = state.gastosCreate.mock.calls[0][0] as {
      categoria_id: string;
    };
    expect(gastoArg.categoria_id).toBe("cat-nueva");
  });
});
