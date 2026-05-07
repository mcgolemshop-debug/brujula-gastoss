"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Receipt, Calendar, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatUSD, formatBs } from "@/lib/utils";

const TASA = 36.5;

const KPIS = [
  {
    label: "Gasto acumulado",
    valueUSD: 89.7,
    deltaPct: 12.5,
    deltaPositive: false, // gastar más es "negativo" para el negocio
    icon: Banknote,
    color: "primary" as const,
  },
  {
    label: "Mes actual · mayo 2026",
    valueUSD: 89.7,
    deltaPct: 0,
    deltaPositive: true,
    icon: Calendar,
    color: "accent" as const,
  },
  {
    label: "Promedio diario",
    valueUSD: 44.85,
    deltaPct: 8.2,
    deltaPositive: false,
    icon: TrendingUp,
    color: "info" as const,
  },
  {
    label: "Compras del mes",
    valueUSD: 5,
    isCount: true,
    deltaPct: 25,
    deltaPositive: true,
    icon: Receipt,
    color: "success" as const,
  },
];

export function DashboardKpis() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {KPIS.map((kpi, i) => (
        <KpiCard key={kpi.label} {...kpi} delay={i * 0.08} />
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  valueUSD: number;
  deltaPct: number;
  deltaPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "accent" | "info" | "success";
  isCount?: boolean;
  delay?: number;
}

function KpiCard({
  label,
  valueUSD,
  deltaPct,
  deltaPositive,
  icon: Icon,
  color,
  isCount,
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
              value={valueUSD}
              isCount={isCount}
              className="font-mono text-2xl md:text-3xl font-semibold tracking-tight tabular-nums"
            />
            {!isCount && (
              <span className="block text-[11px] text-muted-foreground font-mono">
                {formatBs(valueUSD * TASA, { compact: true })}
              </span>
            )}
          </div>
          {deltaPct !== 0 && (
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
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {deltaPct.toFixed(1)}%
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
  isCount?: boolean;
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
