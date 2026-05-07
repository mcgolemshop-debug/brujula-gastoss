"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format, parseISO, getDaysInMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Gasto } from "@/types/domain";
import { cn, formatUSD } from "@/lib/utils";

export function HeatmapMes({ gastos }: { gastos: Gasto[] }) {
  // Agrupar por día del mes actual (más reciente con datos)
  const fechaMasReciente = gastos[gastos.length - 1]?.fecha;
  const referencia = fechaMasReciente
    ? parseISO(fechaMasReciente)
    : new Date();
  const ymStart = format(referencia, "yyyy-MM");
  const totalDias = getDaysInMonth(referencia);

  const porDia = new Map<number, { total: number; count: number }>();
  for (const g of gastos) {
    if (g.fecha.startsWith(ymStart)) {
      const day = parseInt(g.fecha.slice(8, 10), 10);
      const existing = porDia.get(day) ?? { total: 0, count: 0 };
      existing.total += g.total_usd;
      existing.count += 1;
      porDia.set(day, existing);
    }
  }
  const maxTotal = Math.max(
    ...Array.from(porDia.values()).map((v) => v.total),
    1
  );

  const dias = Array.from({ length: totalDias }, (_, i) => {
    const day = i + 1;
    const data = porDia.get(day);
    return { day, total: data?.total ?? 0, count: data?.count ?? 0 };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Heatmap del mes</CardTitle>
          <CardDescription>
            {format(referencia, "MMMM yyyy", { locale: es })} · gastos por día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 max-w-md">
            {/* Encabezados días de semana */}
            {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
              <div
                key={i}
                className="text-[10px] uppercase text-center text-muted-foreground font-medium pb-1"
              >
                {d}
              </div>
            ))}
            {/* Padding inicial: día de la semana del 1ro */}
            {(() => {
              const first = parseISO(`${ymStart}-01`);
              const weekday = (first.getDay() + 6) % 7; // L=0
              return Array.from({ length: weekday }, (_, i) => (
                <div key={`pad-${i}`} />
              ));
            })()}
            {dias.map((d, i) => {
              const intensity = d.total > 0 ? d.total / maxTotal : 0;
              const bgClass =
                intensity === 0
                  ? "bg-muted/40 text-muted-foreground"
                  : intensity < 0.25
                  ? "bg-accent/20 text-foreground"
                  : intensity < 0.5
                  ? "bg-accent/40 text-foreground"
                  : intensity < 0.75
                  ? "bg-accent/60 text-foreground"
                  : "bg-accent text-accent-foreground font-semibold";
              return (
                <Tooltip key={d.day}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.25 + i * 0.005,
                      }}
                      className={cn(
                        "aspect-square rounded-md text-[10px] font-mono flex items-center justify-center transition-colors hover:ring-2 hover:ring-accent",
                        bgClass
                      )}
                    >
                      {d.day}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-xs">
                      <div className="font-semibold">
                        {format(parseISO(`${ymStart}-${String(d.day).padStart(2, "0")}`), "EEEE d", { locale: es })}
                      </div>
                      <div className="text-muted-foreground font-mono">
                        {d.count > 0
                          ? `${formatUSD(d.total)} · ${d.count} compras`
                          : "Sin actividad"}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          {/* Leyenda */}
          <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
            <span>Menos</span>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-muted/40" />
              <div className="w-3 h-3 rounded-sm bg-accent/20" />
              <div className="w-3 h-3 rounded-sm bg-accent/40" />
              <div className="w-3 h-3 rounded-sm bg-accent/60" />
              <div className="w-3 h-3 rounded-sm bg-accent" />
            </div>
            <span>Más</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
