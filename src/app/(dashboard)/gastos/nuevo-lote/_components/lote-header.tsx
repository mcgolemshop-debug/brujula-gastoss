"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Calendar, Clock, Receipt, Store, User as UserIcon } from "lucide-react";
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
import { METODOS_PAGO } from "@/lib/constants";
import type { User } from "@/types/domain";
import type { LoteGastosInput } from "@/lib/validations/gasto";

interface Props {
  usuarios: User[];
  isAdmin: boolean;
  foto: File | null;
  onFotoChange: (file: File | null) => void;
}

export function LoteHeader({ usuarios, isAdmin, foto, onFotoChange }: Props) {
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
