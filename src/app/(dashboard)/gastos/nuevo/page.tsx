import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { MultiStepForm } from "./_components/multi-step-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Nuevo gasto" };

export default async function NuevoGastoPage() {
  const [categorias, currentUser, tasaActual] = await Promise.all([
    repo.categorias.list(),
    repo.users.current(),
    repo.tasaCambio.actual(),
  ]);

  if (!currentUser) {
    return (
      <div className="container max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No autenticado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <PageHeader
        eyebrow="Nuevo registro"
        title="Registrar gasto"
        description="Cinco pasos rápidos. La tasa actual del momento queda guardada con el gasto."
      />
      <MultiStepForm
        categorias={categorias}
        currentUser={currentUser}
        tasaActual={tasaActual.valor_bs_por_usd}
      />
    </div>
  );
}
