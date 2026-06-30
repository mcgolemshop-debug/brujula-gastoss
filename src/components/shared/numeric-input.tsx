"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface NumericInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  /** Valor numérico actual o undefined si vacío */
  value: number | undefined | null;
  /** Callback con number cuando es válido o undefined si vacío */
  onChange: (value: number | undefined) => void;
  /** "integer" rechaza decimales, "decimal" permite (default) */
  variant?: "integer" | "decimal";
}

/**
 * Input numérico que SÍ permite borrar el valor sin que reaparezca el 0.
 *
 * Mantiene una string local mientras el usuario escribe, y emite `undefined`
 * cuando el campo está vacío (en lugar de coercer a 0). React Hook Form
 * recibe undefined y, si el schema Zod lo requiere, marca error de validación
 * solo al intentar continuar/submit — pero el usuario puede escribir libremente.
 */
export const NumericInput = React.forwardRef<
  HTMLInputElement,
  NumericInputProps
>(
  (
    {
      value,
      onChange,
      variant = "decimal",
      step,
      inputMode,
      onBlur,
      ...props
    },
    ref
  ) => {
    // String local para permitir estados intermedios ("", "0.", "-", "1.")
    const [localValue, setLocalValue] = React.useState<string>(() =>
      value === undefined || value === null ? "" : String(value)
    );

    // Sincronizar si el valor externo cambió de forma que NO coincide con
    // lo que el usuario está escribiendo (ej. reset del form, programmatic set)
    React.useEffect(() => {
      const externalStr =
        value === undefined || value === null ? "" : String(value);
      const localNum = localValue === "" ? NaN : parseFloat(localValue);
      const externalNum =
        value === undefined || value === null ? NaN : Number(value);
      // Si ambos son NaN (vacío) o coinciden numéricamente, no tocar el local
      const sameNumber =
        (isNaN(localNum) && isNaN(externalNum)) || localNum === externalNum;
      if (!sameNumber) {
        setLocalValue(externalStr);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Normalizar coma decimal (teclados es-VE escriben "," donde el HTML
      // number espera ".") y sanitizar a solo dígitos + un punto. Esto evita
      // el bug en móvil donde "8,50" se perdía y el precio quedaba vacío.
      let raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
      const dot = raw.indexOf(".");
      if (dot !== -1) {
        raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, "");
      }
      if (variant === "integer") raw = raw.replace(/\./g, "");
      setLocalValue(raw);

      if (raw === "" || raw === ".") {
        // Estados intermedios válidos durante escritura
        onChange(undefined);
        return;
      }

      let num = parseFloat(raw);
      if (isNaN(num)) {
        onChange(undefined);
        return;
      }
      if (variant === "integer") {
        num = Math.trunc(num);
      }
      onChange(num);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      // Normalizar el formato al salir: "01" → "1", "1." → "1"
      if (localValue !== "" && localValue !== ".") {
        const num = parseFloat(localValue);
        if (!isNaN(num)) {
          const normalized =
            variant === "integer"
              ? String(Math.trunc(num))
              : String(num);
          if (normalized !== localValue) setLocalValue(normalized);
        }
      }
      onBlur?.(e);
    }

    // type="text" + inputMode (no "number"): nos da control total del parsing
    // y evita que el navegador descarte valores con coma en móvil.
    void step;
    return (
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode ?? (variant === "integer" ? "numeric" : "decimal")}
        autoComplete="off"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";
