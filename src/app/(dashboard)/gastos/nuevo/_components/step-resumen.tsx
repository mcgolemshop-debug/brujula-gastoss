"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, Check, FileImage } from "lucide-react";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import type { Categoria } from "@/types/domain";
import type { GastoFormInput } from "@/lib/validations/gasto";

interface Props {
  categorias: Categoria[];
  tasa: number;
  photo: File | null;
}

export function StepResumen({ categorias, tasa, photo }: Props) {
  const { watch } = useFormContext<GastoFormInput>();
  const data = watch();
  const cat = categorias.find((c) => c.id === data.categoria_id);
  const total = (data.items ?? 0) * (data.precio_unitario_usd ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight">
          Revisa antes de guardar
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verifica que todo esté correcto. Una vez registrado, solo el admin puede editarlo.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border">
        <Row label="Categoría">
          {cat ? (
            <CategoryBadge
              nombre={cat.nombre}
              icono={cat.icono}
              color={cat.color}
              variant="soft"
            />
          ) : (
            <span className="text-muted-foreground">Sin categoría</span>
          )}
        </Row>
        <Row label="Descripción">
          <span className="text-foreground font-medium">{data.descripcion}</span>
        </Row>
        <Row label="Cantidad y unidad">
          <span className="font-mono">
            {data.cantidad} {data.unidad}
          </span>
        </Row>
        <Row label="Ítems × precio unit.">
          <span className="font-mono">
            {data.items} × ${data.precio_unitario_usd}
          </span>
        </Row>
        <Row label="Total a pagar" highlight>
          <MoneyDisplay
            usd={total}
            tasa={tasa}
            size="lg"
            primary="usd"
            align="right"
          />
        </Row>
        <Row label="Fecha y hora">
          <span className="font-mono text-sm">
            {data.fecha &&
              format(new Date(data.fecha + "T00:00:00"), "EEEE, d 'de' MMMM yyyy", {
                locale: es,
              })}{" "}
            · {data.hora}
          </span>
        </Row>
        <Row label="Pago en">
          <span className="font-medium">{data.metodo_pago}</span>
        </Row>
        {data.lugar_compra && <Row label="Lugar">{data.lugar_compra}</Row>}
        {data.numero_factura && <Row label="N° factura">
          <span className="font-mono">{data.numero_factura}</span>
        </Row>}
        {data.observaciones && (
          <Row label="Observaciones">
            <span className="text-muted-foreground italic">
              "{data.observaciones}"
            </span>
          </Row>
        )}
        <Row label="Foto factura">
          {photo ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check className="h-3.5 w-3.5" />
              {photo.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <FileImage className="h-3.5 w-3.5" />
              Sin foto adjunta
            </span>
          )}
        </Row>
        {data.va_a_inventario && (
          <Row label="Inventario">
            <span className="inline-flex items-center gap-1.5 text-accent font-medium">
              <Camera className="h-3.5 w-3.5" />
              Se agregará a /inventario
            </span>
          </Row>
        )}
      </div>

      <div className="text-xs text-muted-foreground bg-info/5 border border-info/20 rounded-lg p-3">
        <strong className="text-info">Nota:</strong> la tasa de cambio actual
        ({tasa.toFixed(2)} Bs/USD) queda guardada con el gasto y no cambia
        después aunque la tasa se actualice. Esto preserva el valor histórico
        en bolívares.
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-4 py-3 ${
        highlight ? "bg-accent/5" : ""
      }`}
    >
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium pt-1 shrink-0">
        {label}
      </span>
      <div className="text-sm text-right min-w-0">{children}</div>
    </div>
  );
}
