import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Gastos" };

export default function GastosPage() {
  return (
    <ComingSoon
      title="Gastos"
      description="Lista profesional con búsqueda en tiempo real, filtros combinables y exportación. Vista de tabla en desktop y tarjetas en móvil."
      phase="Fase 2"
      features={[
        "Tabla con búsqueda, ordenamiento y paginación",
        "Filtros: categoría, persona, método de pago, rango de fechas",
        "Exportar a Excel, CSV y PDF con branding Brújula",
        "Click en fila → detalle completo con foto de factura",
        "Vista de tarjetas optimizada para móvil",
        "Conversión $/Bs en cada fila con tasa del momento",
      ]}
    />
  );
}
