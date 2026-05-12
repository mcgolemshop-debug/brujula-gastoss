"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { NumericInput } from "./numeric-input";

export type Moneda = "USD" | "Bs";

interface MoneyInputProps {
  /** Valor en USD que va al form RHF (siempre USD, sin importar la moneda visible) */
  value: number | undefined | null;
  /** Callback con valor en USD (siempre USD) o undefined si vacío */
  onChange: (usdValue: number | undefined) => void;
  /** Tasa Bs / 1 USD usada para convertir entre monedas en pantalla */
  tasa: number;
  /** Moneda inicial cuando es uncontrolled. Default "Bs" */
  defaultMoneda?: Moneda;
  /** Moneda controlada externamente (caso del lote). Si presente, ignora defaultMoneda */
  moneda?: Moneda;
  /** Callback cuando cambia la moneda (solo si moneda viene como prop) */
  onMonedaChange?: (m: Moneda) => void;
  /** Para integración con RHF */
  onBlur?: () => void;
  name?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Input dual USD/Bs con toggle interno.
 *
 * - El form siempre recibe el valor en USD via onChange.
 * - El usuario puede escribir en cualquiera de las dos monedas y el componente
 *   convierte usando la tasa que recibe como prop.
 * - Si pasas `moneda` como prop, el toggle queda controlado por el padre
 *   (útil en el lote, donde el toggle vive en el header).
 * - Muestra conversión live debajo del input.
 *
 * Convenciones:
 *   - 4 decimales internos para precio_unitario_usd (minimiza drift).
 *   - El display redondea a 2 decimales sin perder precisión interna.
 */
export function MoneyInput({
  value,
  onChange,
  tasa,
  defaultMoneda = "Bs",
  moneda: monedaProp,
  onMonedaChange,
  onBlur,
  name,
  className,
  placeholder,
  disabled,
  autoFocus,
}: MoneyInputProps) {
  const [monedaInterna, setMonedaInterna] = React.useState<Moneda>(
    defaultMoneda
  );
  const moneda = monedaProp ?? monedaInterna;

  const tasaValida = tasa > 0 && Number.isFinite(tasa);
  // Si la tasa no es válida, forzamos USD (sin conversión posible)
  const monedaEfectiva: Moneda = tasaValida ? moneda : "USD";

  function setMoneda(m: Moneda) {
    if (onMonedaChange) {
      onMonedaChange(m);
    } else {
      setMonedaInterna(m);
    }
  }

  // Valor que se muestra en el input según la moneda activa
  // - USD: el valor tal cual del form (es USD)
  // - Bs: valor en USD × tasa
  const valorMostrado =
    value === undefined || value === null
      ? undefined
      : monedaEfectiva === "USD"
      ? value
      : round(value * tasa, 2);

  function handleInputChange(numerico: number | undefined) {
    if (numerico === undefined || Number.isNaN(numerico)) {
      onChange(undefined);
      return;
    }
    if (monedaEfectiva === "USD") {
      // El usuario escribe directamente en USD
      onChange(round(numerico, 4));
    } else {
      // El usuario escribe en Bs → convertimos a USD
      if (!tasaValida) {
        onChange(undefined);
        return;
      }
      const usd = numerico / tasa;
      onChange(round(usd, 4));
    }
  }

  // Texto de conversión live: si está en Bs, mostrar ≈ $X. Si está en USD, ≈ Bs X.
  const conversionText = (() => {
    if (value === undefined || value === null || value === 0) return null;
    if (monedaEfectiva === "USD") {
      const bs = round(value * tasa, 2);
      return `≈ Bs ${formatNumber(bs)}`;
    }
    return `≈ $${formatNumber(round(value, 2))} USD`;
  })();

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-stretch gap-2">
        <MonedaToggle
          moneda={moneda}
          onChange={setMoneda}
          disabled={disabled || !tasaValida}
        />
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
            {monedaEfectiva === "USD" ? "$" : "Bs"}
          </span>
          <NumericInput
            variant="decimal"
            step={monedaEfectiva === "USD" ? "0.01" : "0.01"}
            min="0"
            placeholder={placeholder ?? "0.00"}
            value={valorMostrado}
            onChange={handleInputChange}
            onBlur={onBlur}
            name={name}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              "h-11 font-mono text-base",
              monedaEfectiva === "USD" ? "pl-7" : "pl-9"
            )}
            inputMode="decimal"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] text-muted-foreground font-mono">
          {tasaValida
            ? `tasa Bs ${formatNumber(tasa)} / 1 USD`
            : "Sin tasa actual — solo USD disponible"}
        </p>
        {conversionText && (
          <p className="text-[11px] text-accent font-mono font-medium">
            {conversionText}
          </p>
        )}
      </div>
    </div>
  );
}

function MonedaToggle({
  moneda,
  onChange,
  disabled,
}: {
  moneda: Moneda;
  onChange: (m: Moneda) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-border bg-secondary/30 p-0.5 shrink-0",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      role="tablist"
      aria-label="Moneda del precio"
    >
      {(["Bs", "USD"] as const).map((m) => {
        const active = moneda === m;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !disabled && onChange(m)}
            disabled={disabled}
            className={cn(
              "px-3 h-10 rounded text-xs font-semibold font-mono tracking-wider transition-all",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "USD" ? "$ USD" : "Bs"}
          </button>
        );
      })}
    </div>
  );
}

function round(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
