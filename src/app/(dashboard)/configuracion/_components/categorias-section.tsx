"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import type { Categoria } from "@/types/domain";

export function CategoriasSection({
  categorias,
  isAdmin,
}: {
  categorias: Categoria[];
  isAdmin: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-accent" />
          Categorías
        </CardTitle>
        <CardDescription>
          {categorias.length}{" "}
          {categorias.length === 1 ? "categoría activa" : "categorías activas"} ·{" "}
          {isAdmin
            ? "edición disponible próximamente desde aquí"
            : "solo el admin puede editar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border hover:bg-secondary/40"
            >
              <CategoryBadge
                nombre={c.nombre}
                icono={c.icono}
                color={c.color}
                variant="ghost"
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {c.tipo === "variable"
                  ? "Variable"
                  : c.tipo === "fijo"
                  ? "Fijo"
                  : "Activo fijo"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
