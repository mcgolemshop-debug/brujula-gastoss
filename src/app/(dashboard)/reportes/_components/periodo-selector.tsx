"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, CalendarDays, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ModoReporte } from "@/lib/periodo";

interface Props {
  modo: ModoReporte;
  /** Mes seleccionado en modo "mes" (YYYY-MM) */
  mes: string;
  /** Año seleccionado en modo "anio" */
  anio: number;
}

const MODOS: { value: ModoReporte; label: string; icon: typeof CalendarDays }[] = [
  { value: "mes", label: "Mes", icon: CalendarDays },
  { value: "anio", label: "Año", icon: CalendarRange },
  { value: "todo", label: "Todo", icon: Layers },
];

export function PeriodoSelector({ modo, mes, anio }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  // Años disponibles: el actual y los 4 anteriores
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  function navegar(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    startTransition(() => {
      router.push(`/reportes?${qs}`, { scroll: false });
    });
  }

  function cambiarModo(nuevo: ModoReporte) {
    if (nuevo === "mes") navegar({ modo: "mes", mes });
    else if (nuevo === "anio") navegar({ modo: "anio", anio: String(anio) });
    else navegar({ modo: "todo" });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Toggle de modo */}
      <div
        className={cn(
          "inline-flex rounded-lg border border-border bg-secondary/30 p-0.5",
          pending && "opacity-60"
        )}
        role="tablist"
        aria-label="Período del reporte"
      >
        {MODOS.map((m) => {
          const active = modo === m.value;
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => cambiarModo(m.value)}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Selector específico según modo */}
      {modo === "mes" && (
        <Input
          type="month"
          value={mes}
          onChange={(e) =>
            e.target.value && navegar({ modo: "mes", mes: e.target.value })
          }
          className="h-9 w-auto"
          aria-label="Selecciona el mes"
        />
      )}

      {modo === "anio" && (
        <Select
          value={String(anio)}
          onValueChange={(v) => navegar({ modo: "anio", anio: v })}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anios.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {modo === "todo" && (
        <span className="text-xs text-muted-foreground">
          Todos los gastos registrados en el sistema
        </span>
      )}
    </div>
  );
}
