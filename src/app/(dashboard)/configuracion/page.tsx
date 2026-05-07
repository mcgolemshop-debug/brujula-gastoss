import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionPage() {
  return (
    <ComingSoon
      title="Configuración"
      description="Tasa de cambio Bs/USD, categorías personalizadas, preferencias de usuario y tema. La tasa actual es 36.5 Bs / 1 USD según el último Excel."
      phase="Fase 3"
      features={[
        "Tasa de cambio: input grande con histórico de cambios",
        "Gestión de categorías (admin): agregar/editar/desactivar",
        "Preferencias de usuario: tema, idioma, notificaciones",
        "Información de la app: versión, créditos",
        "Backup y restauración de datos",
        "Configuración de moneda primaria del display",
      ]}
    />
  );
}
