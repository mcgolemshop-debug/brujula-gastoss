"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { gastoSchema, type GastoFormInput } from "@/lib/validations/gasto";
import {
  crearGastoAction,
  subirFacturaAction,
  adjuntarComprobanteEscaneadoAction,
} from "../../_actions";
import type { Categoria, User } from "@/types/domain";
import { StepCategoria } from "./step-categoria";
import { StepDetalles } from "./step-detalles";
import { StepPago } from "./step-pago";
import { StepFoto } from "./step-foto";
import { StepResumen } from "./step-resumen";

const STEPS = [
  { key: "categoria", label: "Categoría" },
  { key: "detalles", label: "Detalles" },
  { key: "pago", label: "Pago" },
  { key: "foto", label: "Factura" },
  { key: "resumen", label: "Confirmar" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

const DRAFT_KEY = "brujula:gasto:draft";
const PREFILL_KEY = "catalejo:prefill";

interface Props {
  categorias: Categoria[];
  currentUser: User;
  tasaActual: number;
}

export function MultiStepForm({ categorias, currentUser, tasaActual }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [catalejo, setCatalejo] = React.useState<{
    tmpPath: string | null;
    advertencias: string[];
  } | null>(null);

  const form = useForm<GastoFormInput>({
    resolver: zodResolver(gastoSchema),
    mode: "onChange",
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      usuario_id: currentUser.id,
      categoria_id: "",
      descripcion: "",
      cantidad: 1,
      unidad: "Unidad",
      items: 1,
      precio_unitario_usd: 0,
      metodo_pago: "Efectivo $",
      lugar_compra: "",
      numero_factura: "",
      va_a_inventario: false,
      observaciones: "",
    },
  });

  // Auto-save draft a localStorage
  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Al montar: el PREFILL de Catalejo tiene prioridad sobre el draft.
  React.useEffect(() => {
    // 1. Prefill de Catalejo (comprobante escaneado sin ítems)
    if (searchParams.get("catalejo")) {
      try {
        const raw = sessionStorage.getItem(PREFILL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const p = parsed?.prefill;
          const vigente = Date.now() - (parsed?.creadoEn ?? 0) < 10 * 60 * 1000;
          if (p?.destino === "gasto" && vigente) {
            const v = p.values;
            form.reset({
              ...form.getValues(),
              fecha: v.fecha || form.getValues("fecha"),
              hora: v.hora || form.getValues("hora"),
              usuario_id: currentUser.id,
              cantidad: v.cantidad ?? 1,
              unidad: v.unidad ?? "Unidad",
              items: v.items ?? 1,
              precio_unitario_usd: v.precio_unitario_usd ?? 0,
              metodo_pago: v.metodo_pago || "Efectivo $",
              lugar_compra: v.lugar_compra ?? "",
              numero_factura: v.numero_factura ?? "",
              observaciones: v.observaciones ?? "",
              // descripcion y categoria NUNCA se inventan: las pone el humano
            });
            setCatalejo({
              tmpPath: parsed.tmpPath ?? null,
              advertencias: p.advertencias ?? [],
            });
            sessionStorage.removeItem(PREFILL_KEY);
            return;
          }
        }
      } catch {}
    }

    // 2. Restaurar draft normal
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.usuario_id === currentUser.id) {
          form.reset({ ...parsed });
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = STEPS[stepIndex].key;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  async function next() {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function prev() {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function validateCurrentStep(): Promise<boolean> {
    const fieldsByStep: Record<StepKey, (keyof GastoFormInput)[]> = {
      categoria: ["categoria_id"],
      detalles: ["descripcion", "cantidad", "unidad", "items", "precio_unitario_usd"],
      pago: ["fecha", "hora", "metodo_pago"],
      foto: [], // foto es opcional
      resumen: [],
    };
    const fields = fieldsByStep[currentStep];
    if (fields.length === 0) return true;
    return form.trigger(fields);
  }

  async function handleSubmit(values: GastoFormInput) {
    setSubmitting(true);
    try {
      const result = await crearGastoAction(values);
      if (!result.ok) {
        toast.error("No se pudo registrar el gasto", {
          description: result.error,
        });
        return;
      }

      // Subir foto si hay
      let fotoOk = true;
      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);
        const upload = await subirFacturaAction(result.data.id, formData);
        if (!upload.ok) {
          fotoOk = false;
          toast.warning("Gasto guardado, pero la foto no se subió", {
            description: upload.error,
          });
        }
      } else if (catalejo?.tmpPath) {
        // Adjuntar el comprobante escaneado (ya está en Storage tmp)
        await adjuntarComprobanteEscaneadoAction({
          gastoIds: [result.data.id],
          tmpPath: catalejo.tmpPath,
        }).catch(() => {});
      }

      // limpiar draft
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}

      if (fotoOk) {
        toast.success("Gasto registrado", {
          description: `Código ${result.data.codigo}${photo ? " · foto subida" : ""}`,
          action: {
            label: "Otro más",
            onClick: () => {
              form.reset();
              setPhoto(null);
              setStepIndex(0);
            },
          },
        });
      }
      router.push(`/gastos/${result.data.id}`);
      router.refresh();
    } catch (e) {
      toast.error("Error inesperado", {
        description: e instanceof Error ? e.message : "Algo salió mal",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Banner de Catalejo: datos del pago cargados desde el escaneo */}
        {catalejo && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ScanLine className="h-4 w-4 text-accent shrink-0" />
              Datos del pago cargados ✓ — completa qué se compró y la categoría.
            </div>
            {catalejo.advertencias.length > 0 && (
              <ul className="text-[11px] text-amber-700 dark:text-amber-400 list-disc list-inside">
                {catalejo.advertencias.slice(0, 3).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Paso {stepIndex + 1} de {STEPS.length}
            </span>
            <span className="text-muted-foreground font-mono">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} />
          <div className="hidden md:flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`flex items-center gap-2 text-xs ${
                  i === stepIndex
                    ? "text-foreground font-semibold"
                    : i < stepIndex
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    i < stepIndex
                      ? "bg-accent text-accent-foreground"
                      : i === stepIndex
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden lg:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="p-6 md:p-8 min-h-[420px]"
            >
              {currentStep === "categoria" && (
                <StepCategoria categorias={categorias} />
              )}
              {currentStep === "detalles" && (
                <StepDetalles tasa={tasaActual} />
              )}
              {currentStep === "pago" && <StepPago />}
              {currentStep === "foto" && (
                <StepFoto file={photo} onChange={setPhoto} />
              )}
              {currentStep === "resumen" && (
                <StepResumen
                  categorias={categorias}
                  tasa={tasaActual}
                  photo={photo}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={prev}
            disabled={stepIndex === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Atrás</span>
          </Button>

          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              variant="accent"
              size="lg"
              onClick={next}
              className="gap-2 flex-1 sm:flex-initial"
            >
              <span>Siguiente</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={submitting}
              className="gap-2 flex-1 sm:flex-initial"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Registrar gasto
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
