"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/shared/numeric-input";
import { MoneyInput } from "@/components/shared/money-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { UNIDADES } from "@/lib/constants";
import { formatBs, formatUSD } from "@/lib/utils";
import type { GastoFormInput } from "@/lib/validations/gasto";

export function StepDetalles({ tasa }: { tasa: number }) {
  const form = useFormContext<GastoFormInput>();
  const items = form.watch("items") || 0;
  const precio = form.watch("precio_unitario_usd") || 0;
  const total = items * precio;
  const totalBs = total * tasa;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight">
          ¿Qué compraste exactamente?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Los detalles importan: cantidad, unidad y precio.
        </p>
      </div>

      <FormField
        name="descripcion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Carne de solomo, mouse Logitech, aceite 20W50..."
                autoFocus
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-3 gap-3">
        <FormField
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <NumericInput
                  variant="decimal"
                  step="0.001"
                  min="0"
                  placeholder="1.5"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>1.5, 500, 2.0...</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="unidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ítems</FormLabel>
              <FormControl>
                <NumericInput
                  variant="integer"
                  min="1"
                  placeholder="1"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>Cuántos compré</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="precio_unitario_usd"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio unitario</FormLabel>
            <FormControl>
              <MoneyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                tasa={tasa}
                defaultMoneda="Bs"
                placeholder="0.00"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="observaciones"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Observaciones
              <span className="font-normal text-muted-foreground text-[10px]">opcional</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Para qué fue, contexto adicional..."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Calculadora live */}
      {total > 0 && (
        <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            <Calculator className="h-3.5 w-3.5" />
            Total a pagar
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-3xl font-semibold tabular-nums">
              {formatUSD(total)}
            </span>
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              {formatBs(totalBs)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            {items} × {formatUSD(precio)} · tasa Bs {tasa.toFixed(2)} / 1 USD
          </p>
        </div>
      )}
    </div>
  );
}
