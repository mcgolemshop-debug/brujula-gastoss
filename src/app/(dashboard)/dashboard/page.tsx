import type { Metadata } from "next";
import { DashboardKpis } from "./_components/kpis";
import { CategoryDistribution } from "./_components/category-distribution";
import { RecentExpenses } from "./_components/recent-expenses";
import { TopCategories } from "./_components/top-categories";
import { ExchangeRateBanner } from "./_components/exchange-rate-banner";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Vista ejecutiva
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            Buenos días, Orlando
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de la actividad de la oficina · Fase 1 con datos de muestra
          </p>
        </div>
        <ExchangeRateBanner rate={36.5} />
      </div>

      {/* KPIs */}
      <DashboardKpis />

      {/* Grid 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CategoryDistribution />
          <RecentExpenses />
        </div>
        <div className="space-y-6">
          <TopCategories />
        </div>
      </div>
    </div>
  );
}
