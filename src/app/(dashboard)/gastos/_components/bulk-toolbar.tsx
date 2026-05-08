"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Tag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  eliminarGastosBulkAction,
  recategorizarGastosBulkAction,
} from "../_actions";
import type { Categoria } from "@/types/domain";
import { toast } from "sonner";

interface Props {
  selectedIds: string[];
  categorias: Categoria[];
  onClear: () => void;
}

export function BulkToolbar({ selectedIds, categorias, onClear }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [recatOpen, setRecatOpen] = React.useState(false);
  const [recatId, setRecatId] = React.useState<string>("");
  const [pending, startTransition] = React.useTransition();

  const count = selectedIds.length;
  if (count === 0) return null;

  function handleDelete() {
    startTransition(async () => {
      const r = await eliminarGastosBulkAction(selectedIds);
      if (r.ok) {
        toast.success(`${r.data.count} gasto${r.data.count === 1 ? "" : "s"} eliminado${r.data.count === 1 ? "" : "s"}`);
        onClear();
        router.refresh();
      } else {
        toast.error("No se pudo eliminar", { description: r.error });
      }
      setConfirmDelete(false);
    });
  }

  function handleRecategorizar() {
    if (!recatId) return;
    startTransition(async () => {
      const r = await recategorizarGastosBulkAction(selectedIds, recatId);
      if (r.ok) {
        toast.success(`${r.data.count} gasto${r.data.count === 1 ? "" : "s"} recategorizado${r.data.count === 1 ? "" : "s"}`);
        onClear();
        router.refresh();
      } else {
        toast.error("No se pudo recategorizar", { description: r.error });
      }
      setRecatOpen(false);
      setRecatId("");
    });
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-md shadow-2xl px-4 py-2">
            <div className="flex items-center gap-2 pr-2 border-r border-border">
              <span className="text-sm font-medium tabular-nums">
                {count} seleccionado{count === 1 ? "" : "s"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClear}
                aria-label="Limpiar selección"
                disabled={pending}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecatOpen(true)}
              disabled={pending}
              className="gap-1.5"
            >
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Recategorizar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => !o && !pending && setConfirmDelete(false)}
        title={`¿Eliminar ${count} gasto${count === 1 ? "" : "s"}?`}
        description="Esta acción es permanente y no se puede deshacer. Los gastos seleccionados desaparecerán de todos los reportes."
        variant="destructive"
        confirmLabel="Sí, eliminar todos"
        loading={pending}
        onConfirm={handleDelete}
      />

      <Dialog open={recatOpen} onOpenChange={(o) => !pending && setRecatOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Recategorizar {count} gasto{count === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              Mueve los gastos seleccionados a una nueva categoría. Esto afecta los reportes pero no las facturas ni el código G-XXXX.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={recatId} onValueChange={setRecatId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la nueva categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecatOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={handleRecategorizar}
              disabled={!recatId || pending}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
