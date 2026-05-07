"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatUSD, formatBs } from "@/lib/utils";
import type { KpiResumen } from "@/types/domain";

interface Props {
  data: KpiResumen;
  tasa: number;
}

export function DashboardKpis({ data, tasa }: Props) {
  const mesLabel = format(new Date(), "MMMM yyyy", { locale: es });

  const kpis = [
    {
      label: "Gasto acumulado",
      value: data.total_acumulado_usd,
      delta: 0,
      icon: Banknote,
      color: "primary" as const,
      isCount: false,
    },
    {
      label: `Mes actual · ${mesLabel}`,
      value: data.mes_actual_usd,
      delta: data.delta_vs_mes_anterior_pct,
      deltaPositive: data.delta_vs_mes_anterior_pct < 0, // gastar menos = positivo
      icon: Calendar,
      color: "accent" as const,
      isCount: false,
    },
    {
      label: "Promedio diario",
      value: data.promedio_diario_usd,
      delta: 0,
      icon: TrendingUp,
      color: "info" as const,
      isCount: false,
    },
    {
      label: "Compras del mes",
      value: data.compras_mes,
      delta: 0,
      icon: Receipt,
      color: "success" as const,
      isCount: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi, i) => (
        <KpiCard
          key={kpi.label}
          {...kpi}
          tasa={tasa}
          delay={i * 0.08}
          deltaPositive={"deltaPositive" in kpi ? kpi.deltaPositive : undefined}
        />
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  delta: number;
  deltaPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "accent" | "info" | "success";
  isCount: boolean;
  tasa: number;
  delay?: number;
}

function KpiCard({
  label,
  value,
  delta,
  deltaPositive,
  icon: Icon,
  color,
  isCount,
  tasa,
  delay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="p-5 hover:shadow-elegant hover:border-accent/40 transition-all relative overflow-hidden group">
        <CardContent className="p-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground font-medium">
              {label}
            </span>
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                color === "primary" && "bg-primary/10 text-primary",
                color === "accent" && "bg-accent/15 text-accent",
                color === "info" && "bg-info/10 text-info",
                color === "success" && "bg-success/10 text-success"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <CountUp
              value={value}
              isCount={isCount}
              className="font-mono text-2xl md:text-3xl font-semibold tracking-tight tabular-nums"
            />
            {!isCount && (
              <span className="block text-[11px] text-muted-foreground font-mono">
                {formatBs(value * tasa, { compact: true })}
              </span>
            )}
          </div>
          {delta !== 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
                  deltaPositive
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {deltaPositive ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {Math.abs(delta).toFixed(1)}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                vs mes anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CountUp({
  value,
  isCount,
  className,
}: {
  value: number;
  isCount: boolean;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) =>
    isCount ? Math.floor(v).toString() : formatUSD(v)
  );

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
