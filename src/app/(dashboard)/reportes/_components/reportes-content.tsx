"use client";

import * as React from "react";
import { Receipt, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import type { Categoria, Gasto, User } from "@/types/domain";
import { KpisGlobales } from "./kpis-globales";
import { SerieMensual } from "./serie-mensual";
import { HeatmapMes } from "./heatmap-mes";
import { TopCompradores } from "./top-compradores";
import { DistribucionPagos } from "./distribucion-pagos";
import { ExportButton } from "./export-button";

interface Props {
  gastos: Gasto[];
  tasa: number;
  usuarios: User[];
  categorias: Categoria[];
  rango: { desde: string; hasta: string };
}

export function ReportesContent({
  gastos,
  tasa,
  usuarios,
  categorias,
  rango,
}: Props) {
  if (gastos.length === 0) {
    return (
      <Card className="py-4">
        <EmptyState
          icon={TrendingUp}
          title="Sin datos para reportar"
          description={`No hay gastos entre ${rango.desde} y ${rango.hasta}. Ajusta el rango o registra un gasto.`}
          action={{ label: "Nuevo gasto", href: "/gastos/nuevo" }}
        />
      </Card>
    );
  }

  return (
    <>
      {/* Toolbar: export */}
      <div className="flex items-center justify-end">
        <ExportButton gastos={gastos} rango={rango} tasa={tasa} />
      </div>

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
  );
}

// Re-export icon for empty state context
export { Receipt as ReceiptIcon };
