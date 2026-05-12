"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  Calendar,
  Clock,
  Coins,
  Receipt,
  Store,
  User as UserIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import type { Moneda } from "@/components/shared/money-input";
import { METODOS_PAGO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { User } from "@/types/domain";
import type { LoteGastosInput } from "@/lib/validations/gasto";

interface Props {
  usuarios: User[];
  isAdmin: boolean;
  foto: File | null;
  onFotoChange: (file: File | null) => void;
  moneda: Moneda;
  onMonedaChange: (m: Moneda) => void;
  tasa: number;
}

export function LoteHeader({
  usuarios,
  isAdmin,
  foto,
  onFotoChange,
  moneda,
  onMonedaChange,
  tasa,
}: Props) {
  const { control } = useFormContext<LoteGastosInput>();

  return (
    <Card className="p-4 md:p-5 space-y-4">
      <div>
        <h2 className="font-serif text-lg font-medium tracking-tight">
          Datos compartidos
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Aplican a todos los gastos del lote.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FormField
          control={control}
          name="header.fecha"
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
          control={control}
          name="header.hora"
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
        <FormField
          control={control}
          name="header.metodo_pago"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Método de pago</FormLabel>
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
        {isAdmin && (
          <FormField
            control={control}
            name="header.usuario_id"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  Registrar como
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona persona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          control={control}
          name="header.lugar_compra"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Lugar de compra
                <span className="font-normal text-muted-foreground text-[10px]">
                  opcional
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Supermercado La Estrella, TecnoStore..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="header.numero_factura"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                N° factura
                <span className="font-normal text-muted-foreground text-[10px]">
                  opcional
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="F-12345"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5" />
          Moneda de los precios
          <span className="font-normal text-muted-foreground text-[10px]">
            aplica a todas las filas del lote
          </span>
        </label>
        <div
          className="inline-flex rounded-md border border-border bg-secondary/30 p-0.5"
          role="tablist"
          aria-label="Moneda de los precios del lote"
        >
          {(["Bs", "USD"] as const).map((m) => {
            const active = moneda === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onMonedaChange(m)}
                disabled={!Number.isFinite(tasa) || tasa <= 0}
                className={cn(
                  "px-4 h-9 rounded text-xs font-semibold font-mono tracking-wider transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "USD" ? "$ USD" : "Bs"}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">
          {tasa > 0
            ? `Conversión con tasa actual Bs ${tasa.toFixed(2)} / 1 USD`
            : "Sin tasa actual — solo USD disponible"}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Foto de la factura (compartida)
          <span className="font-normal text-muted-foreground text-[10px] ml-1.5">
            opcional · se adjunta a cada gasto del lote
          </span>
        </label>
        <ImageUpload
          file={foto}
          onChange={onFotoChange}
          maxSizeMB={10}
          hint="JPG, PNG o WebP · máximo 10 MB"
        />
      </div>
    </Card>
  );
}
