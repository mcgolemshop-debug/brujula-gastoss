import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <ComingSoon
      title="Tu perfil"
      description="Información personal, foto de avatar, preferencias y resumen de tus compras del mes."
      phase="Fase 3"
      features={[
        "Foto de avatar (subir desde dispositivo)",
        "Datos personales: nombre, email, teléfono",
        "Cambio de contraseña",
        "Resumen de tus compras del mes",
        "Tu categoría más comprada",
        "Sesiones activas y dispositivos",
      ]}
    />
  );
}
