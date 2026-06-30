"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Receipt as ReceiptIcon,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, getInitials, colorFromName } from "@/lib/utils";
import type { Categoria, Gasto } from "@/types/domain";
import { eliminarGastoAction } from "../_actions";
import { BulkToolbar } from "./bulk-toolbar";
import { toast } from "sonner";

interface Props {
  gastos: Gasto[];
  total: number;
  page: number;
  pageSize: number;
  tasaActual: number;
  currentUserId: string;
  isAdmin: boolean;
  categorias: Categoria[];
}

export function GastosTable({
  gastos,
  total,
  page,
  pageSize,
  tasaActual,
  currentUserId,
  isAdmin,
  categorias,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [toDelete, setToDelete] = React.useState<Gasto | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset selección al cambiar de página o filtros
  React.useEffect(() => {
    setSelectedIds([]);
  }, [sp]);

  const allSelected = gastos.length > 0 && selectedIds.length === gastos.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    if (checked) setSelectedIds(gastos.map((g) => g.id));
    else setSelectedIds([]);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }

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
                {isAdmin && (
                  <th className="px-3 py-3 w-8">
                    <Checkbox
                      checked={allSelected || (someSelected && "indeterminate")}
                      onCheckedChange={(c) => toggleAll(!!c)}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                )}
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
              {gastos.map((g, i) => {
                const isSelected = selectedIds.includes(g.id);
                return (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                    className={cn(
                      "group hover:bg-secondary/30 transition-colors",
                      isSelected && "bg-accent/10"
                    )}
                  >
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(c) => toggleOne(g.id, !!c)}
                          aria-label={`Seleccionar ${g.codigo}`}
                        />
                      </td>
                    )}
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
                      {/* Siempre visibles en táctil (sin hover); en desktop con
                          mouse se revelan al pasar el cursor sobre la fila. */}
                      <div className="flex items-center gap-0.5 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Ver detalle"
                        >
                          <Link href={`/gastos/${g.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {(isAdmin || g.usuario_id === currentUserId) && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-accent"
                            aria-label="Editar"
                          >
                            <Link href={`/gastos/${g.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setToDelete(g)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile · tarjetas (toda la card es link al detalle) */}
      <Card className="md:hidden divide-y divide-border overflow-hidden">
        {gastos.map((g, i) => {
          const canEdit = isAdmin || g.usuario_id === currentUserId;
          const isSelected = selectedIds.includes(g.id);
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
              className={cn(
                "relative hover:bg-secondary/30 transition-colors",
                isSelected && "bg-accent/10"
              )}
            >
              {isAdmin && (
                <div className="absolute left-3 top-4 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(c) => toggleOne(g.id, !!c)}
                    aria-label={`Seleccionar ${g.codigo}`}
                  />
                </div>
              )}
              <Link
                href={`/gastos/${g.id}`}
                className={cn("block p-4 pr-12", isAdmin && "pl-10")}
                aria-label={`Ver detalle de ${g.codigo}`}
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
              </Link>
              {canEdit && (
                <Button
                  asChild
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
                  aria-label="Editar"
                >
                  <Link href={`/gastos/${g.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </motion.div>
          );
        })}
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

      {isAdmin && (
        <BulkToolbar
          selectedIds={selectedIds}
          categorias={categorias}
          onClear={() => setSelectedIds([])}
        />
      )}
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
