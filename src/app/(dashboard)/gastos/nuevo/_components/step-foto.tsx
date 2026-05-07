"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Boxes, Camera } from "lucide-react";
import { ImageUpload } from "@/components/shared/image-upload";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function StepFoto({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const form = useFormContext();
  const vaInventario = form.watch("va_a_inventario") ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight">
          Foto de la factura
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Es opcional pero <strong className="text-foreground font-semibold">muy recomendado</strong>.
          Sirve de respaldo para auditoría.
        </p>
      </div>

      <ImageUpload
        file={file}
        onChange={onChange}
        maxSizeMB={10}
        enableCamera
      />

      {/* Mobiliario toggle */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Label htmlFor="va_inv_switch" className="font-semibold">
                ¿Es un dispositivo o mueble?
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si lo activas, también se registra en el inventario.
              </p>
            </div>
          </div>
          <Switch
            id="va_inv_switch"
            checked={vaInventario}
            onCheckedChange={(v) =>
              form.setValue("va_a_inventario", v, { shouldDirty: true })
            }
          />
        </div>
        {vaInventario && (
          <p className="text-[11px] text-accent font-medium pl-13 flex items-center gap-1">
            <Camera className="h-3 w-3" /> En Fase 3 podrás vincular la foto del
            mobiliario.
          </p>
        )}
      </div>
    </div>
  );
}
