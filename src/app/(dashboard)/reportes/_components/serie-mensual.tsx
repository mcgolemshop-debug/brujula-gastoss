"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Categoria, Gasto } from "@/types/domain";
import { formatUSD } from "@/lib/utils";

export function SerieMensual({
  gastos,
  categorias,
}: {
  gastos: Gasto[];
  categorias: Categoria[];
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Agregar por mes y categoría
  // Top 6 categorías por gasto total; el resto se agrupa en "Otros"
  const totalPorCat = new Map<string, number>();
  for (const g of gastos) {
    const id = g.categoria_id;
    totalPorCat.set(id, (totalPorCat.get(id) ?? 0) + g.total_usd);
  }
  const topCatIds = Array.from(totalPorCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);
  const topCategorias = topCatIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter(Boolean) as Categoria[];

  // Por mes
  const meses = new Map<string, Record<string, number>>();
  for (const g of gastos) {
    const mes = g.fecha.slice(0, 7); // YYYY-MM
    if (!meses.has(mes)) meses.set(mes, {});
    const row = meses.get(mes)!;
    const catId = topCatIds.includes(g.categoria_id) ? g.categoria_id : "otros";
    row[catId] = (row[catId] ?? 0) + g.total_usd;
  }
  const data = Array.from(meses.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, vals]) => ({
      mes,
      label: format(parseISO(mes + "-01"), "MMM yy", { locale: es }),
      ...vals,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Evolución mensual por categoría</CardTitle>
          <CardDescription>
            Stacked bar · {data.length} {data.length === 1 ? "mes" : "meses"}{" "}
            · top {topCategorias.length} categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            {mounted && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      padding: "8px 12px",
                      color: "var(--color-popover-foreground)",
                    }}
                    formatter={(value, name) => {
                      const v =
                        typeof value === "number" ? value : Number(value);
                      const cat = topCategorias.find((c) => c.id === name);
                      return [formatUSD(v), cat?.nombre ?? "Otros"];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px" }}
                    formatter={(value) => {
                      if (value === "otros") return "Otros";
                      const cat = topCategorias.find((c) => c.id === value);
                      return cat?.nombre ?? value;
                    }}
                  />
                  {topCategorias.map((c) => (
                    <Bar
                      key={c.id}
                      dataKey={c.id}
                      stackId="a"
                      fill={c.color}
                      radius={0}
                    />
                  ))}
                  <Bar
                    dataKey="otros"
                    stackId="a"
                    fill="#6B7280"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
