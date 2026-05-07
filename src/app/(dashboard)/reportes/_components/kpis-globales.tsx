"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Receipt,
  CalendarDays,
  Users as UsersIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Gasto } from "@/types/domain";
import { cn, formatBs, formatUSD } from "@/lib/utils";

export function KpisGlobales({
  gastos,
  tasa,
}: {
  gastos: Gasto[];
  tasa: number;
}) {
  const totalUsd = gastos.reduce((s, g) => s + g.total_usd, 0);
  const totalBs = totalUsd * tasa;
  const compras = gastos.length;
  const dias = new Set(gastos.map((g) => g.fecha)).size || 1;
  const promedioCompra = totalUsd / compras;
  const promedioDiario = totalUsd / dias;
  const personasActivas = new Set(gastos.map((g) => g.usuario_id)).size;

  const items = [
    {
      label: "Total acumulado",
      value: formatUSD(totalUsd),
      sub: formatBs(totalBs, { compact: true }),
      icon: TrendingUp,
      tone: "primary" as const,
    },
    {
      label: "Compras totales",
      value: compras.toString(),
      sub: `${dias} ${dias === 1 ? "día" : "días"} con actividad`,
      icon: Receipt,
      tone: "accent" as const,
    },
    {
      label: "Promedio diario",
      value: formatUSD(promedioDiario),
      sub: `${formatUSD(promedioCompra)} por compra`,
      icon: CalendarDays,
      tone: "info" as const,
    },
    {
      label: "Personas activas",
      value: personasActivas.toString(),
      sub: `de 8 del equipo`,
      icon: UsersIcon,
      tone: "success" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
        >
          <Card className="p-5">
            <CardContent className="p-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  {it.label}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                    it.tone === "primary" && "bg-primary/10 text-primary",
                    it.tone === "accent" && "bg-accent/15 text-accent",
                    it.tone === "info" && "bg-info/10 text-info",
                    it.tone === "success" && "bg-success/10 text-success"
                  )}
                >
                  <it.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="font-mono text-2xl md:text-3xl font-semibold tabular-nums">
                  {it.value}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {it.sub}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
