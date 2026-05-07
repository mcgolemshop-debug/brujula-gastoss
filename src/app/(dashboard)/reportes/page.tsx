import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { ReportesContent } from "./_components/reportes-content";

export const metadata: Metadata = { title: "Reportes" };

interface PageProps {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const today = new Date();
  // Default: últimos 6 meses
  const seisMesesAtras = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const desde =
    sp.desde ?? seisMesesAtras.toISOString().slice(0, 10);
  const hasta = sp.hasta ?? today.toISOString().slice(0, 10);

  const [gastos, tasa, usuarios, categorias] = await Promise.all([
    repo.gastos.list({
      fecha_desde: desde,
      fecha_hasta: hasta,
      page_size: 5000,
      sort: "fecha_asc",
    }),
    repo.tasaCambio.actual(),
    repo.users.list(),
    repo.categorias.list(),
  ]);

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description={`${gastos.total} ${gastos.total === 1 ? "gasto" : "gastos"} desde ${desde} hasta ${hasta} · datos en vivo`}
      />
      <ReportesContent
        gastos={gastos.items}
        tasa={tasa.valor_bs_por_usd}
        usuarios={usuarios}
        categorias={categorias}
        rango={{ desde, hasta }}
      />
    </div>
  );
}
