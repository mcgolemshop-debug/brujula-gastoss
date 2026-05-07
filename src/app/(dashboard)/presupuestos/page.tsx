import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Presupuestos" };

export default function PresupuestosPage() {
  return (
    <ComingSoon
      title="Presupuestos"
      description="Define presupuesto mensual por categoría. Alertas automáticas al superar el 80% y 100%. Solo accesible para Admin."
      phase="Fase 3"
      features={[
        "Presupuesto mensual por categoría",
        "Barra de progreso visual: usado / disponible",
        "Alertas al superar 80% (warning) y 100% (crítico)",
        "Notificaciones in-app cuando un presupuesto se rompe",
        "Histórico mes a mes",
        "Solo Admin puede definir y editar",
      ]}
    />
  );
}
