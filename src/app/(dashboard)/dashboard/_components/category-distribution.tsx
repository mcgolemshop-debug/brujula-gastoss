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
import { BRAND } from "@/lib/brand";
import { formatUSD } from "@/lib/utils";

const DATA = [
  { name: "Tecnología/Dispositivos", value: 50, color: BRAND.colors.navy },
  { name: "Aceites Carro/Moto", value: 18, color: BRAND.colors.gold },
  { name: "Ferretería", value: 12, color: BRAND.colors.graphite },
  { name: "Comida", value: 9.7, color: BRAND.colors.goldDark },
];

const TOTAL = DATA.reduce((sum, d) => sum + d.value, 0);

export function CategoryDistribution() {
  // Recharts requiere DOM para medir contenedor → diferimos a client-side
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
            Mes actual · Total {formatUSD(TOTAL)} en {DATA.length} categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={3}
                  stroke="var(--color-card)"
                >
                  {DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
                    const v = typeof value === "number" ? value : Number(value);
                    return `${formatUSD(v)} · ${((v / TOTAL) * 100).toFixed(1)}%`;
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
