/**
 * Supabase Repository · Brújula Markets
 *
 * Implementación real contra Supabase. Se activa cuando hay env vars
 * NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * STATUS Fase 2: stub. La implementación real se conecta cuando Orlando
 * cree el proyecto Supabase y comparta credenciales. Mientras tanto se
 * usa MockRepository.
 */

import type { Repository } from "./types";

export const supabaseRepository: Repository = {
  users: {
    async list() {
      throw new Error("SupabaseRepository.users.list() — pendiente Fase 2.5");
    },
    async byId() {
      throw new Error("SupabaseRepository.users.byId() — pendiente Fase 2.5");
    },
    async byEmail() {
      throw new Error("SupabaseRepository.users.byEmail() — pendiente Fase 2.5");
    },
    async current() {
      throw new Error("SupabaseRepository.users.current() — pendiente Fase 2.5");
    },
  },
  categorias: {
    async list() {
      throw new Error("supabase.categorias.list — pendiente");
    },
    async byId() {
      throw new Error("supabase.categorias.byId — pendiente");
    },
  },
  gastos: {
    async list() {
      throw new Error("supabase.gastos.list — pendiente");
    },
    async byId() {
      throw new Error("supabase.gastos.byId — pendiente");
    },
    async create() {
      throw new Error("supabase.gastos.create — pendiente");
    },
    async update() {
      throw new Error("supabase.gastos.update — pendiente");
    },
    async delete() {
      throw new Error("supabase.gastos.delete — pendiente");
    },
    async kpis() {
      throw new Error("supabase.gastos.kpis — pendiente");
    },
    async topCategoriasMes() {
      throw new Error("supabase.gastos.topCategoriasMes — pendiente");
    },
  },
  mobiliario: {
    async list() {
      throw new Error("supabase.mobiliario.list — pendiente");
    },
    async byId() {
      throw new Error("supabase.mobiliario.byId — pendiente");
    },
    async create() {
      throw new Error("supabase.mobiliario.create — pendiente");
    },
    async update() {
      throw new Error("supabase.mobiliario.update — pendiente");
    },
    async cambiarEstado() {
      throw new Error("supabase.mobiliario.cambiarEstado — pendiente");
    },
    async delete() {
      throw new Error("supabase.mobiliario.delete — pendiente");
    },
  },
  tasaCambio: {
    async actual() {
      throw new Error("supabase.tasaCambio.actual — pendiente");
    },
    async historico() {
      throw new Error("supabase.tasaCambio.historico — pendiente");
    },
    async actualizar() {
      throw new Error("supabase.tasaCambio.actualizar — pendiente");
    },
  },
  facturas: {
    async upload() {
      throw new Error("supabase.facturas.upload — pendiente");
    },
    async delete() {
      throw new Error("supabase.facturas.delete — pendiente");
    },
  },
};
