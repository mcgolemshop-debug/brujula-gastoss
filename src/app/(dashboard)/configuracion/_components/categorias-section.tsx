"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { TIPO_LABELS } from "@/lib/validations/categoria";
import type { Categoria } from "@/types/domain";
import { CategoriaDialog } from "./categoria-dialog";
import {
  eliminarCategoriaAction,
  toggleCategoriaActivaAction,
} from "../_categorias-actions";

export function CategoriasSection({
  categorias,
  isAdmin,
}: {
  categorias: Categoria[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategoria, setEditingCategoria] =
    React.useState<Categoria | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Categoria | null>(
    null
  );
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);

  const activas = categorias.filter((c) => c.activa);
  const inactivas = categorias.filter((c) => !c.activa);

  function setBusy(id: string, busy: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openCreate() {
    setEditingCategoria(null);
    setDialogOpen(true);
  }

  function openEdit(c: Categoria) {
    setEditingCategoria(c);
    setDialogOpen(true);
  }

  async function handleToggleActiva(c: Categoria) {
    setBusy(c.id, true);
    const result = await toggleCategoriaActivaAction(c.id, !c.activa);
    setBusy(c.id, false);
    if (result.ok) {
      toast.success(
        c.activa
          ? `${c.nombre} desactivada`
          : `${c.nombre} reactivada`,
        {
          description: c.activa
            ? "Ya no aparece al registrar nuevos gastos"
            : "Vuelve a estar disponible",
        }
      );
      router.refresh();
    } else {
      toast.error("No se pudo", { description: result.error });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const result = await eliminarCategoriaAction(confirmDelete.id);
    setDeleting(false);
    if (result.ok) {
      toast.success(`${confirmDelete.nombre} eliminada`);
      setConfirmDelete(null);
      router.refresh();
    } else {
      toast.error("No se pudo eliminar", { description: result.error });
      // No cerramos el dialog para que el usuario lea el mensaje
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-accent" />
              Categorías
            </CardTitle>
            <CardDescription>
              {activas.length}{" "}
              {activas.length === 1 ? "activa" : "activas"}
              {inactivas.length > 0 &&
                ` · ${inactivas.length} inactiva${inactivas.length === 1 ? "" : "s"}`}{" "}
              ·{" "}
              {isAdmin
                ? "puedes crear, editar, activar/desactivar y eliminar"
                : "solo el admin puede editar"}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button
              variant="accent"
              size="sm"
              onClick={openCreate}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nueva
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activas.map((c, i) => (
              <CategoriaCard
                key={c.id}
                categoria={c}
                isAdmin={isAdmin}
                busy={pending.has(c.id)}
                onEdit={() => openEdit(c)}
                onToggleActiva={() => handleToggleActiva(c)}
                onDelete={() => setConfirmDelete(c)}
                delay={Math.min(i * 0.025, 0.3)}
              />
            ))}
          </div>

          {/* Inactivas */}
          {inactivas.length > 0 && (
            <div className="pt-4 border-t border-border space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2">
                <EyeOff className="h-3 w-3" />
                Inactivas ({inactivas.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {inactivas.map((c, i) => (
                  <CategoriaCard
                    key={c.id}
                    categoria={c}
                    isAdmin={isAdmin}
                    busy={pending.has(c.id)}
                    onEdit={() => openEdit(c)}
                    onToggleActiva={() => handleToggleActiva(c)}
                    onDelete={() => setConfirmDelete(c)}
                    delay={Math.min(i * 0.025, 0.3)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <CategoriaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          categoria={editingCategoria}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && !deleting && setConfirmDelete(null)}
        title={`¿Eliminar ${confirmDelete?.nombre}?`}
        description={
          confirmDelete
            ? `Esta acción es permanente. Si "${confirmDelete.nombre}" tiene gastos asociados no se podrá eliminar — usa "Desactivar" en su lugar para conservar el histórico.`
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

function CategoriaCard({
  categoria,
  isAdmin,
  busy,
  onEdit,
  onToggleActiva,
  onDelete,
  delay,
}: {
  categoria: Categoria;
  isAdmin: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggleActiva: () => void;
  onDelete: () => void;
  delay: number;
}) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[categoria.icono] ??
    Icons.Tag;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-secondary/40 transition-colors group",
          !categoria.activa && "opacity-60"
        )}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${categoria.color}1A`,
            color: categoria.color,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {categoria.nombre}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {TIPO_LABELS[categoria.tipo]}
          </div>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busy}
                className="opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="Acciones"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActiva}>
                {categoria.activa ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Reactivar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar permanente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}
