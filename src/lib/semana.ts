/**
 * Helpers de semana (lunes a domingo) para nómina.
 * Trabajan con strings YYYY-MM-DD en hora local para evitar drift de timezone.
 */

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export interface Semana {
  inicio: string; // lunes YYYY-MM-DD
  fin: string; // domingo YYYY-MM-DD
}

/** Semana (lunes-domingo) que contiene la fecha dada (default: hoy) */
export function semanaDe(date: Date): Semana {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - dow);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { inicio: iso(lunes), fin: iso(domingo) };
}

/** Desplaza una semana N posiciones (±) */
export function desplazarSemana(s: Semana, delta: number): Semana {
  const lunes = parse(s.inicio);
  lunes.setDate(lunes.getDate() + delta * 7);
  return semanaDe(lunes);
}

/** Etiqueta legible "5–11 may" o "28 abr–4 may" */
export function etiquetaSemana(s: Semana): string {
  const ini = parse(s.inicio);
  const fin = parse(s.fin);
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const mIni = meses[ini.getMonth()];
  const mFin = meses[fin.getMonth()];
  if (ini.getMonth() === fin.getMonth()) {
    return `${ini.getDate()}–${fin.getDate()} ${mFin}`;
  }
  return `${ini.getDate()} ${mIni}–${fin.getDate()} ${mFin}`;
}
