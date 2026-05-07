import type { Metadata } from "next";
import { repo } from "@/lib/repositories";
import { DashboardKpis } from "./_components/kpis";
import { CategoryDistribution } from "./_components/category-distribution";
import { RecentExpenses } from "./_components/recent-expenses";
import { TopCategories } from "./_components/top-categories";
import { ExchangeRateBanner } from "./_components/exchange-rate-banner";

export const metadata: Metadata = { title: "Dashboard" };

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const [kpis, topCats, recent, tasa, currentUser] = await Promise.all([
    repo.gastos.kpis(),
    repo.gastos.topCategoriasMes(5),
    repo.gastos.list({ page_size: 10, sort: "fecha_desc" }),
    repo.tasaCambio.actual(),
    repo.users.current(),
  ]);

  const nombrePila =
    currentUser?.nombre_completo.split(" ")[0] ?? "Orlando";

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Vista ejecutiva
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            {saludo()}, {nombrePila}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de la actividad de la oficina · datos en vivo
          </p>
        </div>
        <ExchangeRateBanner rate={tasa.valor_bs_por_usd} />
      </div>

      {/* KPIs */}
      <DashboardKpis data={kpis} tasa={tasa.valor_bs_por_usd} />

      {/* Grid 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CategoryDistribution data={topCats} />
          <RecentExpenses
            gastos={recent.items}
            tasa={tasa.valor_bs_por_usd}
          />
        </div>
        <div className="space-y-6">
          <TopCategories data={topCats} />
        </div>
      </div>
    </div>
  );
}
