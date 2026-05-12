"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import {
  Calculator,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Receipt as ReceiptIcon,
  Save,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/shared/numeric-input";
import { MoneyInput } from "@/components/shared/money-input";
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
import {
  editGastoSchema,
  type EditGastoFormInput,
} from "@/lib/validations/gasto";
import { METODOS_PAGO, UNIDADES } from "@/lib/constants";
import { cn, formatBs, formatUSD } from "@/lib/utils";
import type { Categoria, Gasto } from "@/types/domain";
import { actualizarGastoAction } from "../../../_actions";

interface Props {
  gasto: Gasto;
  categorias: Categoria[];
  isAdmin: boolean;
}

export function EditGastoForm({ gasto, categorias }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditGastoFormInput>({
    resolver: zodResolver(editGastoSchema),
    defaultValues: {
      fecha: gasto.fecha,
      hora: gasto.hora.slice(0, 5),
      categoria_id: gasto.categoria_id,
      descripcion: gasto.descripcion,
      cantidad: gasto.cantidad,
      unidad: gasto.unidad as EditGastoFormInput["unidad"],
      items: gasto.items,
      precio_unitario_usd: gasto.precio_unitario_usd,
      metodo_pago: gasto.metodo_pago,
      lugar_compra: gasto.lugar_compra ?? "",
      numero_factura: gasto.numero_factura ?? "",
      va_a_inventario: gasto.va_a_inventario,
      observaciones: gasto.observaciones ?? "",
    },
  });

  const items = form.watch("items") || 0;
  const precio = form.watch("precio_unitario_usd") || 0;
  const total = items * precio;
  const totalBs = total * gasto.tasa_cambio;
  const vaInventario = form.watch("va_a_inventario") ?? false;

  async function onSubmit(values: EditGastoFormInput) {
    setSubmitting(true);
    const result = await actualizarGastoAction(
      gasto.id,
      values as Parameters<typeof actualizarGastoAction>[1]
    );
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      return;
    }
    toast.success(`${gasto.codigo} actualizado`, {
      description: "Cambios guardados y registrados en auditoría",
    });
    router.push(`/gastos/${gasto.id}`);
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Categoría */}
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <SectionTitle icon={Tag}>Categoría</SectionTitle>
            <FormField
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {categorias.map((cat) => {
                        const Icon =
                          (Icons as unknown as Record<
                            string,
                            Icons.LucideIcon
                          >)[cat.icono] ?? Icons.Tag;
                        const isSelected = field.value === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => field.onChange(cat.id)}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all",
                              isSelected
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/40 hover:bg-secondary/40"
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${cat.color}1A`,
                                color: cat.color,
                              }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-xs truncate">
                              {cat.nombre}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detalles */}
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <SectionTitle icon={ReceiptIcon}>Detalles</SectionTitle>

            <FormField
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                          <SelectValue />
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
                      tasa={gasto.tasa_cambio}
                      defaultMoneda="Bs"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  <Calculator className="h-3.5 w-3.5" />
                  Nuevo total
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-semibold tabular-nums">
                    {formatUSD(total)}
                  </span>
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {formatBs(totalBs)} · tasa Bs {gasto.tasa_cambio.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Pago */}
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <SectionTitle icon={CreditCard}>Pago y origen</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Hora
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="metodo_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METODOS_PAGO.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                name="lugar_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Lugar
                      <span className="font-normal text-muted-foreground text-[10px] ml-1">
                        opcional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="numero_factura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      N° factura
                      <span className="font-normal text-muted-foreground text-[10px] ml-1">
                        opcional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Extras */}
        <Card>
          <CardContent className="p-5 md:p-6 space-y-4">
            <SectionTitle icon={Package}>Extras</SectionTitle>

            <div className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Label
                  htmlFor="va_inv_edit"
                  className="text-sm font-semibold cursor-pointer"
                >
                  ¿Es un dispositivo o mueble?
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si activas, también se registra en inventario.
                </p>
              </div>
              <Switch
                id="va_inv_edit"
                checked={vaInventario}
                onCheckedChange={(v) =>
                  form.setValue("va_a_inventario", v, { shouldDirty: true })
                }
              />
            </div>

            <FormField
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Observaciones
                    <span className="font-normal text-muted-foreground text-[10px] ml-1">
                      opcional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Contexto adicional, recordatorios, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Footer · botones */}
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur-md py-3 -mx-1 px-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/gastos/${gasto.id}`)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={submitting || !form.formState.isDirty}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border">
      <Icon className="h-4 w-4 text-accent" />
      {children}
    </div>
  );
}
