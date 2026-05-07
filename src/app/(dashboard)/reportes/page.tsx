import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <ComingSoon
      title="Reportes y análisis"
      description="Análisis profundo: promedios diario/semanal/mensual/anual, comparativas vs mes anterior, heatmap de gastos, exportación a PDF con branding."
      phase="Fase 3"
      features={[
        "Promedios automáticos por categoría y período",
        "Comparativas mes vs mes anterior con tendencia",
        "Heatmap de gastos por día del mes",
        "Stacked bar chart por categoría a lo largo del tiempo",
        "Reporte por persona: cuánto y en qué gastó",
        "Exportar a PDF con branding Brújula Markets",
      ]}
    />
  );
}
