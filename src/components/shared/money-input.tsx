"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
 * Mantiene un string buffer local mientras el usuario escribe, así NO se
 * pierden dígitos por el round-trip USD↔Bs (bug previo). Solo se sincroniza
 * desde el value externo cuando hay un reset del form o cambio de moneda.
 *
 * - El form siempre recibe el valor en USD via onChange.
 * - Si pasas `moneda` como prop, el toggle queda controlado por el padre.
 * - Muestra conversión live debajo del input (basado en el USD ya emitido).
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

  // Buffer de string local. Es la fuente de verdad de lo que el usuario ve.
  // Solo se sincroniza desde value/moneda cuando el cambio NO vino de mi propio
  // onChange (ej. reset del form, cambio de moneda).
  const [localStr, setLocalStr] = React.useState<string>(() => {
    if (value === undefined || value === null) return "";
    return monedaEfectiva === "USD"
      ? toDisplayString(value)
      : toDisplayString(round(value * tasa, 2));
  });

  // Sincronización entre value externo y localStr.
  // Solo actuamos si el value externo NO coincide con lo que localStr representa
  // (con tolerancia para evitar loop por el redondeo de 4 decimales).
  React.useEffect(() => {
    const externalUsd =
      value === undefined || value === null ? undefined : Number(value);

    // ¿Qué USD implica mi localStr actualmente?
    const localNum = parseLocal(localStr);
    let myImpliedUsd: number | undefined;
    if (localNum === undefined) {
      myImpliedUsd = undefined;
    } else if (monedaEfectiva === "USD") {
      myImpliedUsd = round(localNum, 4);
    } else if (tasaValida) {
      myImpliedUsd = round(localNum / tasa, 4);
    }

    // Comparar con tolerancia. Si el USD externo coincide aproximadamente con
    // mi implicación, NO toco localStr (el usuario está escribiendo).
    const matches =
      (externalUsd === undefined && myImpliedUsd === undefined) ||
      (externalUsd !== undefined &&
        myImpliedUsd !== undefined &&
        Math.abs(externalUsd - myImpliedUsd) < 0.0005);

    if (!matches) {
      // Cambio externo no derivado de mi escritura → resincronizar display
      const newStr =
        externalUsd === undefined
          ? ""
          : monedaEfectiva === "USD"
          ? toDisplayString(externalUsd)
          : toDisplayString(round(externalUsd * tasa, 2));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalStr(newStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, monedaEfectiva, tasa]);

  function setMoneda(m: Moneda) {
    if (onMonedaChange) {
      onMonedaChange(m);
    } else {
      setMonedaInterna(m);
    }
    // Al cambiar moneda, reset del buffer derivando del value USD actual
    if (value === undefined || value === null) {
      setLocalStr("");
    } else {
      setLocalStr(
        m === "USD"
          ? toDisplayString(value)
          : tasaValida
          ? toDisplayString(round(value * tasa, 2))
          : toDisplayString(value)
      );
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocalStr(raw);

    // Estados intermedios válidos durante escritura
    if (raw === "" || raw === "." || raw === "-" || raw === "-.") {
      onChange(undefined);
      return;
    }

    const num = parseFloat(raw);
    if (Number.isNaN(num)) {
      onChange(undefined);
      return;
    }

    if (monedaEfectiva === "USD") {
      onChange(round(num, 4));
    } else {
      if (!tasaValida) {
        onChange(undefined);
        return;
      }
      onChange(round(num / tasa, 4));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Normalizar formato al salir
    if (localStr !== "" && localStr !== "-" && localStr !== ".") {
      const num = parseFloat(localStr);
      if (!Number.isNaN(num)) {
        const normalized = toDisplayString(num);
        if (normalized !== localStr) setLocalStr(normalized);
      }
    }
    onBlur?.();
  }

  // Texto de conversión live (basado en el value USD ya emitido al form)
  const conversionText = (() => {
    if (value === undefined || value === null || value === 0) return null;
    if (!tasaValida) return null;
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
          <Input
            type="text"
            inputMode="decimal"
            placeholder={placeholder ?? "0.00"}
            value={localStr}
            onChange={handleChange}
            onBlur={handleBlur}
            name={name}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              "h-11 font-mono text-base",
              monedaEfectiva === "USD" ? "pl-7" : "pl-9"
            )}
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

/** Parsea el buffer local a número o undefined si está vacío/parcial */
function parseLocal(s: string): number | undefined {
  if (s === "" || s === "." || s === "-" || s === "-.") return undefined;
  const num = parseFloat(s);
  return Number.isNaN(num) ? undefined : num;
}

function round(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/** String para mostrar en el input (sin separadores, punto decimal) */
function toDisplayString(num: number): string {
  return String(num);
}

/** Formato bonito para conversión live y tasa (con separadores es-VE) */
function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
