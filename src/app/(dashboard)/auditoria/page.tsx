import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Auditoría" };

export default function AuditoriaPage() {
  return (
    <ComingSoon
      title="Auditoría"
      description="Log de todos los cambios críticos: quién, qué, cuándo. Incluye creación, edición y eliminación de gastos, mobiliario, presupuestos y configuración."
      phase="Fase 3"
      features={[
        "Tabla de cambios con búsqueda y filtros",
        "Acciones: crear · editar · eliminar",
        "JSON diff antes / después en cada cambio",
        "Filtros por usuario, tabla, acción y fecha",
        "Solo accesible para Admin",
        "Exportable a CSV para auditoría externa",
      ]}
    />
  );
}
