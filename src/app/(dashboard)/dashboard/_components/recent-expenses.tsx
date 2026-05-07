"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Receipt as ReceiptIcon } from "lucide-react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryBadge } from "@/components/shared/category-badge";
import { cn, formatUSD, formatBs, getInitials, colorFromName } from "@/lib/utils";
import type { Gasto } from "@/types/domain";

interface Props {
  gastos: Gasto[];
  tasa: number;
}

export function RecentExpenses({ gastos, tasa }: Props) {
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
              Últimos {gastos.length}{" "}
              {gastos.length === 1 ? "registro" : "registros"} del equipo
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
          {gastos.length === 0 ? (
            <EmptyState
              icon={ReceiptIcon}
              title="Sin gastos registrados"
              description="Cuando alguien del equipo registre el primer gasto, aparecerá aquí."
              action={{ label: "Registrar primer gasto", href: "/gastos/nuevo" }}
            />
          ) : (
            <>
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
                    {gastos.map((g) => (
                      <tr
                        key={g.id}
                        className="group hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">
                          {g.codigo}
                        </td>
                        <td className="py-3 pr-3">
                          <PersonCell
                            name={g.usuario?.nombre_completo ?? "—"}
                          />
                        </td>
                        <td className="py-3 pr-3">
                          {g.categoria && (
                            <CategoryBadge
                              nombre={g.categoria.nombre}
                              icono={g.categoria.icono}
                              color={g.categoria.color}
                              variant="soft"
                              size="sm"
                            />
                          )}
                        </td>
                        <td className="py-3 pr-3 max-w-xs truncate text-foreground">
                          {g.descripcion}
                          <span className="text-muted-foreground text-xs ml-1.5">
                            · {g.cantidad} {g.unidad}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums">
                          {formatUSD(g.total_usd)}
                        </td>
                        <td className="py-3 text-right font-mono text-xs text-muted-foreground tabular-nums">
                          {formatBs(g.total_bs, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile · tarjetas */}
              <div className="md:hidden divide-y divide-border">
                {gastos.map((g) => (
                  <div
                    key={g.id}
                    className="py-3 px-4 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <PersonAvatar
                          name={g.usuario?.nombre_completo ?? "—"}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {g.descripcion}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="truncate">
                              {g.usuario?.nombre_completo ?? "—"}
                            </span>
                            <span>·</span>
                            <span className="font-mono">{g.codigo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-semibold text-sm">
                          {formatUSD(g.total_usd)}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {formatBs(g.total_bs, { compact: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      {g.categoria && (
                        <CategoryBadge
                          nombre={g.categoria.nombre}
                          icono={g.categoria.icono}
                          color={g.categoria.color}
                          variant="soft"
                          size="sm"
                        />
                      )}
                      <span className="text-muted-foreground font-mono">
                        {g.cantidad} {g.unidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
