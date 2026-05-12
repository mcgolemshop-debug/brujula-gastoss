"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Loader2, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  loteGastosSchema,
  type LoteGastosInput,
  type LoteRowInput,
} from "@/lib/validations/gasto";
import { crearLoteGastosAction } from "../../_actions";
import type { Categoria, User } from "@/types/domain";
import type { Moneda } from "@/components/shared/money-input";
import { LoteHeader } from "./lote-header";
import { LoteRow } from "./lote-row";
import { LoteResumen } from "./lote-resumen";

const DRAFT_KEY = "brujula:lote:draft";

const EMPTY_ROW: LoteRowInput = {
  categoria_id: "",
  descripcion: "",
  cantidad: 1,
  unidad: "Unidad",
  items: 1,
  precio_unitario_usd: 0,
  observaciones: "",
  va_a_inventario: false,
  mobiliario_id: null,
};

interface Props {
  categorias: Categoria[];
  currentUser: User;
  usuarios: User[];
  isAdmin: boolean;
  tasaActual: number;
}

export function LoteForm({
  categorias,
  currentUser,
  usuarios,
  isAdmin,
  tasaActual,
}: Props) {
  const router = useRouter();
  const [foto, setFoto] = React.useState<File | null>(null);
  const [moneda, setMoneda] = React.useState<Moneda>("Bs");
  const [submitting, setSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(
    null
  );

  const form = useForm<LoteGastosInput>({
    resolver: zodResolver(loteGastosSchema),
    mode: "onChange",
    defaultValues: {
      header: {
        fecha: new Date().toISOString().slice(0, 10),
        hora: new Date().toTimeString().slice(0, 5),
        usuario_id: currentUser.id,
        metodo_pago: "Efectivo $",
        lugar_compra: "",
        numero_factura: "",
      },
      rows: [{ ...EMPTY_ROW }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rows",
  });

  // Autosave a localStorage
  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        /* noop */
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Restaurar draft al montar
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as LoteGastosInput;
      // Solo restauramos si el usuario_id coincide con el actual (o admin)
      if (
        draft.header?.usuario_id === currentUser.id ||
        currentUser.rol === "admin"
      ) {
        form.reset(draft);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReset() {
    form.reset({
      header: {
        fecha: new Date().toISOString().slice(0, 10),
        hora: new Date().toTimeString().slice(0, 5),
        usuario_id: currentUser.id,
        metodo_pago: "Efectivo $",
        lugar_compra: "",
        numero_factura: "",
      },
      rows: [{ ...EMPTY_ROW }],
    });
    setFoto(null);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Lote reiniciado");
  }

  async function onSubmit(values: LoteGastosInput) {
    if (submitting) return;
    setSubmitting(true);
    setProgress({ done: 0, total: values.rows.length });

    try {
      let fotoFormData: FormData | undefined;
      if (foto) {
        fotoFormData = new FormData();
        fotoFormData.append("file", foto);
      }

      const result = await crearLoteGastosAction(values, fotoFormData);

      if (!result.ok) {
        toast.error("No se pudo guardar el lote", { description: result.error });
        setSubmitting(false);
        setProgress(null);
        return;
      }

      toast.success(
        `${result.data.creados.length} gasto${result.data.creados.length === 1 ? "" : "s"} guardado${result.data.creados.length === 1 ? "" : "s"}`,
        {
          description: `Total: $${result.data.total_usd.toFixed(2)} · ${result.data.creados.map((c) => c.codigo).join(", ")}`,
        }
      );

      localStorage.removeItem(DRAFT_KEY);
      const fecha = values.header.fecha;
      router.push(`/gastos?desde=${fecha}&hasta=${fecha}`);
      router.refresh();
    } catch (e) {
      toast.error("Error inesperado", {
        description: e instanceof Error ? e.message : "Intenta de nuevo",
      });
      setSubmitting(false);
      setProgress(null);
    }
  }

  const rowsCount = fields.length;
  const canAddMore = rowsCount < 20;
  const canRemoveRow = rowsCount > 1;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 pb-24 md:pb-6"
      >
        <LoteHeader
          usuarios={usuarios}
          isAdmin={isAdmin}
          foto={foto}
          onFotoChange={setFoto}
          moneda={moneda}
          onMonedaChange={setMoneda}
          tasa={tasaActual}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 pt-2">
            <h2 className="font-serif text-lg font-medium tracking-tight">
              Gastos del lote
              <span className="ml-2 text-xs text-muted-foreground font-sans font-normal">
                {rowsCount} / 20
              </span>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-muted-foreground"
              disabled={submitting}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {fields.map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18 }}
              >
                <LoteRow
                  index={i}
                  categorias={categorias}
                  canRemove={canRemoveRow}
                  onRemove={() => remove(i)}
                  moneda={moneda}
                  tasa={tasaActual}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {canAddMore && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => append({ ...EMPTY_ROW })}
              disabled={submitting}
            >
              <Plus className="h-4 w-4" />
              Agregar otro gasto
            </Button>
          )}
          {!canAddMore && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Máximo 20 gastos por lote. Si necesitas más, registra otro lote.
            </p>
          )}
        </div>

        <LoteResumen
          tasaActual={tasaActual}
          foto={foto}
          isAdmin={isAdmin}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={submitting}
            className="gap-2 w-full md:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress
                  ? `Guardando ${progress.done} de ${progress.total}…`
                  : "Guardando…"}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Registrar {rowsCount} gasto{rowsCount === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
