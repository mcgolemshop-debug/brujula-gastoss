import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { LoteForm } from "./_components/lote-form";

export const metadata: Metadata = { title: "Registrar lote de gastos" };

export default async function NuevoLoteGastoPage() {
  const [categorias, currentUser, tasaActual, usuarios] = await Promise.all([
    repo.categorias.list(),
    repo.users.current(),
    repo.tasaCambio.actual(),
    repo.users.list(),
  ]);

  if (!currentUser) {
    return (
      <div className="container max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No autenticado</p>
      </div>
    );
  }

  const isAdmin = currentUser.rol === "admin";

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <PageHeader
        eyebrow="Nuevo registro · lote"
        title="Registrar varios gastos"
        description="Comparten fecha, lugar y método de pago. Cada fila tiene su propia categoría y precio. Ideal para un recibo de supermercado con varios items."
      />
      <LoteForm
        categorias={categorias}
        currentUser={currentUser}
        usuarios={isAdmin ? usuarios : [currentUser]}
        isAdmin={isAdmin}
        tasaActual={tasaActual.valor_bs_por_usd}
      />
    </div>
  );
}
