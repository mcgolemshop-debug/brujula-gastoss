/**
 * Repository factory · Brújula Markets
 *
 * Auto-selecciona la implementación según las env vars disponibles + flag.
 * Componentes y server actions hacen `import { repo } from "@/lib/repositories"`.
 *
 * Flag NEXT_PUBLIC_DATA_SOURCE:
 *   - "mock" → siempre MockRepository (default si no está configurado Supabase)
 *   - "supabase" → SupabaseRepository (requiere URL + ANON_KEY)
 */

import { mockRepository } from "./mock";
import { supabaseRepository } from "./supabase";
import type { Repository } from "./types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function shouldUseSupabase(): boolean {
  if (!isSupabaseConfigured()) return false;
  // Si el flag está explícito a "mock", forzar mock incluso con Supabase configurado
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "mock") return false;
  return true;
}

export function getRepository(): Repository {
  return shouldUseSupabase() ? supabaseRepository : mockRepository;
}

/** Helper sugar — `import { repo } from "@/lib/repositories"` */
export const repo = new Proxy({} as Repository, {
  get(_target, prop: keyof Repository) {
    return getRepository()[prop];
  },
});

export * from "./types";
