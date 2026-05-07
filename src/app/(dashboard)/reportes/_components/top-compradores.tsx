"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Gasto, User } from "@/types/domain";
import { colorFromName, formatUSD, formatBs, getInitials } from "@/lib/utils";

export function TopCompradores({
  gastos,
  usuarios,
  tasa,
}: {
  gastos: Gasto[];
  usuarios: User[];
  tasa: number;
}) {
  const porUsuario = new Map<
    string,
    { total: number; count: number; categoria: Map<string, number> }
  >();
  for (const g of gastos) {
    const existing = porUsuario.get(g.usuario_id) ?? {
      total: 0,
      count: 0,
      categoria: new Map<string, number>(),
    };
    existing.total += g.total_usd;
    existing.count += 1;
    if (g.categoria) {
      const cName = g.categoria.nombre;
      existing.categoria.set(
        cName,
        (existing.categoria.get(cName) ?? 0) + g.total_usd
      );
    }
    porUsuario.set(g.usuario_id, existing);
  }

  const ranking = Array.from(porUsuario.entries())
    .map(([userId, data]) => {
      const user = usuarios.find((u) => u.id === userId);
      const catFav = Array.from(data.categoria.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0];
      return {
        userId,
        nombre: user?.nombre_completo ?? "Usuario eliminado",
        total: data.total,
        count: data.count,
        categoriaFavorita: catFav?.[0] ?? "—",
        rol: user?.rol ?? "empleado",
      };
    })
    .sort((a, b) => b.total - a.total);

  const maxTotal = ranking[0]?.total ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Top compradores</CardTitle>
          <CardDescription>
            Quién ha comprado cuánto en el período · {ranking.length}{" "}
            {ranking.length === 1 ? "persona activa" : "personas activas"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ranking.map((r, i) => (
            <motion.div
              key={r.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs w-5 text-muted-foreground shrink-0">
                  #{i + 1}
                </span>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback
                    style={{
                      background: colorFromName(r.nombre),
                      color: "white",
                    }}
                    className="text-xs"
                  >
                    {getInitials(r.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {r.nombre}
                    </span>
                    {r.rol === "admin" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {r.count} {r.count === 1 ? "compra" : "compras"} · favorita: {r.categoriaFavorita}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold text-sm tabular-nums">
                    {formatUSD(r.total)}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {formatBs(r.total * tasa, { compact: true })}
                  </div>
                </div>
              </div>
              <Progress
                value={(r.total / maxTotal) * 100}
                className="h-1.5 ml-12"
              />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
