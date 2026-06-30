/**
 * Helpers de período para la página de Reportes.
 * Define los 3 modos de visualización/exportación y sus rangos de fecha.
 */

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export type ModoReporte = "mes" | "anio" | "todo";

/** Fecha mínima para "todo el histórico" (antes de que existiera la oficina) */
export const FECHA_MIN = "2000-01-01";

export interface RangoFechas {
  desde: string;
  hasta: string;
}

function lastDayOfMonth(year: number, month1: number): number {
  // month1: 1..12. Day 0 del mes siguiente = último día de este mes.
  return new Date(year, month1, 0).getDate();
}

/** Rango de un mes a partir de "YYYY-MM" */
export function rangoMes(yyyymm: string): RangoFechas {
  const [y, m] = yyyymm.split("-").map(Number);
  const last = lastDayOfMonth(y, m);
  return {
    desde: `${yyyymm}-01`,
    hasta: `${yyyymm}-${String(last).padStart(2, "0")}`,
  };
}

/** Rango de un año completo (enero a diciembre) */
export function rangoAnio(year: number): RangoFechas {
  return { desde: `${year}-01-01`, hasta: `${year}-12-31` };
}

/** Rango histórico completo, hasta la fecha dada (YYYY-MM-DD) */
export function rangoTodo(hoy: string): RangoFechas {
  return { desde: FECHA_MIN, hasta: hoy };
}

/** Etiqueta legible del período (para header y PDF) */
export function etiquetaPeriodo(modo: ModoReporte, desde: string): string {
  if (modo === "mes") {
    const raw = format(parseISO(desde), "MMMM yyyy", { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1); // "Mayo 2026"
  }
  if (modo === "anio") {
    return `Año ${desde.slice(0, 4)}`;
  }
  return "Todo el histórico";
}

/** Slug para nombres de archivo exportados */
export function slugPeriodo(modo: ModoReporte, desde: string): string {
  if (modo === "mes") return desde.slice(0, 7); // 2026-05
  if (modo === "anio") return desde.slice(0, 4); // 2026
  return "historico";
}
