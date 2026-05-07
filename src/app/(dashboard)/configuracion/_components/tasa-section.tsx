"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRightLeft, History, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/shared/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { actualizarTasaAction } from "../_actions";
import type { TasaCambio } from "@/types/domain";

const FUENTES = ["BCV", "Paralelo", "Binance P2P", "Manual", "Otro"];

interface Props {
  actual: TasaCambio;
  historico: TasaCambio[];
  isAdmin: boolean;
}

export function TasaSection({ actual, historico, isAdmin }: Props) {
  const router = useRouter();
  const [valor, setValor] = React.useState(actual.valor_bs_por_usd);
  const [fuente, setFuente] = React.useState(actual.fuente);
  const [loading, setLoading] = React.useState(false);

  const cambiada = valor !== actual.valor_bs_por_usd || fuente !== actual.fuente;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await actualizarTasaAction({
      valor_bs_por_usd: valor,
      fuente,
    });
    setLoading(false);
    if (!result.ok) {
      toast.error("No se pudo actualizar", { description: result.error });
      return;
    }
    toast.success("Tasa actualizada", {
      description: `1 USD = Bs ${valor.toFixed(2)} · fuente: ${fuente}`,
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-accent" />
          Tasa de cambio
        </CardTitle>
        <CardDescription>
          Bolívares por 1 dólar. Cada cambio se registra en el histórico (insert-only)
          y aplica a los nuevos gastos. Los gastos viejos conservan su tasa al momento de creación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tasa actual */}
        <div className="rounded-xl bg-secondary/40 border border-border p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Tasa actual
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-4xl font-semibold">
                Bs {actual.valor_bs_por_usd.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">/ 1 USD</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {actual.fuente}
              {" · "}
              {actual.created_at &&
                actual.created_at !== ""
                ? formatDistanceToNow(new Date(actual.created_at), {
                    locale: es,
                    addSuffix: true,
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Form actualización */}
        {isAdmin && (
          <>
            <Separator />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nuevo valor (Bs por 1 USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                      Bs
                    </span>
                    <NumericInput
                      variant="decimal"
                      min="0"
                      step="0.0001"
                      placeholder="36.50"
                      className="pl-10 h-11 font-mono"
                      value={valor}
                      onChange={(v) => setValor(v ?? 0)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <Select value={fuente} onValueChange={setFuente}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUENTES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="accent"
                  disabled={loading || !cambiada}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar nueva tasa
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Histórico */}
        {historico.length > 1 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">
                <History className="h-3.5 w-3.5" />
                Histórico (últimos {historico.length})
              </div>
              <div className="space-y-1.5">
                {historico.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-foreground tabular-nums">
                        Bs {t.valor_bs_por_usd.toFixed(2)}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                          Actual
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {t.fuente} ·{" "}
                      {format(new Date(t.created_at), "d MMM yyyy, HH:mm", {
                        locale: es,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
