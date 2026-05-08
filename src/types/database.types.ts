/**
 * Tipos de la base de datos de Supabase.
 * REGENERAR con: `pnpm db:types` después de aplicar migraciones.
 *
 * Por ahora un placeholder: nombres de tablas conocidos pero rows como `any`.
 * Una vez aplicadas las migraciones, `pnpm db:types` regenera con tipos exactos.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface T {
  Row: any;
  Insert: any;
  Update: any;
  Relationships: [];
}

interface V {
  Row: any;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      users: T;
      categorias: T;
      gastos: T;
      mobiliario: T;
      tasa_cambio: T;
      facturas: T;
      presupuestos: T;
      auditoria: T;
      reembolsos: T;
      notificaciones_push_subs: T;
    };
    Views: {
      tasa_actual: V;
      resumen_mensual_usuario: V;
    };
    Functions: { [k: string]: { Args: any; Returns: any } };
    Enums: {
      rol_usuario: "admin" | "empleado";
      categoria_tipo: "variable" | "fijo" | "activo_fijo";
      metodo_pago:
        | "Efectivo $"
        | "Efectivo Bs"
        | "Transferencia"
        | "Pago Móvil"
        | "Zelle"
        | "Tarjeta"
        | "Binance"
        | "Otro";
      estado_mobiliario:
        | "nuevo"
        | "buen_estado"
        | "regular"
        | "necesita_reparacion"
        | "dado_de_baja";
      tipo_mobiliario:
        | "mobiliario"
        | "dispositivo"
        | "equipo"
        | "vehiculo"
        | "otro";
      accion_auditoria: "crear" | "editar" | "eliminar";
    };
    CompositeTypes: { [k: string]: any };
  };
}
