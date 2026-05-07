"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, getInitials, colorFromName } from "@/lib/utils";
import type { Gasto } from "@/types/domain";
import { eliminarGastoAction } from "../_actions";
import { toast } from "sonner";

interface Props {
  gastos: Gasto[];
  total: number;
  page: number;
  pageSize: number;
  tasaActual: number;
}

export function GastosTable({ gastos, total, page, pageSize, tasaActual }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [toDelete, setToDelete] = React.useState<Gasto | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function setPage(p: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", p.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await eliminarGastoAction(toDelete.id);
    setDeleting(false);
    if (result.ok) {
      toast.success("Gasto eliminado", {
        description: `${toDelete.codigo} · ${toDelete.descripcion}`,
      });
      router.refresh();
    } else {
      toast.error("No se pudo eliminar", { description: result.error });
    }
    setToDelete(null);
  }

  if (gastos.length === 0) {
    return (
      <Card className="py-4">
        <EmptyState
          icon={ReceiptIcon}
          title="No hay gastos para mostrar"
          description="Cambia los filtros o registra un nuevo gasto para verlo aquí."
          action={{ label: "Nuevo gasto", href: "/gastos/nuevo" }}
        />
      </Card>
    );
  }

  return (
    <>
      {/* Desktop · tabla */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/30">
                <th className="px-4 py-3 font-medium">Cód.</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Persona</th>
                <th className="px-3 py-3 font-medium">Categoría</th>
                <th className="px-3 py-3 font-medium">Detalle</th>
                <th className="px-3 py-3 font-medium">Pago</th>
                <th className="px-3 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gastos.map((g, i) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                  className="group hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {g.codigo}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div>
                        {format(new Date(g.fecha + "T00:00:00"), "d MMM", {
                          locale: es,
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {g.hora}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <PersonCell name={g.usuario?.nombre_completo ?? "—"} />
                  </td>
                  <td className="px-3 py-3">
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
                  <td className="px-3 py-3 max-w-xs">
                    <div className="truncate font-medium">{g.descripcion}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {g.cantidad} {g.unidad}
                      {g.items > 1 && ` · ${g.items} ítems`}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-muted-foreground">
                      {g.metodo_pago}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <MoneyDisplay
                      usd={g.total_usd}
                      tasa={tasaActual}
                      align="right"
                      size="sm"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setToDelete(g)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile · tarjetas */}
      <Card className="md:hidden divide-y divide-border overflow-hidden">
        {gastos.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
            className="p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <PersonAvatar name={g.usuario?.nombre_completo ?? "—"} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {g.descripcion}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span className="font-mono">{g.codigo}</span>
                    <span>·</span>
                    <span>
                      {format(new Date(g.fecha + "T00:00:00"), "d MMM", {
                        locale: es,
                      })}
                    </span>
                    <span>·</span>
                    <span className="truncate">{g.metodo_pago}</span>
                  </div>
                  <div className="mt-2">
                    {g.categoria && (
                      <CategoryBadge
                        nombre={g.categoria.nombre}
                        icono={g.categoria.icono}
                        color={g.categoria.color}
                        variant="soft"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
              <MoneyDisplay
                usd={g.total_usd}
                tasa={tasaActual}
                align="right"
                size="md"
              />
            </div>
          </motion.div>
        ))}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Página <strong className="text-foreground font-mono">{page}</strong> de{" "}
            <strong className="text-foreground font-mono">{totalPages}</strong> ·{" "}
            <span className="font-mono">{total}</span> gastos
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="gap-1"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`¿Eliminar ${toDelete?.codigo}?`}
        description={
          toDelete
            ? `Vas a eliminar permanentemente "${toDelete.descripcion}" (${toDelete.usuario?.nombre_completo}). Esta acción no se puede deshacer.`
            : ""
        }
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}

function PersonCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <PersonAvatar name={name} />
      <span className="text-xs truncate hidden lg:inline">{name}</span>
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
