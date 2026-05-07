import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { PresupuestosContent } from "./_components/presupuestos-content";

export const metadata: Metadata = { title: "Presupuestos" };

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}

export default async function PresupuestosPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const today = new Date();
  const mes = sp.mes ? parseInt(sp.mes, 10) : today.getMonth() + 1;
  const anio = sp.anio ? parseInt(sp.anio, 10) : today.getFullYear();

  const [currentUser, categorias, presupuestos, tasa] = await Promise.all([
    repo.users.current(),
    repo.categorias.list(),
    repo.presupuestos.listConGasto(mes, anio),
    repo.tasaCambio.actual(),
  ]);

  if (!currentUser) redirect("/login");
  const isAdmin = currentUser.rol === "admin";

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Control mensual"
        title="Presupuestos"
        description={
          isAdmin
            ? "Define un tope mensual por categoría. Recibirás alertas cuando se consuma el 80% y al rebasarlo."
            : "Vista de los presupuestos definidos por el admin."
        }
      />
      <PresupuestosContent
        categorias={categorias}
        presupuestos={presupuestos}
        tasa={tasa.valor_bs_por_usd}
        mes={mes}
        anio={anio}
        isAdmin={isAdmin}
      />
    </div>
  );
}
