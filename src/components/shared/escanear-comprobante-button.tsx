"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  Loader2,
  Camera,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UNIDADES, METODOS_PAGO, CATEGORIA_NOMINA } from "@/lib/constants";
import { formatUSD, formatBs } from "@/lib/utils";
import {
  escanearComprobante,
  construirPrefill,
  EscaneoError,
} from "@/lib/ocr";
import type { Prefill } from "@/lib/ocr";
import type { Categoria } from "@/types/domain";

const PREFILL_KEY = "catalejo:prefill";
const LABELS = [
  "Subiendo la foto…",
  "Leyendo el comprobante…",
  "Identificando montos y fecha…",
  "Armando el formulario…",
];

type Estado = "idle" | "leyendo" | "listo" | "error";

interface Props {
  categorias: Categoria[];
  tasa: number;
  usuarioId: string;
  /** "full" = botón grande; "compact" = solo icono + texto corto */
  variante?: "full" | "compact";
  className?: string;
}

export function EscanearComprobanteButton({
  categorias,
  tasa,
  usuarioId,
  variante = "full",
  className,
}: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [estado, setEstado] = React.useState<Estado>("idle");
  const [labelIdx, setLabelIdx] = React.useState(0);
  const [error, setError] = React.useState<{ msg: string; retriable: boolean } | null>(null);
  const [resumen, setResumen] = React.useState<{ prefill: Prefill; texto: string } | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Rotación de labels mientras lee
  React.useEffect(() => {
    if (estado !== "leyendo") return;
    const t = setInterval(() => setLabelIdx((i) => (i + 1) % LABELS.length), 1400);
    return () => clearInterval(t);
  }, [estado]);

  function pick() {
    inputRef.current?.click();
  }

  function cerrar() {
    abortRef.current?.abort();
    setOpen(false);
    setEstado("idle");
    setError(null);
    setResumen(null);
    setLabelIdx(0);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-elegir el mismo archivo
    if (!file) return;

    setOpen(true);
    setEstado("leyendo");
    setError(null);
    setResumen(null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const { extraccion, tmpPath } = await escanearComprobante(file, {
        usuarioId,
        categoriasNombres: categorias
          .filter((c) => c.nombre !== CATEGORIA_NOMINA)
          .map((c) => c.nombre),
        unidades: [...UNIDADES],
        metodos: [...METODOS_PAGO],
        signal: ac.signal,
      });

      const prefill = construirPrefill(extraccion, {
        tasa,
        usuarioId,
        categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
      });

      if (prefill.destino === "ilegible") {
        setEstado("error");
        setError({ msg: "No pude leer este comprobante. Intenta otra foto o regístralo a mano.", retriable: true });
        return;
      }

      // Guardar prefill para que el formulario destino lo lea
      try {
        sessionStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({ v: 1, prefill, tmpPath, creadoEn: Date.now() })
        );
      } catch {
        /* sessionStorage lleno o bloqueado */
      }

      setResumen({ prefill, texto: resumirPrefill(prefill, tasa) });
      setEstado("listo");
    } catch (err) {
      if (ac.signal.aborted) {
        cerrar();
        return;
      }
      const retriable = err instanceof EscaneoError ? err.retriable : false;
      setEstado("error");
      setError({
        msg: err instanceof Error ? err.message : "No se pudo escanear el comprobante",
        retriable,
      });
    }
  }

  function continuar() {
    if (!resumen) return;
    const destino =
      resumen.prefill.destino === "lote" ? "/gastos/nuevo-lote" : "/gastos/nuevo";
    setOpen(false);
    router.push(`${destino}?catalejo=1`);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={onFile}
      />
      <Button
        type="button"
        variant="outline"
        size={variante === "full" ? "lg" : "sm"}
        onClick={pick}
        className={className}
      >
        <ScanLine className="h-4 w-4" />
        {variante === "full" ? "Escanear comprobante" : "Escanear"}
      </Button>

      <Dialog open={open} onOpenChange={(o) => (!o ? cerrar() : setOpen(o))}>
        <DialogContent>
          {estado === "leyendo" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-accent" />
                  Leyendo comprobante
                </DialogTitle>
                <DialogDescription>
                  Esto tarda unos segundos. Puedes cancelar cuando quieras.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-accent shrink-0" />
                <span className="text-sm">{LABELS[labelIdx]}</span>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={cerrar}>
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {estado === "listo" && resumen && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Comprobante leído
                </DialogTitle>
                <DialogDescription>
                  Los datos son sugeridos: revísalos y corrígelos antes de guardar.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
                {resumen.texto}
              </div>
              {resumen.prefill.destino !== "ilegible" &&
                resumen.prefill.advertencias.length > 0 && (
                  <ul className="text-[11px] text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                    {resumen.prefill.advertencias.slice(0, 3).map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
              <DialogFooter>
                <Button variant="outline" onClick={pick}>
                  <Camera className="h-4 w-4" />
                  Otra foto
                </Button>
                <Button variant="accent" onClick={continuar}>
                  Revisar y completar
                </Button>
              </DialogFooter>
            </>
          )}

          {estado === "error" && error && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  No se pudo leer
                </DialogTitle>
                <DialogDescription>{error.msg}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={pick}>
                  <RotateCcw className="h-4 w-4" />
                  Reintentar foto
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    setOpen(false);
                    router.push("/gastos/nuevo");
                  }}
                >
                  <PencilLine className="h-4 w-4" />
                  Registrar manual
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function resumirPrefill(prefill: Prefill, tasa: number): string {
  if (prefill.destino === "lote") {
    const comercio = prefill.meta.comercio ?? "Factura";
    const total = prefill.meta.totalImpresoBs;
    const cuadra = prefill.meta.cuadra ? "✓" : "⚠ revisar";
    return `${comercio} — ${prefill.rows.length} ${prefill.rows.length === 1 ? "ítem" : "ítems"}${
      total != null ? ` — ${formatBs(total)} ${cuadra}` : ""
    }`;
  }
  if (prefill.destino === "gasto") {
    const usd = prefill.values.precio_unitario_usd;
    const bs = prefill.moneda === "Bs" ? usd * tasa : null;
    return `Comprobante de pago — ${bs != null ? formatBs(bs) : formatUSD(usd)}${
      prefill.values.fecha ? ` — ${prefill.values.fecha}` : ""
    }`;
  }
  return "Comprobante leído";
}
