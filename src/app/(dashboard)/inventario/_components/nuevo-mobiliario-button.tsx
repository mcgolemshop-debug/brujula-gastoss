"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/shared/numeric-input";
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
} from "@/components/ui/form";
import {
  mobiliarioSchema,
  type MobiliarioFormInput,
} from "@/lib/validations/mobiliario";
import {
  ESTADOS_MOBILIARIO,
  TIPOS_MOBILIARIO,
  UBICACIONES,
} from "@/lib/constants";
import { crearMobiliarioAction } from "../_actions";

const TIPO_LABELS: Record<string, string> = {
  mobiliario: "Mobiliario",
  dispositivo: "Dispositivo",
  equipo: "Equipo",
  vehiculo: "Vehículo",
  otro: "Otro",
};

export function NuevoMobiliarioButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<MobiliarioFormInput>({
    resolver: zodResolver(mobiliarioSchema),
    defaultValues: {
      tipo: "mobiliario",
      descripcion: "",
      marca_modelo: "",
      serial: "",
      cantidad: 1,
      estado: "buen_estado",
      ubicacion: "Sala Trading",
      precio_compra_usd: 0,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      notas: "",
    },
  });

  async function handleSubmit(values: MobiliarioFormInput) {
    setSubmitting(true);
    const result = await crearMobiliarioAction({
      ...values,
      tipo: values.tipo as MobiliarioFormInput["tipo"],
      estado: values.estado as MobiliarioFormInput["estado"],
    } as never);
    setSubmitting(false);

    if (!result.ok) {
      toast.error("No se pudo crear el ítem", { description: result.error });
      return;
    }
    toast.success("Mobiliario agregado", {
      description: `Código ${result.data.codigo}`,
    });
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar mobiliario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo ítem de inventario</DialogTitle>
          <DialogDescription>
            Mobiliario, dispositivo o equipo de la oficina. El código se
            genera automáticamente.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
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
                        {TIPOS_MOBILIARIO.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
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
                        {ESTADOS_MOBILIARIO.map((e) => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Monitor 24 pulgadas, Silla ergonómica..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                name="marca_modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca / Modelo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Samsung, HP, Office Pro..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SN-..."
                        className="font-mono"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
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
                name="precio_compra_usd"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Precio compra (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                          $
                        </span>
                        <NumericInput
                          variant="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8 font-mono"
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                name="fecha_ingreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha ingreso</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
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
                        {UBICACIONES.map((u) => (
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
            </div>

            <FormField
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notas
                    <span className="font-normal text-muted-foreground text-[10px] ml-1">
                      opcional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles, mantenimiento pendiente, etc."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Agregar al inventario
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
