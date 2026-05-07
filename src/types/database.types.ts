/**
 * Tipos de la base de datos de Supabase.
 * REGENERAR con: `pnpm db:types` después de cambiar migraciones.
 *
 * Por ahora un placeholder — se reemplaza cuando se inicia Supabase localmente.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
