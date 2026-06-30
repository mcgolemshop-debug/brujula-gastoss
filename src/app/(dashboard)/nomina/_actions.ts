"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/repositories";
import {
  salarioSchema,
  pagoNominaSchema,
  type PagoNominaInput,
} from "@/lib/validations/nomina";
import { CATEGORIA_NOMINA } from "@/lib/constants";
import type { ActionResult } from "../gastos/_actions";
import type { NuevoGastoInput, NuevoPagoNominaInput } from "@/types/domain";

/** Define/actualiza el salario mensual (USD) de un empleado. Admin only. */
export async function setSalarioAction(input: {
  empleado_id: string;
  salario_mensual_usd: number;
}): Promise<ActionResult<true>> {
  const parsed = salarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede definir salarios" };
  }
  try {
    await repo.nominas.setSalario(
      parsed.data.empleado_id,
      parsed.data.salario_mensual_usd
    );
    revalidatePath("/nomina");
    revalidatePath("/equipo");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al guardar salario",
    };
  }
}

/** Busca la categoría "Nómina"; la crea si no existe. Devuelve su id. */
async function ensureCategoriaNomina(): Promise<string> {
  const cats = await repo.categorias.list(true);
  const existente = cats.find((c) => c.nombre === CATEGORIA_NOMINA);
  if (existente) return existente.id;
  const nueva = await repo.categorias.create({
    nombre: CATEGORIA_NOMINA,
    icono: "Wallet",
    color: "#0EA5E9",
    tipo: "fijo",
    notas: "Pago de sueldos al equipo",
  });
  return nueva.id;
}

/**
 * Registra un pago de nómina a un empleado. Crea (1) un gasto en la categoría
 * "Nómina" para que cuente en reportes/dashboard, y (2) el registro en el libro
 * de nómina enlazado a ese gasto. Admin only.
 */
export async function registrarPagoNominaAction(
  input: PagoNominaInput
): Promise<ActionResult<{ id: string; codigo: string }>> {
  const parsed = pagoNominaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede registrar nómina" };
  }

  const data = parsed.data;
  const bonos = data.bonos_usd ?? 0;
  const deducciones = data.deducciones_usd ?? 0;
  const totalUsd = data.salario_base_usd + bonos - deducciones;

  if (totalUsd <= 0) {
    return { ok: false, error: "El total a pagar debe ser mayor a 0" };
  }

  // Empleado (para descripción del gasto)
  const empleado = await repo.users.byId(data.empleado_id);
  if (!empleado) return { ok: false, error: "Empleado no encontrado" };

  // Evitar doble pago de la misma semana al mismo empleado
  const yaPagados = await repo.nominas.pagosDeSemana(
    data.semana_inicio,
    data.semana_fin
  );
  if (yaPagados.some((p) => p.empleado_id === data.empleado_id)) {
    return {
      ok: false,
      error: `${empleado.nombre_completo} ya tiene un pago registrado para esta semana`,
    };
  }

  const tasa = await repo.tasaCambio.actual();
  const tasaValor = tasa.valor_bs_por_usd;

  try {
    // 1. Crear el gasto (categoría Nómina) para que sume en reportes
    const categoriaId = await ensureCategoriaNomina();
    const now = new Date();
    const gastoInput: NuevoGastoInput = {
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      usuario_id: user.id,
      categoria_id: categoriaId,
      descripcion: `Nómina ${empleado.nombre_completo} · semana ${data.semana_inicio}`,
      cantidad: 1,
      unidad: "Unidad",
      items: 1,
      precio_unitario_usd: totalUsd,
      metodo_pago: data.metodo_pago,
      observaciones:
        data.notas && data.notas !== "" ? data.notas : `Pago de nómina`,
    };
    const gasto = await repo.gastos.create(gastoInput, user.id);

    // 2. Registrar el pago en el libro de nómina, enlazado al gasto
    const pagoInput: NuevoPagoNominaInput = {
      empleado_id: data.empleado_id,
      gasto_id: gasto.id,
      semana_inicio: data.semana_inicio,
      semana_fin: data.semana_fin,
      salario_base_usd: data.salario_base_usd,
      bonos_usd: bonos,
      deducciones_usd: deducciones,
      tasa_cambio: tasaValor,
      metodo_pago: data.metodo_pago,
      notas: data.notas && data.notas !== "" ? data.notas : null,
    };
    const pago = await repo.nominas.create(pagoInput, user.id);

    revalidatePath("/nomina");
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: { id: pago.id, codigo: pago.codigo } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al registrar el pago",
    };
  }
}

/** Elimina un pago de nómina y su gasto asociado. Admin only. */
export async function eliminarPagoNominaAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar pagos" };
  }
  try {
    const pago = await repo.nominas.byId(id);
    if (!pago) return { ok: false, error: "Pago no encontrado" };
    await repo.nominas.delete(id);
    // Borrar también el gasto asociado para no inflar reportes
    if (pago.gasto_id) {
      await repo.gastos.delete(pago.gasto_id).catch(() => {});
    }
    revalidatePath("/nomina");
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar el pago",
    };
  }
}
