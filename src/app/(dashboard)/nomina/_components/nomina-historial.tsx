"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getInitials, colorFromName, formatUSD } from "@/lib/utils";
import { etiquetaSemana } from "@/lib/semana";
import type { PagoNomina } from "@/types/domain";
import { eliminarPagoNominaAction } from "../_actions";

interface Props {
  pagos: PagoNomina[];
  tasa: number;
}

export function NominaHistorial({ pagos, tasa }: Props) {
  const router = useRouter();
  const [toDelete, setToDelete] = React.useState<PagoNomina | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const r = await eliminarPagoNominaAction(toDelete.id);
      if (r.ok) {
        toast.success("Pago eliminado", {
          description: "También se quitó el gasto asociado.",
        });
        router.refresh();
      } else {
        toast.error("No se pudo eliminar", { description: r.error });
      }
      setToDelete(null);
    });
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <History className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-medium">Historial de pagos</h2>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {pagos.length} {pagos.length === 1 ? "pago" : "pagos"}
          </span>
        </div>

        {pagos.length === 0 ? (
          <div className="py-4">
            <EmptyState
              icon={History}
              title="Sin pagos registrados"
              description="Cuando registres un pago de nómina aparecerá en este historial."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pagos.map((p) => {
              const nombre = p.empleado?.nombre_completo ?? "—";
              const initials = getInitials(nombre);
              const bg = colorFromName(nombre);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <Avatar className="h-8 w-8 ring-1 shrink-0">
                    <AvatarFallback
                      style={{ background: bg, color: "white", fontSize: 10 }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{nombre}</div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                      <span>{p.codigo}</span>
                      <span>·</span>
                      <span>
                        semana{" "}
                        {etiquetaSemana({
                          inicio: p.semana_inicio,
                          fin: p.semana_fin,
                        })}
                      </span>
                      {(Number(p.bonos_usd) > 0 ||
                        Number(p.deducciones_usd) > 0) && (
                        <>
                          <span>·</span>
                          <span>
                            base {formatUSD(p.salario_base_usd)}
                            {Number(p.bonos_usd) > 0 &&
                              ` +${formatUSD(p.bonos_usd)}`}
                            {Number(p.deducciones_usd) > 0 &&
                              ` −${formatUSD(p.deducciones_usd)}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <MoneyDisplay
                    usd={p.total_usd}
                    tasa={tasa}
                    align="right"
                    size="sm"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {p.gasto_id && (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Ver gasto"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/gastos/${p.gasto_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setToDelete(p)}
                      aria-label="Eliminar pago"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={pending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && !pending && setToDelete(null)}
        title="¿Eliminar este pago?"
        description={
          toDelete
            ? `Vas a eliminar el pago ${toDelete.codigo} de ${formatUSD(toDelete.total_usd)} a ${toDelete.empleado?.nombre_completo ?? "—"}. También se eliminará el gasto asociado. Esta acción no se puede deshacer.`
            : ""
        }
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
