import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Equipo" };

export default function EquipoPage() {
  return (
    <ComingSoon
      title="Equipo"
      description="Los 8 miembros del equipo con stats individuales: total comprado, # de compras, categoría favorita. Solo accesible para Admin."
      phase="Fase 3"
      features={[
        "Lista de los 8 miembros con stats individuales",
        "Activar / desactivar usuarios",
        "Cambiar rol (solo Orlando puede)",
        "Reset de contraseñas",
        "Total $/Bs comprado por persona",
        "Categoría favorita y última compra",
      ]}
    />
  );
}
