"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { formatBs, formatUSD } from "@/lib/utils";
import type { StatsPersonales } from "@/types/domain";

export function StatsMes({
  stats,
  tasa,
}: {
  stats: StatsPersonales;
  tasa: number;
}) {
  const mesLabel = format(new Date(), "MMMM yyyy", { locale: es });
  const HeartIcon = Icons.Heart;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.TrendingUp className="h-5 w-5 text-accent" />
          Tus compras
        </CardTitle>
        <CardDescription>
          Resumen de {mesLabel} · histórico personal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mes actual */}
        <div className="space-y-2 pb-5 border-b border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Mes actual
          </p>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-0.5"
          >
            <div className="font-mono text-3xl font-semibold tabular-nums">
              {formatUSD(stats.total_mes_usd)}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {formatBs(stats.total_mes_usd * tasa, { compact: true })} ·{" "}
              {stats.compras_mes}{" "}
              {stats.compras_mes === 1 ? "compra" : "compras"}
            </div>
          </motion.div>
          {stats.compras_mes > 0 && (
            <div className="text-[11px] text-muted-foreground font-mono">
              Promedio: {formatUSD(stats.promedio_compra_usd)} por compra
            </div>
          )}
        </div>

        {/* Categoría favorita */}
        {stats.categoria_favorita && (
          <div className="space-y-2 pb-5 border-b border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1.5">
              <HeartIcon className="h-3 w-3" />
              Tu categoría más comprada
            </p>
            <div className="flex items-center justify-between gap-3">
              <CategoryBadge
                nombre={stats.categoria_favorita.nombre}
                icono={stats.categoria_favorita.icono}
                color={stats.categoria_favorita.color}
                variant="soft"
              />
              <div className="text-right">
                <div className="font-mono text-sm font-semibold tabular-nums">
                  {stats.categoria_favorita.compras}×
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {formatUSD(stats.categoria_favorita.total_usd, {
                    compact: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Histórico personal
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-xl font-semibold tabular-nums">
                {formatUSD(stats.total_acumulado_usd, { compact: true })}
              </div>
              <div className="text-[10px] text-muted-foreground">
                acumulado total
              </div>
            </div>
            <div>
              <div className="font-mono text-xl font-semibold tabular-nums">
                {stats.compras_totales}
              </div>
              <div className="text-[10px] text-muted-foreground">
                compras todas
              </div>
            </div>
          </div>
          {stats.ultima_compra_fecha && (
            <p className="text-[10px] text-muted-foreground font-mono pt-2">
              Última compra:{" "}
              {format(parseISO(stats.ultima_compra_fecha), "d 'de' MMMM yyyy", {
                locale: es,
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
