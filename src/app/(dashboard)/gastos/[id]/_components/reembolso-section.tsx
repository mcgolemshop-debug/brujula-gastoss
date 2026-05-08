"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Plus, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearReembolsoAction } from "@/app/(dashboard)/reembolsos/_actions";
import { formatUSD } from "@/lib/utils";
import type { Reembolso } from "@/types/domain";
import { toast } from "sonner";

interface Props {
  gastoId: string;
  totalUsd: number;
  totalBs: number;
  beneficiarioId: string;
  beneficiarioNombre: string;
  reembolsoExistente: Reembolso | null;
  canManage: boolean;
}

export function ReembolsoSection({
  gastoId,
  totalUsd,
  totalBs,
  beneficiarioId,
  beneficiarioNombre,
  reembolsoExistente,
  canManage,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notas, setNotas] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleCrear() {
    startTransition(async () => {
      const r = await crearReembolsoAction({
        gasto_id: gastoId,
        beneficiario_id: beneficiarioId,
        monto_usd: totalUsd,
        monto_bs: totalBs,
        notas: notas || undefined,
      });
      if (r.ok) {
        toast.success("Reembolso registrado", {
          description: `${formatUSD(totalUsd)} pendientes para ${beneficiarioNombre}`,
        });
        setOpen(false);
        setNotas("");
        router.refresh();
      } else {
        toast.error("No se pudo crear", { description: r.error });
      }
    });
  }

  if (reembolsoExistente) {
    const isPagado = reembolsoExistente.estado === "pagado";
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-secondary/20 text-sm">
        <Wallet className="h-4 w-4 text-accent shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium flex items-center gap-2">
            Reembolso registrado
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
          <div className="text-xs text-muted-foreground">
            {beneficiarioNombre} · {formatUSD(reembolsoExistente.monto_usd)}
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/reembolsos">Ver</Link>
        </Button>
      </div>
    );
  }

  if (!canManage) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 w-full md:w-auto"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Pagué con dinero personal · pedir reembolso
      </Button>

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar reembolso</DialogTitle>
            <DialogDescription>
              {beneficiarioNombre} pagó este gasto con dinero personal.
              Quedará pendiente hasta que el admin lo marque como pagado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border border-border bg-secondary/30 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto a reembolsar</span>
              <span className="font-mono font-semibold">
                {formatUSD(totalUsd)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reb-notas">Notas (opcional)</Label>
              <Textarea
                id="reb-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: pagué con mi tarjeta porque la oficina no tenía efectivo"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={handleCrear} disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Crear reembolso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
