"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/repositories";
import {
  reembolsoSchema,
  marcarPagadoSchema,
  type ReembolsoFormInput,
  type MarcarPagadoInput,
} from "@/lib/validations/reembolso";
import { sendPushToAdmins, sendPushToUser } from "@/lib/push/send";
import { formatUSD } from "@/lib/utils";
import type { ActionResult } from "../gastos/_actions";
import type { NuevoReembolsoInput } from "@/types/domain";

export async function crearReembolsoAction(
  input: ReembolsoFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = reembolsoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  // Sólo permitir crear reembolso al beneficiario o al admin
  if (user.rol !== "admin" && parsed.data.beneficiario_id !== user.id) {
    return {
      ok: false,
      error: "Sólo el admin puede crear reembolsos para terceros",
    };
  }

  // Evitar duplicados sobre el mismo gasto
  const existente = await repo.reembolsos.byGastoId(parsed.data.gasto_id);
  if (existente) {
    return {
      ok: false,
      error: "Ya hay un reembolso registrado para este gasto",
    };
  }

  try {
    const r = await repo.reembolsos.create(parsed.data as NuevoReembolsoInput);
    revalidatePath("/reembolsos");
    revalidatePath(`/gastos/${parsed.data.gasto_id}`);
    revalidatePath("/dashboard");

    if (user.rol !== "admin") {
      sendPushToAdmins({
        title: `💰 Reembolso pendiente`,
        body: `${user.nombre_completo} pidió ${formatUSD(parsed.data.monto_usd)}`,
        url: "/reembolsos",
        tag: `reb-${r.id}`,
      }).catch(() => {});
    }

    return { ok: true, data: { id: r.id } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear reembolso",
    };
  }
}

export async function marcarPagadoAction(
  id: string,
  input: MarcarPagadoInput
): Promise<ActionResult<true>> {
  const parsed = marcarPagadoSchema.safeParse(input);
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
    return {
      ok: false,
      error: "Sólo el admin puede marcar reembolsos como pagados",
    };
  }
  try {
    const r = await repo.reembolsos.marcarPagado(
      id,
      parsed.data.metodo_pago,
      parsed.data.fecha_pago
    );
    revalidatePath("/reembolsos");

    // Notificamos al beneficiario que ya le pagaron
    if (r.beneficiario_id) {
      sendPushToUser(r.beneficiario_id, {
        title: "✅ Reembolso pagado",
        body: `Recibiste ${formatUSD(r.monto_usd)} vía ${parsed.data.metodo_pago}`,
        url: "/reembolsos",
        tag: `reb-pago-${r.id}`,
      }).catch(() => {});
    }

    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al marcar pagado",
    };
  }
}

export async function eliminarReembolsoAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Sólo el admin puede eliminar reembolsos" };
  }
  try {
    await repo.reembolsos.delete(id);
    revalidatePath("/reembolsos");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar",
    };
  }
}
