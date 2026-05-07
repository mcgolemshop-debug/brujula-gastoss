"use server";

import { repo } from "@/lib/repositories";

export interface SearchResults {
  gastos: Array<{
    id: string;
    codigo: string;
    descripcion: string;
    fecha: string;
    total_usd: number;
    categoria_nombre?: string;
  }>;
  mobiliario: Array<{
    id: string;
    codigo: string;
    descripcion: string;
    estado: string;
  }>;
  personas: Array<{
    id: string;
    nombre_completo: string;
    email: string;
    rol: string;
  }>;
}

/**
 * Búsqueda global usada por el command palette.
 * Empty results si la query es muy corta.
 */
export async function searchGlobalAction(
  query: string
): Promise<SearchResults> {
  const q = query.trim();
  const empty: SearchResults = { gastos: [], mobiliario: [], personas: [] };
  if (q.length < 2) return empty;

  try {
    const [gastosResult, mobiliario, usuarios] = await Promise.all([
      repo.gastos.list({ search: q, page_size: 8 }),
      repo.mobiliario.list(),
      repo.users.list(),
    ]);

    const lower = q.toLowerCase();

    return {
      gastos: gastosResult.items.slice(0, 6).map((g) => ({
        id: g.id,
        codigo: g.codigo,
        descripcion: g.descripcion,
        fecha: g.fecha,
        total_usd: g.total_usd,
        categoria_nombre: g.categoria?.nombre,
      })),
      mobiliario: mobiliario
        .filter(
          (m) =>
            m.descripcion.toLowerCase().includes(lower) ||
            m.codigo.toLowerCase().includes(lower) ||
            m.marca_modelo?.toLowerCase().includes(lower)
        )
        .slice(0, 6)
        .map((m) => ({
          id: m.id,
          codigo: m.codigo,
          descripcion: m.descripcion,
          estado: m.estado,
        })),
      personas: usuarios
        .filter(
          (u) =>
            u.nombre_completo.toLowerCase().includes(lower) ||
            u.email.toLowerCase().includes(lower)
        )
        .slice(0, 6)
        .map((u) => ({
          id: u.id,
          nombre_completo: u.nombre_completo,
          email: u.email,
          rol: u.rol,
        })),
    };
  } catch {
    return empty;
  }
}
