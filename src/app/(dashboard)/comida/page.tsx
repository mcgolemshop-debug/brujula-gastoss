import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Comida" };

export default function ComidaPage() {
  return (
    <ComingSoon
      title="Detalle de comida"
      description="Vista especializada para alimentación del equipo: cantidades exactas, productos más comprados, marcas favoritas, totales por mes."
      phase="Fase 2"
      features={[
        "Cantidades exactas (1.5 kg solomo, 2 docenas limones)",
        "Filtros por marca, tipo y período",
        "Resumen mensual: totales por unidad (kg, litros)",
        "Productos más comprados",
        "Comprado por persona y para qué evento",
        "Visualizaciones de tendencias en consumo",
      ]}
    />
  );
}
