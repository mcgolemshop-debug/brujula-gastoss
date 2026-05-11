"use client";

import * as React from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { Bell, Receipt as ReceiptIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatUSD } from "@/lib/utils";
import type { LoteGastosInput } from "@/lib/validations/gasto";

interface Props {
  tasaActual: number;
  foto: File | null;
  isAdmin: boolean;
}

export function LoteResumen({ tasaActual, foto, isAdmin }: Props) {
  const { control } = useFormContext<LoteGastosInput>();
  const rows = useWatch({ control, name: "rows" }) ?? [];

  const fotoPreview = React.useMemo(() => {
    if (!foto) return null;
    return URL.createObjectURL(foto);
  }, [foto]);

  React.useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const totalUsd = rows.reduce((s, r) => {
    const items = Number(r?.items) || 0;
    const precio = Number(r?.precio_unitario_usd) || 0;
    return s + items * precio;
  }, 0);

  const filasConDatos = rows.filter(
    (r) => r?.descripcion?.trim() || Number(r?.precio_unitario_usd) > 0
  ).length;

  const dispararaPush = !isAdmin && totalUsd >= 100;

  return (
    <Card className="p-4 md:p-5 space-y-4 sticky bottom-20 md:bottom-6 z-10 bg-card/95 backdrop-blur-sm shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
            <ReceiptIcon className="h-3.5 w-3.5" />
            Resumen del lote
          </div>
          <div className="mt-1 text-sm">
            <strong className="font-mono">{filasConDatos}</strong> de{" "}
            <strong className="font-mono">{rows.length}</strong> fila
            {rows.length === 1 ? "" : "s"} con datos
          </div>
        </div>
        <MoneyDisplay
          usd={totalUsd}
          tasa={tasaActual}
          size="lg"
          primary="usd"
          align="right"
        />
      </div>

      {fotoPreview && (
        <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoPreview}
            alt="Foto factura compartida"
            className="h-12 w-12 rounded object-cover shrink-0"
          />
          <div className="text-xs text-muted-foreground min-w-0">
            <div className="font-medium text-foreground truncate">
              Factura compartida adjunta
            </div>
            <div>Se asociará a los {filasConDatos} gastos del lote.</div>
          </div>
        </div>
      )}

      {dispararaPush && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
          <Bell className="h-4 w-4 shrink-0" />
          <span>
            Como el total supera {formatUSD(100)}, el admin recibirá una
            notificación.
          </span>
        </div>
      )}
    </Card>
  );
}
