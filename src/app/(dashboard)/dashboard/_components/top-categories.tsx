"use client";

import { motion } from "framer-motion";
import { ChartBar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatUSD } from "@/lib/utils";

interface CategoryDatum {
  categoria_id: string;
  nombre: string;
  color: string;
  total_usd: number;
  pct: number;
}

export function TopCategories({ data }: { data: CategoryDatum[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Top categorías</CardTitle>
          <CardDescription>Por gasto del mes</CardDescription>
        </CardHeader>
        <CardContent className={data.length === 0 ? "p-0" : "space-y-4"}>
          {data.length === 0 ? (
            <EmptyState
              icon={ChartBar}
              title="Sin actividad este mes"
            />
          ) : (
            data.map((cat, i) => (
              <motion.div
                key={cat.categoria_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.07 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    variant="muted"
                    className={cn(
                      "rounded-md font-mono font-bold w-7 h-6 justify-center shrink-0",
                      i === 0 && "bg-accent/20 text-accent"
                    )}
                  >
                    {i + 1}
                  </Badge>
                  <span className="font-medium truncate flex-1 min-w-0">
                    {cat.nombre}
                  </span>
                  <span className="font-mono font-semibold tabular-nums shrink-0">
                    {formatUSD(cat.total_usd)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.6 + i * 0.07,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {cat.pct.toFixed(1)}% del total
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
