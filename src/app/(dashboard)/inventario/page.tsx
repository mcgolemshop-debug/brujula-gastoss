import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Inventario" };

export default function InventarioPage() {
  return (
    <ComingSoon
      title="Inventario"
      description="Mobiliario, dispositivos y equipos de la oficina. Estado visual de cada ítem, asignación, ubicación y histórico de mantenimiento."
      phase="Fase 2"
      features={[
        "Vista grid de tarjetas con foto de cada ítem",
        "Estados: Nuevo · Buen estado · Regular · Necesita reparación · Baja",
        "Filtros por tipo, estado, ubicación y asignado a",
        "Stats: total ítems, valor total $, # necesitan reparación",
        "Histórico de mantenimiento por ítem",
        "Cambio rápido de estado con un click",
      ]}
    />
  );
}
