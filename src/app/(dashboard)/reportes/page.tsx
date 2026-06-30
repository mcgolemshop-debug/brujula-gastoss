import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { ReportesContent } from "./_components/reportes-content";
import {
  rangoMes,
  rangoAnio,
  rangoTodo,
  etiquetaPeriodo,
  slugPeriodo,
  type ModoReporte,
  type RangoFechas,
} from "@/lib/periodo";

export const metadata: Metadata = { title: "Reportes" };

interface PageProps {
  searchParams: Promise<{
    modo?: string;
    mes?: string;
    anio?: string;
  }>;
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const today = new Date();

  const modo: ModoReporte =
    sp.modo === "mes" || sp.modo === "todo" ? sp.modo : "anio";

  // Selección actual (para el selector)
  const mesActual =
    sp.mes ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const anioActual = sp.anio ? parseInt(sp.anio, 10) : today.getFullYear();

  let rango: RangoFechas;
  if (modo === "mes") {
    rango = rangoMes(mesActual);
  } else if (modo === "todo") {
    rango = rangoTodo(today.toISOString().slice(0, 10));
  } else {
    rango = rangoAnio(anioActual);
  }

  const periodoLabel = etiquetaPeriodo(modo, rango.desde);
  const periodoSlug = slugPeriodo(modo, rango.desde);

  const [gastos, tasa, usuarios, categorias] = await Promise.all([
    repo.gastos.list({
      fecha_desde: rango.desde,
      fecha_hasta: rango.hasta,
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
        description={`${periodoLabel} · ${gastos.total} ${gastos.total === 1 ? "gasto" : "gastos"} · datos en vivo`}
      />
      <ReportesContent
        gastos={gastos.items}
        tasa={tasa.valor_bs_por_usd}
        usuarios={usuarios}
        categorias={categorias}
        rango={rango}
        modo={modo}
        mesActual={mesActual}
        anioActual={anioActual}
        periodoLabel={periodoLabel}
        periodoSlug={periodoSlug}
      />
    </div>
  );
}
