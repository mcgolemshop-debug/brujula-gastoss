"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartPie } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface CategoryDatum {
  categoria_id: string;
  nombre: string;
  color: string;
  total_usd: number;
  pct: number;
}

export function CategoryDistribution({ data }: { data: CategoryDatum[] }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const total = data.reduce((sum, d) => sum + d.total_usd, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Distribución por categoría</CardTitle>
          <CardDescription>
            Mes actual · Total {formatUSD(total)} en {data.length}{" "}
            {data.length === 1 ? "categoría" : "categorías"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            {data.length === 0 ? (
              <EmptyState
                icon={ChartPie}
                title="Sin gastos este mes aún"
                description="Apenas registres el primer gasto del mes verás la distribución."
              />
            ) : mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total_usd"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    strokeWidth={3}
                    stroke="var(--color-card)"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.categoria_id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      padding: "8px 12px",
                      color: "var(--color-popover-foreground)",
                    }}
                    formatter={(value) => {
                      const v =
                        typeof value === "number" ? value : Number(value);
                      return `${formatUSD(v)} · ${((v / total) * 100).toFixed(1)}%`;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                </PieChart>
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
