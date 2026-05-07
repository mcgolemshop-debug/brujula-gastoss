import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Nuevo gasto" };

export default function NuevoGastoPage() {
  return (
    <ComingSoon
      title="Nuevo gasto"
      description="Multi-step form que reduce la fricción al registrar cada compra. Captura de cámara directa en móvil, conversión en tiempo real, auto-guardado del borrador."
      phase="Fase 2"
      features={[
        "5 pasos: Categoría → Detalles → Pago → Foto → Confirmar",
        "Conversión $ → Bs en tiempo real mientras escribes",
        "Cámara directa en móvil (capture='environment')",
        "Auto-guardado del borrador en localStorage",
        "Sugerencias inteligentes según categoría",
        "Toggle: '¿Es un dispositivo o mueble?' → mobiliario",
      ]}
    />
  );
}
