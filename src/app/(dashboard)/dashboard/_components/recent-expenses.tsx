"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatUSD, formatBs, getInitials, colorFromName } from "@/lib/utils";
import { GASTOS_EJEMPLO } from "@/lib/constants";

const TASA = 36.5;

export function RecentExpenses() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Gastos recientes</CardTitle>
            <CardDescription>
              Últimos {GASTOS_EJEMPLO.length} registros del equipo
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/gastos">
              Ver todos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {/* Desktop · tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="pb-2.5 pr-3 font-medium">Cód.</th>
                  <th className="pb-2.5 pr-3 font-medium">Persona</th>
                  <th className="pb-2.5 pr-3 font-medium">Categoría</th>
                  <th className="pb-2.5 pr-3 font-medium">Detalle</th>
                  <th className="pb-2.5 pr-3 font-medium text-right">
                    Total $
                  </th>
                  <th className="pb-2.5 font-medium text-right">Total Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {GASTOS_EJEMPLO.map((g) => {
                  const total = g.precio_unitario_usd * g.items;
                  return (
                    <tr
                      key={g.codigo}
                      className="group hover:bg-secondary/40 transition-colors"
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">
                        {g.codigo}
                      </td>
                      <td className="py-3 pr-3">
                        <PersonCell name={g.usuario} />
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className="font-normal">
                          {g.categoria}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 max-w-xs truncate text-foreground">
                        {g.descripcion}
                        <span className="text-muted-foreground text-xs ml-1.5">
                          · {g.cantidad} {g.unidad}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums">
                        {formatUSD(total)}
                      </td>
                      <td className="py-3 text-right font-mono text-xs text-muted-foreground tabular-nums">
                        {formatBs(total * TASA, { compact: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile · tarjetas */}
          <div className="md:hidden divide-y divide-border">
            {GASTOS_EJEMPLO.map((g) => {
              const total = g.precio_unitario_usd * g.items;
              return (
                <div
                  key={g.codigo}
                  className="py-3 px-4 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <PersonAvatar name={g.usuario} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {g.descripcion}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="truncate">{g.usuario}</span>
                          <span>·</span>
                          <span className="font-mono">{g.codigo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-semibold text-sm">
                        {formatUSD(total)}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {formatBs(total * TASA, { compact: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    <Badge variant="outline" className="font-normal">
                      {g.categoria}
                    </Badge>
                    <span className="text-muted-foreground font-mono">
                      {g.cantidad} {g.unidad}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PersonCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <PersonAvatar name={name} />
      <span className="text-sm truncate">{name}</span>
    </div>
  );
}

function PersonAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const bg = colorFromName(name);
  return (
    <Avatar className={cn("h-7 w-7 ring-1 shrink-0")}>
      <AvatarFallback
        style={{ background: bg, color: "white", fontSize: 10 }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
