"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatUSD } from "@/lib/utils";

const TOP = [
  { rank: 1, name: "Tecnología/Dispositivos", value: 50, pct: 55.7, color: "#0A2540" },
  { rank: 2, name: "Aceites Carro/Moto", value: 18, pct: 20.1, color: "#D4A574" },
  { rank: 3, name: "Ferretería", value: 12, pct: 13.4, color: "#5F5E5A" },
  { rank: 4, name: "Comida", value: 9.7, pct: 10.8, color: "#B88857" },
];

export function TopCategories() {
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
        <CardContent className="space-y-4">
          {TOP.map((cat, i) => (
            <motion.div
              key={cat.name}
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
                    cat.rank === 1 && "bg-accent/20 text-accent"
                  )}
                >
                  {cat.rank}
                </Badge>
                <span className="font-medium truncate flex-1 min-w-0">
                  {cat.name}
                </span>
                <span className="font-mono font-semibold tabular-nums shrink-0">
                  {formatUSD(cat.value)}
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
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
