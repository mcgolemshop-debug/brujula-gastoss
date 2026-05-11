import type { Metadata } from "next";
import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
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

      <Link
        href="/gastos/nuevo-lote"
        className="group flex items-center gap-3 p-3 mb-6 rounded-lg border border-dashed border-border hover:border-accent/40 hover:bg-secondary/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            Registrar varios a la vez
          </div>
          <div className="text-xs text-muted-foreground">
            Ideal para un recibo del súper con varios items.
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>

      <MultiStepForm
        categorias={categorias}
        currentUser={currentUser}
        tasaActual={tasaActual.valor_bs_por_usd}
      />
    </div>
  );
}
