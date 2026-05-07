"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Apple,
  Beef,
  Coffee,
  Drumstick,
  GlassWater,
  Milk,
  Sandwich,
  ShoppingBasket,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  cn,
  colorFromName,
  formatBs,
  formatUSD,
  getInitials,
} from "@/lib/utils";
import type { Gasto } from "@/types/domain";

interface Props {
  gastos: Gasto[];
  tasa: number;
  rango: { desde: string; hasta: string };
}

// Heurística simple para iconos por keyword
const KEYWORD_ICONS: Array<{ regex: RegExp; icon: React.ComponentType<{ className?: string }>; tipo: string }> = [
  { regex: /carne|res|pollo|cerdo|solomo|pernil|costilla|chuleta|hamburgues/i, icon: Beef, tipo: "Proteínas" },
  { regex: /pollo|gallin|alas|muslo/i, icon: Drumstick, tipo: "Aves" },
  { regex: /leche|yogur|queso|mantequilla|crema/i, icon: Milk, tipo: "Lácteos" },
  { regex: /caf[eé]|t[eé]\b|cappucc/i, icon: Coffee, tipo: "Bebidas calientes" },
  { regex: /jugo|agua|refresco|cerveza|gaseosa|coca|pepsi|gatorade/i, icon: GlassWater, tipo: "Bebidas" },
  { regex: /manzana|naranja|lim[oó]n|fresa|mango|pi[ñn]a|pl[aá]tano|fruta|guayaba|uva|melon/i, icon: Apple, tipo: "Frutas" },
  { regex: /arroz|pan|pasta|harina|tortilla|galleta|cereal|sandwich/i, icon: Sandwich, tipo: "Cereales" },
];

function classifyProduct(descripcion: string) {
  for (const k of KEYWORD_ICONS) {
    if (k.regex.test(descripcion)) return k;
  }
  return { icon: ShoppingBasket, tipo: "Otros alimentos" };
}

function normalizeProductName(s: string): string {
  return s.trim().toLowerCase();
}

export function ComidaContent({ gastos, tasa, rango }: Props) {
  if (gastos.length === 0) {
    return (
      <Card className="py-4">
        <EmptyState
          icon={Sandwich}
          title="Sin compras de comida en el período"
          description={`No hay gastos de Comida entre ${rango.desde} y ${rango.hasta}.`}
          action={{ label: "Nuevo gasto", href: "/gastos/nuevo" }}
        />
      </Card>
    );
  }

  // Totales por unidad
  const porUnidad = new Map<string, { cantidad: number; usd: number; compras: number }>();
  for (const g of gastos) {
    const existing = porUnidad.get(g.unidad) ?? {
      cantidad: 0,
      usd: 0,
      compras: 0,
    };
    existing.cantidad += g.cantidad * g.items;
    existing.usd += g.total_usd;
    existing.compras += 1;
    porUnidad.set(g.unidad, existing);
  }
  const totalesPorUnidad = Array.from(porUnidad.entries())
    .map(([unidad, data]) => ({ unidad, ...data }))
    .sort((a, b) => b.usd - a.usd);

  // Productos más comprados (agregando por nombre normalizado)
  const productos = new Map<
    string,
    {
      nombre: string;
      cantidad_total: number;
      unidad: string;
      compras: number;
      usd_total: number;
      ultima_fecha: string;
    }
  >();
  for (const g of gastos) {
    const key = normalizeProductName(g.descripcion);
    const existing = productos.get(key) ?? {
      nombre: g.descripcion,
      cantidad_total: 0,
      unidad: g.unidad,
      compras: 0,
      usd_total: 0,
      ultima_fecha: g.fecha,
    };
    existing.cantidad_total += g.cantidad * g.items;
    existing.compras += 1;
    existing.usd_total += g.total_usd;
    if (g.fecha > existing.ultima_fecha) existing.ultima_fecha = g.fecha;
    productos.set(key, existing);
  }
  const topProductos = Array.from(productos.values())
    .sort((a, b) => b.compras - a.compras || b.usd_total - a.usd_total)
    .slice(0, 10);

  // Por tipo (heurística)
  const porTipo = new Map<string, number>();
  for (const g of gastos) {
    const k = classifyProduct(g.descripcion);
    porTipo.set(k.tipo, (porTipo.get(k.tipo) ?? 0) + g.total_usd);
  }
  const totalGeneral = gastos.reduce((s, g) => s + g.total_usd, 0);

  return (
    <>
      {/* KPIs por unidad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {totalesPorUnidad.slice(0, 4).map((t, i) => (
          <motion.div
            key={t.unidad}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <Card className="p-5">
              <CardContent className="p-0 space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Total en {t.unidad}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {t.cantidad.toLocaleString("es-VE", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t.unidad.toLowerCase()}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {formatUSD(t.usd, { compact: true })} · {t.compras}{" "}
                  {t.compras === 1 ? "compra" : "compras"}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos más comprados */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Productos más comprados</CardTitle>
                <CardDescription>
                  Top {topProductos.length} alimentos por frecuencia · {gastos.length}{" "}
                  {gastos.length === 1 ? "compra total" : "compras totales"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {topProductos.map((p, i) => {
                  const meta = classifyProduct(p.nombre);
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={p.nombre}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: 0.3 + i * 0.04,
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/40 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-muted-foreground w-5 shrink-0">
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate capitalize">
                          {p.nombre}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {p.compras}× · {p.cantidad_total.toLocaleString("es-VE", { maximumFractionDigits: 2 })}{" "}
                          {p.unidad.toLowerCase()} · última{" "}
                          {format(parseISO(p.ultima_fecha), "d MMM", {
                            locale: es,
                          })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-semibold tabular-nums">
                          {formatUSD(p.usd_total)}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {formatBs(p.usd_total * tasa, { compact: true })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Por tipo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Por tipo</CardTitle>
              <CardDescription>Categorización automática</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(porTipo.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, usd], i) => {
                  const pct = (usd / totalGeneral) * 100;
                  return (
                    <div key={tipo} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{tipo}</span>
                        <span className="font-mono tabular-nums">
                          {formatUSD(usd, { compact: true })}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: 0.4 + i * 0.05,
                          }}
                          className="h-full rounded-full bg-accent"
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {pct.toFixed(0)}% del total
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabla detallada */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Detalle de compras</CardTitle>
            <CardDescription>
              Cantidades exactas con persona y fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 md:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="px-4 py-2.5 font-medium">Producto</th>
                    <th className="px-3 py-2.5 font-medium">Cantidad</th>
                    <th className="px-3 py-2.5 font-medium">Persona</th>
                    <th className="px-3 py-2.5 font-medium">Fecha</th>
                    <th className="px-3 py-2.5 font-medium text-right">$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gastos.map((g) => {
                    const meta = classifyProduct(g.descripcion);
                    const Icon = meta.icon;
                    return (
                      <tr
                        key={g.id}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {g.descripcion}
                              </div>
                              {g.observaciones && (
                                <div className="text-[10px] text-muted-foreground italic truncate">
                                  &ldquo;{g.observaciones}&rdquo;
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">
                          {g.cantidad} {g.unidad}
                          {g.items > 1 && (
                            <span className="text-muted-foreground ml-1">
                              × {g.items}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback
                                style={{
                                  background: colorFromName(
                                    g.usuario?.nombre_completo ?? ""
                                  ),
                                  color: "white",
                                  fontSize: 9,
                                }}
                              >
                                {getInitials(g.usuario?.nombre_completo ?? "")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate">
                              {g.usuario?.nombre_completo ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
                          {format(parseISO(g.fecha), "d MMM", { locale: es })}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                          {formatUSD(g.total_usd)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

// Tag for unused warning suppression
const _cn = cn;
