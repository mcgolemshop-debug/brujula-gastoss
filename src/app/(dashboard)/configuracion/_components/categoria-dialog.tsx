"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  CATEGORIA_TIPOS,
  COLORES_CATEGORIA,
  ICONOS_CATEGORIA,
  TIPO_LABELS,
  categoriaSchema,
  type CategoriaFormInput,
} from "@/lib/validations/categoria";
import { cn } from "@/lib/utils";
import type { Categoria } from "@/types/domain";
import {
  actualizarCategoriaAction,
  crearCategoriaAction,
} from "../_categorias-actions";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Si está presente, modo edición; si no, modo creación */
  categoria?: Categoria | null;
}

export function CategoriaDialog({ open, onOpenChange, categoria }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const isEditing = !!categoria;

  const form = useForm<CategoriaFormInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? "",
      icono: (categoria?.icono ??
        "Tag") as CategoriaFormInput["icono"],
      color: categoria?.color ?? COLORES_CATEGORIA[0],
      tipo: (categoria?.tipo ?? "variable") as CategoriaFormInput["tipo"],
      notas: categoria?.notas ?? "",
    },
  });

  // Sincronizar al abrir/cambiar categoría
  React.useEffect(() => {
    if (open) {
      form.reset({
        nombre: categoria?.nombre ?? "",
        icono: (categoria?.icono ?? "Tag") as CategoriaFormInput["icono"],
        color: categoria?.color ?? COLORES_CATEGORIA[0],
        tipo: (categoria?.tipo ?? "variable") as CategoriaFormInput["tipo"],
        notas: categoria?.notas ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoria?.id]);

  async function onSubmit(values: CategoriaFormInput) {
    setSubmitting(true);
    const result = isEditing
      ? await actualizarCategoriaAction(categoria.id, values)
      : await crearCategoriaAction(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      return;
    }
    toast.success(
      isEditing
        ? `${values.nombre} actualizada`
        : `${values.nombre} creada`
    );
    onOpenChange(false);
    router.refresh();
  }

  const colorActual = form.watch("color");
  const iconoActual = form.watch("icono");
  const PreviewIcon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[iconoActual] ??
    Icons.Tag;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PreviewIcon className="h-5 w-5" style={{ color: colorActual }} />
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            Esta categoría estará disponible al registrar un nuevo gasto.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Mantenimiento, Marketing, Capacitación..."
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {CATEGORIA_TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <strong>Variable</strong>: gasto puntual ·{" "}
                    <strong>Fijo</strong>: recurrente mensual ·{" "}
                    <strong>Activo fijo</strong>: registra a inventario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color picker */}
            <FormField
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {COLORES_CATEGORIA.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          className={cn(
                            "w-9 h-9 rounded-lg border-2 transition-all",
                            field.value === c
                              ? "border-foreground scale-110 shadow-elegant"
                              : "border-border hover:scale-105"
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Color ${c}`}
                          title={c}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icono picker */}
            <FormField
              name="icono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-[180px] overflow-y-auto p-2 rounded-lg border border-border bg-secondary/20">
                      {ICONOS_CATEGORIA.map((iconName) => {
                        const Icon =
                          (Icons as unknown as Record<
                            string,
                            Icons.LucideIcon
                          >)[iconName] ?? Icons.Tag;
                        const isSelected = field.value === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => field.onChange(iconName)}
                            className={cn(
                              "aspect-square rounded-md flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                            title={iconName}
                            aria-label={iconName}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Para qué se usa esta categoría..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-secondary/30">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Vista previa
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-xs"
                style={{
                  backgroundColor: `${colorActual}1A`,
                  color: colorActual,
                  borderColor: `${colorActual}33`,
                }}
              >
                <PreviewIcon className="h-3.5 w-3.5" />
                {form.watch("nombre") || "Nombre de categoría"}
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
