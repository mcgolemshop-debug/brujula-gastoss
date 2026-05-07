"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import type { Categoria } from "@/types/domain";
import { cn } from "@/lib/utils";

export function StepCategoria({ categorias }: { categorias: Categoria[] }) {
  const { setValue, watch, formState } = useFormContext();
  const selected = watch("categoria_id");
  const error = formState.errors.categoria_id?.message as string | undefined;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight">
          ¿Qué tipo de gasto fue?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona la categoría que mejor describe lo que compraste.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categorias.map((cat, i) => {
          const Icon =
            (Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icono] ??
            Icons.Tag;
          const isSelected = selected === cat.id;
          return (
            <motion.button
              key={cat.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                setValue("categoria_id", cat.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "relative flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 text-left transition-all group",
                isSelected
                  ? "border-accent bg-accent/5 shadow-elegant"
                  : "border-border hover:border-accent/40 hover:bg-secondary/40"
              )}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0 w-full">
                <div className="font-semibold text-sm leading-tight">
                  {cat.nombre}
                </div>
                {cat.notas && (
                  <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                    {cat.notas}
                  </div>
                )}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                >
                  <Icons.Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
