"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useFormContext } from "react-hook-form";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/shared/numeric-input";
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
} from "@/components/ui/form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UNIDADES } from "@/lib/constants";
import { cn, formatUSD } from "@/lib/utils";
import type { Categoria } from "@/types/domain";
import type { LoteGastosInput } from "@/lib/validations/gasto";

interface Props {
  index: number;
  categorias: Categoria[];
  canRemove: boolean;
  onRemove: () => void;
}

export function LoteRow({ index, categorias, canRemove, onRemove }: Props) {
  const { control, watch, formState } = useFormContext<LoteGastosInput>();
  const row = watch(`rows.${index}`);
  const cantidad = Number(row?.cantidad) || 0;
  const items = Number(row?.items) || 0;
  const precio = Number(row?.precio_unitario_usd) || 0;
  const totalFila = items * precio;

  const cat = categorias.find((c) => c.id === row?.categoria_id);
  const IconCat =
    cat &&
    ((Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icono] ??
      Icons.Tag);

  const [expanded, setExpanded] = React.useState(true);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const rowErrors = formState.errors.rows?.[index];
  const hasErrors = !!rowErrors;
  const hasData =
    !!row?.descripcion?.trim() || precio > 0 || cantidad > 0 || !!row?.categoria_id;

  function handleRemoveClick() {
    if (hasData) {
      setConfirmDelete(true);
    } else {
      onRemove();
    }
  }

  return (
    <>
      <Card
        className={cn(
          "p-3 md:p-4 transition-colors",
          hasErrors && "border-destructive/50"
        )}
      >
        {/* Header de la fila — siempre visible */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-mono font-semibold shrink-0">
              {index + 1}
            </div>
            {cat && IconCat && (
              <div
                className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <IconCat className="h-3.5 w-3.5" />
              </div>
            )}
            <span
              className={cn(
                "text-sm font-medium truncate flex-1",
                !row?.descripcion && "text-muted-foreground italic"
              )}
            >
              {row?.descripcion?.trim() || "Nuevo gasto sin descripción"}
            </span>
            {totalFila > 0 && (
              <span className="font-mono text-xs text-accent font-semibold tabular-nums shrink-0">
                {formatUSD(totalFila)}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRemoveClick}
              aria-label={`Eliminar fila ${index + 1}`}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {/* Categoría + descripción */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                control={control}
                name={`rows.${index}.categoria_id`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
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
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`rows.${index}.descripcion`}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Carne de solomo, mouse Logitech..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cantidad · unidad · items · precio */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={control}
                name={`rows.${index}.cantidad`}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`rows.${index}.unidad`}
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
                control={control}
                name={`rows.${index}.items`}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`rows.${index}.precio_unitario_usd`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                          $
                        </span>
                        <NumericInput
                          variant="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7 font-mono"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observaciones */}
            <FormField
              control={control}
              name={`rows.${index}.observaciones`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Observaciones
                    <span className="font-normal text-muted-foreground text-[10px]">
                      opcional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contexto adicional…"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(false)}
        title={`¿Eliminar fila ${index + 1}?`}
        description={
          row?.descripcion?.trim()
            ? `Se eliminará "${row.descripcion}" de este lote. No afecta a las demás filas.`
            : "Se eliminará esta fila del lote."
        }
        variant="destructive"
        confirmLabel="Sí, eliminar"
        onConfirm={() => {
          onRemove();
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
