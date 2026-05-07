import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { ComidaContent } from "./_components/comida-content";

export const metadata: Metadata = { title: "Detalle de comida" };

interface PageProps {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}

export default async function ComidaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const today = new Date();
  const mesAnterior = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const desde = sp.desde ?? mesAnterior.toISOString().slice(0, 10);
  const hasta = sp.hasta ?? today.toISOString().slice(0, 10);

  const [categorias, tasa] = await Promise.all([
    repo.categorias.list(),
    repo.tasaCambio.actual(),
  ]);

  const comida = categorias.find((c) => c.nombre === "Comida");
  if (!comida) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">
          Categoría &quot;Comida&quot; no encontrada.
        </p>
      </div>
    );
  }

  const gastos = await repo.gastos.list({
    categoria_id: comida.id,
    fecha_desde: desde,
    fecha_hasta: hasta,
    sort: "fecha_desc",
    page_size: 1000,
  });

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Categoría especial"
        title="Detalle de comida"
        description={`${gastos.total} ${gastos.total === 1 ? "compra" : "compras"} de alimentación entre ${desde} y ${hasta}`}
      />
      <ComidaContent
        gastos={gastos.items}
        tasa={tasa.valor_bs_por_usd}
        rango={{ desde, hasta }}
      />
    </div>
  );
}
