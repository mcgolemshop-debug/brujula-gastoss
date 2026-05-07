"use client";

import * as React from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Buscar gastos, mobiliario, personas" },
  { keys: ["N"], description: "Registrar nuevo gasto" },
  { keys: ["D"], description: "Ir al dashboard" },
  { keys: ["G"], description: "Ir a gastos" },
  { keys: ["I"], description: "Ir a inventario" },
  { keys: ["R"], description: "Ir a reportes" },
  { keys: ["?"], description: "Mostrar este menú de atajos" },
];

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-accent" />
            Atajos de teclado
          </DialogTitle>
          <DialogDescription>
            Acelera la navegación y registro con estos atajos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-secondary/50"
            >
              <span className="text-sm">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="font-mono text-xs bg-muted border border-border rounded px-2 py-1 min-w-[28px] text-center"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
          Las letras (N, D, G, etc.) solo aplican cuando no estás escribiendo en
          un input. ⌘K funciona siempre.
        </p>
      </DialogContent>
    </Dialog>
  );
}
