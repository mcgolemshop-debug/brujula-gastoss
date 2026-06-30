"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatBs, formatUSD } from "@/lib/utils";
import type { Categoria, Presupuesto } from "@/types/domain";
import { PresupuestoDialog } from "./presupuesto-dialog";

interface PresupuestoConGasto extends Presupuesto {
  gastado_usd: number;
}

interface Props {
  categorias: Categoria[];
  presupuestos: PresupuestoConGasto[];
  tasa: number;
  mes: number;
  anio: number;
  isAdmin: boolean;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function PresupuestosContent({
  categorias,
  presupuestos,
  tasa,
  mes,
  anio,
  isAdmin,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [editing, setEditing] = React.useState<{
    categoria_id?: string;
    monto_usd?: number;
  } | null>(null);

  function navMonth(direction: -1 | 1) {
    let nuevoMes = mes + direction;
    let nuevoAnio = anio;
    if (nuevoMes < 1) {
      nuevoMes = 12;
      nuevoAnio--;
    } else if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio++;
    }
    const params = new URLSearchParams(sp.toString());
    params.set("mes", String(nuevoMes));
    params.set("anio", String(nuevoAnio));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Categorías sin presupuesto definido
  const definidas = new Set(presupuestos.map((p) => p.categoria_id));
  const sinPresupuesto = categorias.filter((c) => !definidas.has(c.id));

  const totalPresupuesto = presupuestos.reduce((s, p) => s + p.monto_usd, 0);
  const totalGastado = presupuestos.reduce((s, p) => s + p.gastado_usd, 0);
  const overallPct =
    totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

  return (
    <>
      {/* Selector de mes */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navMonth(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[140px] sm:min-w-[180px]">
            <div className="font-serif text-2xl font-medium tracking-tight">
              {MESES[mes - 1]}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {anio}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navMonth(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isAdmin && sinPresupuesto.length > 0 && (
          <Button
            variant="accent"
            size="sm"
            className="gap-2"
            onClick={() => setEditing({ categoria_id: sinPresupuesto[0].id })}
          >
            <Plus className="h-4 w-4" />
            Definir presupuesto
          </Button>
        )}
      </div>

      {/* Overall stats */}
      {presupuestos.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Resumen del mes
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold">
                    {formatUSD(totalGastado)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    de {formatUSD(totalPresupuesto)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  ≈ {formatBs(totalGastado * tasa, { compact: true })} ·{" "}
                  {presupuestos.length}{" "}
                  {presupuestos.length === 1 ? "categoría" : "categorías"}{" "}
                  con presupuesto
                </p>
              </div>
              <StatusBadge pct={overallPct} />
            </div>
            <Progress
              value={Math.min(overallPct, 100)}
              className={cn(
                "h-3",
                overallPct >= 100 &&
                  "[&>div]:bg-destructive",
                overallPct >= 80 && overallPct < 100 && "[&>div]:bg-warning"
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Lista de presupuestos */}
      {presupuestos.length === 0 ? (
        <Card className="py-4">
          <EmptyState
            icon={Target}
            title="Sin presupuestos definidos para este mes"
            description={
              isAdmin
                ? "Define un tope para una o más categorías. Recibirás alertas cuando estén cerca del límite."
                : "El admin aún no ha definido presupuestos para este mes."
            }
            action={
              isAdmin && sinPresupuesto.length > 0
                ? {
                    label: "Definir el primero",
                    onClick: () =>
                      setEditing({ categoria_id: sinPresupuesto[0].id }),
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestos.map((p, i) => (
            <PresupuestoCard
              key={p.id}
              presupuesto={p}
              categoria={categorias.find((c) => c.id === p.categoria_id)}
              tasa={tasa}
              isAdmin={isAdmin}
              onEdit={() =>
                setEditing({
                  categoria_id: p.categoria_id,
                  monto_usd: p.monto_usd,
                })
              }
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      {/* Categorías sin presupuesto (admin only) */}
      {isAdmin && sinPresupuesto.length > 0 && presupuestos.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Categorías sin presupuesto en {MESES[mes - 1]} {anio}
            </div>
            <div className="flex flex-wrap gap-2">
              {sinPresupuesto.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEditing({ categoria_id: c.id })}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-border hover:bg-secondary hover:border-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {c.nombre}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <PresupuestoDialog
          open={editing !== null}
          onOpenChange={(o) => !o && setEditing(null)}
          categorias={categorias}
          presupuestos={presupuestos}
          mes={mes}
          anio={anio}
          tasa={tasa}
          initial={editing ?? undefined}
        />
      )}
    </>
  );
}

function PresupuestoCard({
  presupuesto,
  categoria,
  tasa,
  isAdmin,
  onEdit,
  delay,
}: {
  presupuesto: PresupuestoConGasto;
  categoria?: Categoria;
  tasa: number;
  isAdmin: boolean;
  onEdit: () => void;
  delay: number;
}) {
  const pct =
    presupuesto.monto_usd > 0
      ? (presupuesto.gastado_usd / presupuesto.monto_usd) * 100
      : 0;
  const restante = presupuesto.monto_usd - presupuesto.gastado_usd;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card
        className={cn(
          "h-full",
          pct >= 100 && "border-destructive/40",
          pct >= 80 && pct < 100 && "border-warning/40"
        )}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              {categoria && (
                <CategoryBadge
                  nombre={categoria.nombre}
                  icono={categoria.icono}
                  color={categoria.color}
                  variant="soft"
                />
              )}
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold tabular-nums">
                  {formatUSD(presupuesto.gastado_usd)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {formatUSD(presupuesto.monto_usd)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                ≈ {formatBs(presupuesto.gastado_usd * tasa, { compact: true })}
              </p>
            </div>
            <StatusBadge pct={pct} compact />
          </div>

          <div className="space-y-1.5">
            <Progress
              value={Math.min(pct, 100)}
              className={cn(
                "h-2",
                pct >= 100 && "[&>div]:bg-destructive",
                pct >= 80 && pct < 100 && "[&>div]:bg-warning"
              )}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{pct.toFixed(0)}% usado</span>
              <span>
                {restante >= 0
                  ? `${formatUSD(restante)} disponible`
                  : `${formatUSD(Math.abs(restante))} excedido`}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Editar tope
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ pct, compact }: { pct: number; compact?: boolean }) {
  if (pct >= 100) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-semibold",
          compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        )}
      >
        <AlertTriangle className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {pct.toFixed(0)}% · excedido
      </span>
    );
  }
  if (pct >= 80) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning border border-warning/30 font-semibold",
          compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        )}
      >
        <TrendingUp className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {pct.toFixed(0)}% · cerca
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-success/10 text-success border border-success/20 font-semibold",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      <CheckCircle2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {pct.toFixed(0)}% · ok
    </span>
  );
}
