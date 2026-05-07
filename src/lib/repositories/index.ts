/**
 * Repository factory · Brújula Markets
 *
 * Auto-selecciona la implementación según las env vars disponibles.
 * Componentes y server actions hacen `import { repo } from "@/lib/repositories"`.
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

export function getRepository(): Repository {
  return isSupabaseConfigured() ? supabaseRepository : mockRepository;
}

/** Helper sugar — `import { repo } from "@/lib/repositories"` */
export const repo = new Proxy({} as Repository, {
  get(_target, prop: keyof Repository) {
    return getRepository()[prop];
  },
});

export * from "./types";
