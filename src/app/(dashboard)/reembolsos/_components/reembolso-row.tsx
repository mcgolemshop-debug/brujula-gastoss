"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Trash2, Loader2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn, getInitials, colorFromName, formatUSD } from "@/lib/utils";
import { METODOS_PAGO } from "@/lib/constants";
import type { MetodoPago, Reembolso } from "@/types/domain";
import {
  marcarPagadoAction,
  eliminarReembolsoAction,
} from "../_actions";
import { toast } from "sonner";

interface Props {
  reembolso: Reembolso;
  isAdmin: boolean;
  tasaActual: number;
}

export function ReembolsoRow({ reembolso, isAdmin, tasaActual }: Props) {
  const router = useRouter();
  const [pagarOpen, setPagarOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [metodo, setMetodo] = React.useState<MetodoPago>("Transferencia");
  const [fecha, setFecha] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [pending, startTransition] = React.useTransition();

  const benef = reembolso.beneficiario;
  const initials = getInitials(benef?.nombre_completo ?? "—");
  const bg = colorFromName(benef?.nombre_completo ?? "—");
  const isPagado = reembolso.estado === "pagado";

  function handleMarcarPagado() {
    startTransition(async () => {
      const r = await marcarPagadoAction(reembolso.id, {
        metodo_pago: metodo,
        fecha_pago: fecha,
      });
      if (r.ok) {
        toast.success("Reembolso pagado", {
          description: `${formatUSD(reembolso.monto_usd)} a ${benef?.nombre_completo}`,
        });
        setPagarOpen(false);
        router.refresh();
      } else {
        toast.error("No se pudo marcar como pagado", { description: r.error });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await eliminarReembolsoAction(reembolso.id);
      if (r.ok) {
        toast.success("Reembolso eliminado");
        router.refresh();
      } else {
        toast.error("No se pudo eliminar", { description: r.error });
      }
      setConfirmDelete(false);
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors",
          isPagado && "opacity-60"
        )}
      >
        <Avatar className="h-9 w-9 ring-1 shrink-0">
          <AvatarFallback
            style={{ background: bg, color: "white", fontSize: 11 }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {benef?.nombre_completo ?? "—"}
            </span>
            {isPagado ? (
              <Badge variant="outline" className="gap-1 text-[10px] py-0">
                <CheckCircle2 className="h-3 w-3" />
                Pagado
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] py-0 border-amber-500/40 text-amber-600 dark:text-amber-400"
              >
                <Clock className="h-3 w-3" />
                Pendiente
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            {reembolso.gasto && (
              <Link
                href={`/gastos/${reembolso.gasto.id}`}
                className="hover:text-foreground inline-flex items-center gap-1 truncate"
              >
                <span className="font-mono">{reembolso.gasto.codigo}</span>
                <span>·</span>
                <span className="truncate">{reembolso.gasto.descripcion}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </Link>
            )}
          </div>
          {reembolso.notas && (
            <div className="text-xs text-muted-foreground italic mt-1 truncate">
              &quot;{reembolso.notas}&quot;
            </div>
          )}
          {isPagado && reembolso.fecha_pago && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Pagado el{" "}
              {format(new Date(reembolso.fecha_pago + "T00:00:00"), "d MMM yyyy", {
                locale: es,
              })}
              {reembolso.metodo_pago_reembolso &&
                ` · ${reembolso.metodo_pago_reembolso}`}
            </div>
          )}
        </div>

        <MoneyDisplay
          usd={reembolso.monto_usd}
          tasa={tasaActual}
          align="right"
          size="sm"
        />

        {isAdmin && (
          <div className="flex items-center gap-0.5 shrink-0">
            {!isPagado && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPagarOpen(true)}
                aria-label="Marcar pagado"
                className="text-muted-foreground hover:text-emerald-600"
                disabled={pending}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Eliminar"
              className="text-muted-foreground hover:text-destructive"
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={pagarOpen}
        onOpenChange={(o) => !pending && setPagarOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar reembolso como pagado</DialogTitle>
            <DialogDescription>
              {benef?.nombre_completo} · {formatUSD(reembolso.monto_usd)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="metodo">Método de pago</Label>
              <Select
                value={metodo}
                onValueChange={(v) => setMetodo(v as MetodoPago)}
              >
                <SelectTrigger id="metodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha de pago</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPagarOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={handleMarcarPagado}
              disabled={pending}
            >
              {pending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => !pending && setConfirmDelete(o)}
        title="¿Eliminar reembolso?"
        description={`Vas a eliminar el registro de reembolso de ${formatUSD(reembolso.monto_usd)} a ${benef?.nombre_completo}. Esta acción no se puede deshacer.`}
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
