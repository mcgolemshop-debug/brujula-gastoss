import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { TasaSection } from "./_components/tasa-section";
import { CategoriasSection } from "./_components/categorias-section";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const [me, tasa, historico, categorias] = await Promise.all([
    repo.users.current(),
    repo.tasaCambio.actual(),
    repo.tasaCambio.historico(),
    repo.categorias.list(true), // includeInactive: ver todas para gestión admin
  ]);

  if (!me) redirect("/login");
  const isAdmin = me.rol === "admin";

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Tasa de cambio, categorías y preferencias de la app."
      />
      <TasaSection
        actual={tasa}
        historico={historico.slice(0, 10)}
        isAdmin={isAdmin}
      />
      <CategoriasSection categorias={categorias} isAdmin={isAdmin} />
    </div>
  );
}
