"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatBs, formatUSD } from "@/lib/utils";
import type { Categoria, Presupuesto } from "@/types/domain";
import {
  upsertPresupuestoAction,
  eliminarPresupuestoAction,
} from "../_actions";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categorias: Categoria[];
  presupuestos: Presupuesto[];
  mes: number;
  anio: number;
  tasa: number;
  initial?: { categoria_id?: string; monto_usd?: number };
}

export function PresupuestoDialog({
  open,
  onOpenChange,
  categorias,
  presupuestos,
  mes,
  anio,
  tasa,
  initial,
}: Props) {
  const router = useRouter();
  const [categoriaId, setCategoriaId] = React.useState<string>("");
  const [monto, setMonto] = React.useState<number>(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCategoriaId(initial?.categoria_id ?? "");
      setMonto(initial?.monto_usd ?? 0);
    }
  }, [open, initial]);

  const existing = presupuestos.find((p) => p.categoria_id === categoriaId);
  const isEditing = !!existing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoriaId) {
      toast.error("Selecciona una categoría");
      return;
    }
    setSubmitting(true);
    const result = await upsertPresupuestoAction({
      categoria_id: categoriaId,
      mes,
      anio,
      monto_usd: monto,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      return;
    }
    toast.success(isEditing ? "Presupuesto actualizado" : "Presupuesto creado");
    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!existing) return;
    setSubmitting(true);
    const result = await eliminarPresupuestoAction(existing.id);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo eliminar", { description: result.error });
      return;
    }
    toast.success("Presupuesto eliminado");
    setConfirmDelete(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              {isEditing ? "Editar presupuesto" : "Nuevo presupuesto"}
            </DialogTitle>
            <DialogDescription>
              Tope mensual en USD. Recibirás alerta al 80% y al 100%.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
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

            <div className="space-y-2">
              <Label>Monto USD</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-8 h-12 font-mono text-lg"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
              </div>
              {monto > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  ≈ {formatBs(monto * tasa)} a la tasa actual
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive mr-auto gap-2"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={submitting || !categoriaId}
                className="gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar presupuesto?"
        description={`Se eliminará el tope de ${
          categorias.find((c) => c.id === categoriaId)?.nombre ?? ""
        } para este mes.`}
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </>
  );
}
