"use client";

import * as React from "react";
import { Receipt, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import type { Categoria, Gasto, User } from "@/types/domain";
import type { ModoReporte, RangoFechas } from "@/lib/periodo";
import { KpisGlobales } from "./kpis-globales";
import { SerieMensual } from "./serie-mensual";
import { HeatmapMes } from "./heatmap-mes";
import { TopCompradores } from "./top-compradores";
import { DistribucionPagos } from "./distribucion-pagos";
import { ExportButton } from "./export-button";
import { PeriodoSelector } from "./periodo-selector";

interface Props {
  gastos: Gasto[];
  tasa: number;
  usuarios: User[];
  categorias: Categoria[];
  rango: RangoFechas;
  modo: ModoReporte;
  mesActual: string;
  anioActual: number;
  periodoLabel: string;
  periodoSlug: string;
}

export function ReportesContent({
  gastos,
  tasa,
  usuarios,
  categorias,
  rango,
  modo,
  mesActual,
  anioActual,
  periodoLabel,
  periodoSlug,
}: Props) {
  return (
    <>
      {/* Toolbar: selector de período + export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <PeriodoSelector modo={modo} mes={mesActual} anio={anioActual} />
        {gastos.length > 0 && (
          <ExportButton
            gastos={gastos}
            rango={rango}
            tasa={tasa}
            periodoLabel={periodoLabel}
            periodoSlug={periodoSlug}
          />
        )}
      </div>

      {gastos.length === 0 ? (
        <Card className="py-4">
          <EmptyState
            icon={TrendingUp}
            title="Sin datos para este período"
            description={`No hay gastos en ${periodoLabel.toLowerCase()}. Cambia el período arriba o registra un gasto.`}
            action={{ label: "Nuevo gasto", href: "/gastos/nuevo" }}
          />
        </Card>
      ) : (
        <>
          {/* KPIs globales */}
          <KpisGlobales gastos={gastos} tasa={tasa} />

          {/* Serie mensual stacked */}
          <SerieMensual gastos={gastos} categorias={categorias} />

          {/* Heatmap + Distribución pagos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HeatmapMes gastos={gastos} />
            </div>
            <div>
              <DistribucionPagos gastos={gastos} />
            </div>
          </div>

          {/* Top compradores */}
          <TopCompradores gastos={gastos} usuarios={usuarios} tasa={tasa} />
        </>
      )}
    </>
  );
}

// Re-export icon for empty state context
export { Receipt as ReceiptIcon };
