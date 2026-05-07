"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Armchair,
  Boxes,
  Car,
  ChevronDown,
  Cpu,
  Laptop,
  MapPin,
  MoreVertical,
  Plug,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NuevoMobiliarioButton } from "./nuevo-mobiliario-button";
import { ESTADOS_MOBILIARIO } from "@/lib/constants";
import { cn, formatUSD } from "@/lib/utils";
import type { EstadoMobiliario, Mobiliario } from "@/types/domain";
import {
  cambiarEstadoMobiliarioAction,
  eliminarMobiliarioAction,
} from "../_actions";
import { toast } from "sonner";

interface Props {
  items: Mobiliario[];
  isAdmin: boolean;
  tasaActual: number;
}

const TIPO_ICON: Record<Mobiliario["tipo"], React.ComponentType<{ className?: string }>> = {
  mobiliario: Armchair,
  dispositivo: Laptop,
  equipo: Cpu,
  vehiculo: Car,
  otro: Plug,
};

export function MobiliarioGrid({ items, isAdmin, tasaActual }: Props) {
  const router = useRouter();
  const [filterEstado, setFilterEstado] = React.useState<EstadoMobiliario | "all">("all");
  const [toDelete, setToDelete] = React.useState<Mobiliario | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const filtered =
    filterEstado === "all"
      ? items
      : items.filter((m) => m.estado === filterEstado);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await eliminarMobiliarioAction(toDelete.id);
    setDeleting(false);
    if (result.ok) {
      toast.success(`${toDelete.codigo} eliminado`, {
        description: toDelete.descripcion,
      });
      setToDelete(null);
      router.refresh();
    } else {
      toast.error("No se pudo eliminar", { description: result.error });
    }
  }

  if (items.length === 0) {
    return (
      <Card className="py-4">
        <div className="flex flex-col items-center justify-center text-center py-12 px-6">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Boxes className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-xl font-medium text-foreground">
            No hay mobiliario aún
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            {isAdmin
              ? "Agrega el primer ítem para empezar a llevar el inventario."
              : "El admin todavía no ha registrado mobiliario."}
          </p>
          {isAdmin && (
            <div className="mt-6">
              <NuevoMobiliarioButton />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={filterEstado === "all"}
          onClick={() => setFilterEstado("all")}
        >
          Todos · {items.length}
        </FilterChip>
        {ESTADOS_MOBILIARIO.map((e) => {
          const count = items.filter((m) => m.estado === e.value).length;
          if (count === 0) return null;
          return (
            <FilterChip
              key={e.value}
              active={filterEstado === e.value}
              onClick={() => setFilterEstado(e.value)}
              tone={e.color}
            >
              {e.label} · {count}
            </FilterChip>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m, i) => (
          <MobiliarioCard
            key={m.id}
            item={m}
            isAdmin={isAdmin}
            tasa={tasaActual}
            delay={Math.min(i * 0.04, 0.5)}
            onDelete={() => setToDelete(m)}
          />
        ))}
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && !deleting && setToDelete(null)}
        title={`¿Eliminar ${toDelete?.codigo}?`}
        description={
          toDelete
            ? `Vas a eliminar permanentemente "${toDelete.descripcion}" del inventario. Los gastos vinculados a este ítem permanecen pero pierden la referencia. Esta acción no se puede deshacer — considera cambiar el estado a "Dado de baja" si solo quieres archivarlo.`
            : ""
        }
        variant="destructive"
        confirmLabel="Sí, eliminar permanentemente"
        cancelLabel="Mejor no"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function MobiliarioCard({
  item,
  isAdmin,
  tasa,
  delay,
  onDelete,
}: {
  item: Mobiliario;
  isAdmin: boolean;
  tasa: number;
  delay: number;
  onDelete: () => void;
}) {
  const [changing, setChanging] = React.useState<EstadoMobiliario | null>(null);
  const Icon = TIPO_ICON[item.tipo] ?? Armchair;
  const estadoMeta = ESTADOS_MOBILIARIO.find((e) => e.value === item.estado);
  const opacityWhenBaja = item.estado === "dado_de_baja" ? "opacity-50" : "";

  async function handleChangeEstado(estado: EstadoMobiliario) {
    setChanging(estado);
    const result = await cambiarEstadoMobiliarioAction(item.id, estado);
    setChanging(null);
    if (result.ok) {
      toast.success("Estado actualizado", {
        description: `${item.codigo} → ${ESTADOS_MOBILIARIO.find((e) => e.value === estado)?.label}`,
      });
    } else {
      toast.error("No se pudo actualizar", { description: result.error });
    }
  }

  const totalValor = item.precio_compra_usd * item.cantidad;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card
        className={cn(
          "h-full flex flex-col hover:shadow-elegant hover:border-accent/40 transition-all group",
          opacityWhenBaja
        )}
      >
        <CardContent className="p-5 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {item.codigo}
                  </span>
                  {item.cantidad > 1 && (
                    <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                      ×{item.cantidad}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm leading-tight mt-0.5">
                  {item.descripcion}
                </h3>
                {item.marca_modelo && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.marca_modelo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge
                      variant={
                        (estadoMeta?.color as
                          | "success"
                          | "warning"
                          | "destructive"
                          | "muted") ?? "muted"
                      }
                      className={cn(
                        "shrink-0 cursor-pointer hover:opacity-80 gap-1",
                        item.estado === "necesita_reparacion" && "animate-pulse"
                      )}
                    >
                      {estadoMeta?.label ?? item.estado}
                      <ChevronDown className="h-3 w-3" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ESTADOS_MOBILIARIO.map((e) => (
                      <DropdownMenuItem
                        key={e.value}
                        onClick={() => handleChangeEstado(e.value)}
                        disabled={
                          item.estado === e.value || changing !== null
                        }
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            e.color === "success" && "bg-success",
                            e.color === "warning" && "bg-warning",
                            e.color === "destructive" && "bg-destructive",
                            e.color === "muted" && "bg-muted-foreground"
                          )}
                        />
                        {e.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge
                  variant={
                    (estadoMeta?.color as
                      | "success"
                      | "warning"
                      | "destructive"
                      | "muted") ?? "muted"
                  }
                  className={cn(
                    "shrink-0",
                    item.estado === "necesita_reparacion" && "animate-pulse"
                  )}
                >
                  {estadoMeta?.label ?? item.estado}
                </Badge>
              )}

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-60 group-hover:opacity-100 transition-opacity"
                      aria-label="Más acciones"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar permanentemente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {item.notas && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              &ldquo;{item.notas}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
            {item.ubicacion && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.ubicacion}
              </span>
            )}
            {item.serial && (
              <span className="font-mono inline-flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                {item.serial}
              </span>
            )}
            {item.asignado_a && (
              <span className="inline-flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Asignado
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Valor
          </span>
          <div className="text-right">
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatUSD(totalValor)}
            </span>
            <span className="block font-mono text-[10px] text-muted-foreground">
              ≈ Bs {(totalValor * tasa).toLocaleString("es-VE", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
