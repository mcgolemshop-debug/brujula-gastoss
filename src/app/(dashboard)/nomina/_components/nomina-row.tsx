"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/shared/numeric-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyDisplay } from "@/components/shared/money-display";
import {
  cn,
  getInitials,
  colorFromName,
  formatUSD,
  formatBs,
} from "@/lib/utils";
import { METODOS_PAGO } from "@/lib/constants";
import type { MetodoPago, PagoNomina, User } from "@/types/domain";
import type { Semana } from "@/lib/semana";
import { setSalarioAction, registrarPagoNominaAction } from "../_actions";

interface Props {
  empleado: User;
  semana: Semana;
  pagoExistente: PagoNomina | null;
  tasa: number;
}

export function NominaRow({ empleado, semana, pagoExistente, tasa }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const salarioMensual = empleado.salario_mensual_usd ?? 0;
  const semanalBase = salarioMensual > 0 ? salarioMensual / 4 : 0;
  const initials = getInitials(empleado.nombre_completo);
  const bg = colorFromName(empleado.nombre_completo);

  // Dialog: editar salario
  const [salarioOpen, setSalarioOpen] = React.useState(false);
  const [salarioInput, setSalarioInput] = React.useState<number | undefined>(
    salarioMensual || undefined
  );

  // Dialog: registrar pago
  const [pagarOpen, setPagarOpen] = React.useState(false);
  const [bonos, setBonos] = React.useState<number | undefined>(undefined);
  const [deducciones, setDeducciones] = React.useState<number | undefined>(
    undefined
  );
  const [metodo, setMetodo] = React.useState<MetodoPago>("Efectivo Bs");
  const [notas, setNotas] = React.useState("");

  const totalPago = semanalBase + (bonos ?? 0) - (deducciones ?? 0);

  function handleGuardarSalario() {
    if (salarioInput === undefined || salarioInput < 0) {
      toast.error("Ingresa un salario válido");
      return;
    }
    startTransition(async () => {
      const r = await setSalarioAction({
        empleado_id: empleado.id,
        salario_mensual_usd: salarioInput,
      });
      if (r.ok) {
        toast.success("Salario actualizado", {
          description: `${empleado.nombre_completo}: ${formatUSD(salarioInput)}/mes`,
        });
        setSalarioOpen(false);
        router.refresh();
      } else {
        toast.error("No se pudo guardar", { description: r.error });
      }
    });
  }

  function handleRegistrarPago() {
    if (totalPago <= 0) {
      toast.error("El total a pagar debe ser mayor a 0");
      return;
    }
    startTransition(async () => {
      const r = await registrarPagoNominaAction({
        empleado_id: empleado.id,
        semana_inicio: semana.inicio,
        semana_fin: semana.fin,
        salario_base_usd: semanalBase,
        bonos_usd: bonos ?? 0,
        deducciones_usd: deducciones ?? 0,
        metodo_pago: metodo,
        notas: notas || undefined,
      });
      if (r.ok) {
        toast.success("Pago registrado", {
          description: `${empleado.nombre_completo} · ${formatUSD(totalPago)} · ${r.data.codigo}`,
        });
        setPagarOpen(false);
        setBonos(undefined);
        setDeducciones(undefined);
        setNotas("");
        router.refresh();
      } else {
        toast.error("No se pudo registrar", { description: r.error });
      }
    });
  }

  const yaPagado = !!pagoExistente;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-4 transition-colors",
          yaPagado ? "bg-emerald-500/5" : "hover:bg-secondary/30"
        )}
      >
        <Avatar className="h-9 w-9 ring-1 shrink-0">
          <AvatarFallback style={{ background: bg, color: "white", fontSize: 11 }}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {empleado.nombre_completo}
            </span>
            {yaPagado && (
              <Badge variant="outline" className="gap-1 text-[10px] py-0">
                <CheckCircle2 className="h-3 w-3" />
                Pagado
              </Badge>
            )}
          </div>
          {salarioMensual > 0 ? (
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>
                Sueldo {formatUSD(salarioMensual)}/mes · semanal{" "}
                <strong className="text-foreground font-mono">
                  {formatUSD(semanalBase)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSalarioInput(salarioMensual || undefined);
                  setSalarioOpen(true);
                }}
                className="inline-flex items-center gap-0.5 text-accent hover:underline"
              >
                <Pencil className="h-2.5 w-2.5" />
                editar
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-0.5">
              {empleado.cargo ?? "Sin salario definido"}
            </div>
          )}
        </div>

        {/* Acción según estado */}
        {yaPagado ? (
          <div className="flex items-center gap-3 shrink-0">
            <MoneyDisplay
              usd={pagoExistente.total_usd}
              tasa={tasa}
              align="right"
              size="sm"
            />
            {pagoExistente.gasto_id && (
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                aria-label="Ver gasto"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href={`/gastos/${pagoExistente.gasto_id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        ) : salarioMensual > 0 ? (
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setMetodo("Efectivo Bs");
              setPagarOpen(true);
            }}
            className="gap-1.5 shrink-0"
          >
            <Wallet className="h-3.5 w-3.5" />
            Pagar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSalarioInput(undefined);
              setSalarioOpen(true);
            }}
            className="shrink-0"
          >
            Definir salario
          </Button>
        )}
      </div>

      {/* Dialog editar salario */}
      <Dialog open={salarioOpen} onOpenChange={(o) => !pending && setSalarioOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salario mensual</DialogTitle>
            <DialogDescription>
              {empleado.nombre_completo} · en dólares. El pago semanal será este
              monto ÷ 4.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Salario mensual (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  $
                </span>
                <NumericInput
                  variant="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7 h-11 font-mono"
                  value={salarioInput}
                  onChange={setSalarioInput}
                  autoFocus
                />
              </div>
              {salarioInput !== undefined && salarioInput > 0 && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  Semanal: {formatUSD(salarioInput / 4)} ·{" "}
                  {formatBs((salarioInput / 4) * tasa)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalarioOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={handleGuardarSalario} disabled={pending}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog registrar pago */}
      <Dialog open={pagarOpen} onOpenChange={(o) => !pending && setPagarOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar a {empleado.nombre_completo}</DialogTitle>
            <DialogDescription>
              Semana {semana.inicio} → {semana.fin}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border border-border bg-secondary/30 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Salario semanal base</span>
              <span className="font-mono font-semibold">{formatUSD(semanalBase)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bonos (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                    +$
                  </span>
                  <NumericInput
                    variant="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8 font-mono"
                    value={bonos}
                    onChange={setBonos}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Deducciones (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                    −$
                  </span>
                  <NumericInput
                    variant="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8 font-mono"
                    value={deducciones}
                    onChange={setDeducciones}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                <SelectTrigger>
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
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: adelanto descontado, bono por meta…"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total a pagar</span>
              <div className="text-right">
                <div className="font-mono font-semibold text-lg">
                  {formatUSD(totalPago)}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {formatBs(totalPago * tasa)} · tasa {tasa.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagarOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={handleRegistrarPago}
              disabled={pending || totalPago <= 0}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Registrar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
