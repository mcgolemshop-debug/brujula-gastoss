"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatUSD } from "@/lib/utils";
import {
  semanaDe,
  desplazarSemana,
  etiquetaSemana,
  type Semana,
} from "@/lib/semana";
import type { PagoNomina, User } from "@/types/domain";
import { NominaRow } from "./nomina-row";

interface Props {
  empleados: User[];
  pagos: PagoNomina[];
  tasa: number;
}

export function NominaSemana({ empleados, pagos, tasa }: Props) {
  // Semana seleccionada (default: semana actual). Se calcula en el cliente.
  const [semana, setSemana] = React.useState<Semana | null>(null);

  React.useEffect(() => {
    // Calculamos la semana en el cliente para evitar mismatch de hidratación
    // (new Date() en el server difiere del cliente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSemana(semanaDe(new Date()));
  }, []);

  if (!semana) {
    return (
      <Card className="p-6">
        <div className="h-32 animate-pulse rounded-md bg-secondary/30" />
      </Card>
    );
  }

  const pagosSemana = pagos.filter((p) => p.semana_inicio === semana.inicio);
  const pagadoPorEmpleado = new Map(pagosSemana.map((p) => [p.empleado_id, p]));

  const totalPagadoUsd = pagosSemana.reduce(
    (s, p) => s + Number(p.total_usd),
    0
  );
  const conSalario = empleados.filter((e) => (e.salario_mensual_usd ?? 0) > 0);
  const pendientesCount = conSalario.filter(
    (e) => !pagadoPorEmpleado.has(e.id)
  ).length;

  return (
    <Card className="overflow-hidden">
      {/* Cabecera con navegación de semana */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent shrink-0" />
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              Semana {etiquetaSemana(semana)}
              {pendientesCount > 0 && (
                <span className="text-[10px] uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                  {pendientesCount} por pagar
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {semana.inicio} → {semana.fin} · pagado {formatUSD(totalPagadoUsd)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setSemana((s) => (s ? desplazarSemana(s, -1) : s))}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSemana(semanaDe(new Date()))}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setSemana((s) => (s ? desplazarSemana(s, 1) : s))}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="divide-y divide-border">
        {empleados.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No hay miembros activos en el equipo.
          </div>
        ) : (
          empleados.map((emp) => (
            <NominaRow
              key={emp.id}
              empleado={emp}
              semana={semana}
              pagoExistente={pagadoPorEmpleado.get(emp.id) ?? null}
              tasa={tasa}
            />
          ))
        )}
      </div>

      {/* Total de la semana */}
      {totalPagadoUsd > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-secondary/20">
          <span className="text-sm font-medium">Total pagado esta semana</span>
          <MoneyDisplay
            usd={totalPagadoUsd}
            tasa={tasa}
            align="right"
            size="md"
          />
        </div>
      )}
    </Card>
  );
}
