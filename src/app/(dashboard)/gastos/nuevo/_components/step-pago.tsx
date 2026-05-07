"use client";

import * as React from "react";
import { Calendar, Clock, Receipt, Store } from "lucide-react";
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
import { METODOS_PAGO } from "@/lib/constants";

export function StepPago() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight">
          Detalles del pago
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          ¿Cuándo? ¿Dónde? ¿Cómo lo pagaste?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          name="fecha"
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
          name="hora"
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
      </div>

      <FormField
        name="metodo_pago"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Método de pago</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => field.onChange(v)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
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

      <FormField
        name="lugar_compra"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" />
              Lugar de compra
              <span className="font-normal text-muted-foreground text-[10px]">opcional</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Carnicería La Estrella, TecnoStore..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="numero_factura"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              N° de factura
              <span className="font-normal text-muted-foreground text-[10px]">opcional</span>
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
  );
}
