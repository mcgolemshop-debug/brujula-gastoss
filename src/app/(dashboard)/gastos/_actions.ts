"use server";

import { revalidatePath } from "next/cache";
import {
  gastoSchema,
  editGastoSchema,
  loteGastosSchema,
  type LoteGastosInput,
} from "@/lib/validations/gasto";
import { repo } from "@/lib/repositories";
import { sendPushToAdmins } from "@/lib/push/send";
import { formatUSD } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NuevoGastoInput } from "@/types/domain";

/** Umbral en USD para notificar al admin de un gasto registrado */
const PUSH_THRESHOLD_USD = 100;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function crearGastoAction(
  input: NuevoGastoInput
): Promise<ActionResult<{ id: string; codigo: string }>> {
  // Validación
  const parsed = gastoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  try {
    const gasto = await repo.gastos.create(
      parsed.data as NuevoGastoInput,
      user.id
    );
    revalidatePath("/gastos");
    revalidatePath("/dashboard");

    // Push opcional al admin si el gasto supera el umbral y NO fue creado por el admin
    if (gasto.total_usd >= PUSH_THRESHOLD_USD && user.rol !== "admin") {
      sendPushToAdmins({
        title: `💸 Nuevo gasto · ${formatUSD(gasto.total_usd)}`,
        body: `${user.nombre_completo} registró: ${gasto.descripcion}`,
        url: `/gastos/${gasto.id}`,
        tag: `gasto-${gasto.id}`,
      }).catch(() => {});
    }

    return { ok: true, data: { id: gasto.id, codigo: gasto.codigo } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear gasto",
    };
  }
}

/**
 * Sube la foto de factura al bucket "facturas" y registra metadata.
 * Se llama después de crearGastoAction si hay foto adjunta.
 */
export async function subirFacturaAction(
  gastoId: string,
  formData: FormData
): Promise<ActionResult<{ url: string; id: string }>> {
  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Archivo inválido" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Archivo muy grande (máx 10 MB)" };
  }
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
  ];
  // iOS a veces reporta type vacío ("") para fotos HEIC de la cámara; lo
  // permitimos (el tamaño ya está acotado a 10 MB).
  if (file.type !== "" && !allowed.includes(file.type)) {
    return { ok: false, error: "Tipo de archivo no permitido" };
  }

  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  try {
    const result = await repo.facturas.upload(
      gastoId,
      file,
      file.name,
      user.id
    );
    revalidatePath(`/gastos/${gastoId}`);
    revalidatePath("/gastos");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error subiendo factura",
    };
  }
}

export async function eliminarGastoAction(
  id: string
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar gastos" };
  }
  try {
    await repo.gastos.delete(id);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar",
    };
  }
}

/**
 * Catalejo · Adjunta un comprobante ya subido a Storage (scan-tmp) a uno o más
 * gastos recién creados: copia la imagen a la carpeta de cada gasto, registra la
 * factura y borra el temporal. No es fatal si falla (el gasto ya existe).
 */
export async function adjuntarComprobanteEscaneadoAction(input: {
  gastoIds: string[];
  tmpPath: string;
}): Promise<ActionResult<{ adjuntados: number }>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  const { gastoIds, tmpPath } = input;
  if (!Array.isArray(gastoIds) || gastoIds.length === 0) {
    return { ok: false, error: "Sin gastos a los que adjuntar" };
  }
  if (typeof tmpPath !== "string" || !tmpPath.startsWith(`${user.id}/scan-tmp/`)) {
    return { ok: false, error: "Ruta de comprobante inválida" };
  }

  const sb = await createSupabaseServerClient();

  // Verificar propiedad de los gastos (RLS también protege, damos error claro)
  const { data: gastosData } = await sb
    .from("gastos")
    .select("id, usuario_id")
    .in("id", gastoIds);
  const gastos = (gastosData ?? []) as { id: string; usuario_id: string }[];
  const propios = gastos.filter(
    (g) => user.rol === "admin" || g.usuario_id === user.id
  );
  if (propios.length === 0) {
    return { ok: false, error: "Gastos no encontrados" };
  }

  const ext = tmpPath.split(".").pop() ?? "jpg";
  const mime = ext === "pdf" ? "application/pdf" : "image/jpeg";
  let adjuntados = 0;

  for (const g of propios) {
    const destPath = `${user.id}/${g.id}/comprobante-${Date.now()}.${ext}`;
    const { error: copyErr } = await sb.storage
      .from("facturas")
      .copy(tmpPath, destPath);
    if (copyErr) continue;
    await sb.from("facturas").insert({
      gasto_id: g.id,
      url_storage: destPath,
      nombre_archivo: `comprobante.${ext}`,
      mime_type: mime,
      subida_por: user.id,
    });
    adjuntados += 1;
  }

  // Borrar el temporal (best-effort)
  await sb.storage.from("facturas").remove([tmpPath]).catch(() => {});

  revalidatePath("/gastos");
  return { ok: true, data: { adjuntados } };
}

export async function eliminarGastosBulkAction(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede eliminar gastos" };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "Selecciona al menos un gasto" };
  }
  if (ids.length > 200) {
    return { ok: false, error: "Demasiados gastos (máx 200 por operación)" };
  }
  try {
    const result = await repo.gastosBulk.deleteMany(ids);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar masivamente",
    };
  }
}

export async function recategorizarGastosBulkAction(
  ids: string[],
  nuevaCategoriaId: string
): Promise<ActionResult<{ count: number }>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.rol !== "admin") {
    return { ok: false, error: "Solo el admin puede recategorizar masivamente" };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "Selecciona al menos un gasto" };
  }
  if (!nuevaCategoriaId) {
    return { ok: false, error: "Selecciona la nueva categoría" };
  }
  try {
    const result = await repo.gastosBulk.recategorizarMany(ids, nuevaCategoriaId);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al recategorizar",
    };
  }
}

export async function actualizarGastoAction(
  id: string,
  input: Omit<NuevoGastoInput, "usuario_id">
): Promise<ActionResult<true>> {
  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  // Validación con schema específico de edición (sin usuario_id)
  const parsed = editGastoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Verificar que existe + permisos (RLS lo hace pero damos error claro)
  const existing = await repo.gastos.byId(id);
  if (!existing) {
    return { ok: false, error: "Gasto no encontrado" };
  }
  if (user.rol !== "admin" && existing.usuario_id !== user.id) {
    return {
      ok: false,
      error: "Solo puedes editar tus propios gastos",
    };
  }

  try {
    await repo.gastos.update(id, parsed.data as Partial<NuevoGastoInput>);
    revalidatePath("/gastos");
    revalidatePath(`/gastos/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/reportes");
    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}

/**
 * Registra varios gastos a la vez compartiendo header (fecha, hora, método,
 * lugar, número de factura). Cada fila genera un gasto independiente con su
 * propio código G-XXXX, categoría, descripción y precios.
 *
 * IMPORTANTE: inserts secuenciales. El trigger generate_gasto_codigo lee
 * max(codigo)+1 sin LOCK → paralelizar causa unique_violation (23505) bajo
 * carga concurrente. Con N≤20 el costo (~2s) es aceptable.
 *
 * Política de errores: todo o nada. Si una fila falla, eliminamos las ya
 * creadas (rollback best-effort) y retornamos el error.
 *
 * La foto compartida (si se adjuntó) se sube a cada gasto del lote tras la
 * creación exitosa. Si una subida falla, NO hace rollback (foto no-crítica).
 *
 * Push: si Σ total_usd ≥ $100 y el usuario no es admin, se envía UNA sola
 * push agregada al admin.
 */
export async function crearLoteGastosAction(
  input: LoteGastosInput,
  fotoFormData?: FormData
): Promise<
  ActionResult<{
    creados: { id: string; codigo: string }[];
    total_usd: number;
  }>
> {
  const parsed = loteGastosSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await repo.users.current();
  if (!user) return { ok: false, error: "No autenticado" };

  const { header, rows } = parsed.data;

  // RLS: registrar gastos a nombre de otra persona requiere admin.
  if (header.usuario_id !== user.id && user.rol !== "admin") {
    return {
      ok: false,
      error: "Solo el admin puede registrar gastos a nombre de otros",
    };
  }

  const creados: { id: string; codigo: string; total_usd: number }[] = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const gastoInput: NuevoGastoInput = {
        fecha: header.fecha,
        hora: header.hora,
        usuario_id: header.usuario_id,
        metodo_pago: header.metodo_pago,
        lugar_compra: header.lugar_compra ?? null,
        numero_factura: header.numero_factura ?? null,
        categoria_id: row.categoria_id,
        descripcion: row.descripcion,
        cantidad: row.cantidad,
        unidad: row.unidad,
        items: row.items,
        precio_unitario_usd: row.precio_unitario_usd,
        observaciones: row.observaciones ?? null,
        va_a_inventario: row.va_a_inventario ?? false,
        mobiliario_id: row.mobiliario_id ?? null,
      };

      try {
        const gasto = await repo.gastos.create(gastoInput, user.id);
        creados.push({
          id: gasto.id,
          codigo: gasto.codigo,
          total_usd: gasto.total_usd,
        });
      } catch (rowErr) {
        // Rollback best-effort de los creados anteriores
        for (const c of creados.reverse()) {
          await repo.gastos.delete(c.id).catch(() => {
            /* ignoramos errores del rollback, ya reportamos el original */
          });
        }
        return {
          ok: false,
          error: `Lote cancelado en fila ${i + 1}: ${
            rowErr instanceof Error ? rowErr.message : "Error desconocido"
          }`,
        };
      }
    }

    const totalUsd = creados.reduce((s, c) => s + Number(c.total_usd), 0);

    // Subir foto compartida a cada gasto (no-crítico: warning si falla)
    if (fotoFormData) {
      const file = fotoFormData.get("file");
      if (file instanceof File && file.size > 0) {
        for (const c of creados) {
          try {
            await repo.facturas.upload(c.id, file, file.name, user.id);
          } catch {
            /* Foto fallida no aborta el lote */
          }
        }
      }
    }

    // Push agregada al admin si supera umbral y el usuario no es admin
    if (totalUsd >= 100 && user.rol !== "admin") {
      sendPushToAdmins({
        title: `💸 Lote de gastos · ${formatUSD(totalUsd)}`,
        body: `${user.nombre_completo} registró ${creados.length} gastos${
          header.lugar_compra ? ` en ${header.lugar_compra}` : ""
        }`,
        url: `/gastos?desde=${header.fecha}&hasta=${header.fecha}`,
        tag: `lote-${user.id}-${Date.now()}`,
      }).catch(() => {});
    }

    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    revalidatePath("/reportes");

    return {
      ok: true,
      data: {
        creados: creados.map((c) => ({ id: c.id, codigo: c.codigo })),
        total_usd: totalUsd,
      },
    };
  } catch (e) {
    // Catch defensivo por si algo escapa del loop
    for (const c of creados.reverse()) {
      await repo.gastos.delete(c.id).catch(() => {});
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear lote de gastos",
    };
  }
}
