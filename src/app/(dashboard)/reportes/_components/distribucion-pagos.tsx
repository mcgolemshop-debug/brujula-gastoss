"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Gasto } from "@/types/domain";
import { formatUSD } from "@/lib/utils";

const COLORS: Record<string, string> = {
  "Efectivo $": "#15803D",
  "Efectivo Bs": "#10B981",
  Transferencia: "#0A2540",
  "Pago Móvil": "#143659",
  Zelle: "#8B5CF6",
  Tarjeta: "#D4A574",
  Binance: "#F59E0B",
  Otro: "#6B7280",
};

export function DistribucionPagos({ gastos }: { gastos: Gasto[] }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const porMetodo = new Map<string, number>();
  for (const g of gastos) {
    porMetodo.set(g.metodo_pago, (porMetodo.get(g.metodo_pago) ?? 0) + g.total_usd);
  }
  const total = Array.from(porMetodo.values()).reduce((a, b) => a + b, 0);
  const data = Array.from(porMetodo.entries())
    .map(([nombre, value]) => ({
      nombre,
      value,
      pct: (value / total) * 100,
      color: COLORS[nombre] ?? "#6B7280",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Métodos de pago</CardTitle>
          <CardDescription>
            {data.length} {data.length === 1 ? "método" : "métodos"} usados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[180px] w-full">
            {mounted && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={2}
                    strokeWidth={3}
                    stroke="var(--color-card)"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.nombre} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(value) => {
                      const v =
                        typeof value === "number" ? value : Number(value);
                      return formatUSD(v);
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
            )}
          </div>
          <div className="space-y-1.5">
            {data.map((d) => (
              <div
                key={d.nombre}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate">{d.nombre}</span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="tabular-nums">{formatUSD(d.value)}</span>
                  <span className="text-muted-foreground tabular-nums w-10 text-right">
                    {d.pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
