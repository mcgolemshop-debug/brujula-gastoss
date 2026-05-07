"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface ShortcutHandlers {
  onOpenCmdK: () => void;
  onOpenHelp?: () => void;
}

/**
 * Atajos globales:
 * - ⌘/Ctrl + K → command palette
 * - N → nuevo gasto
 * - D → dashboard
 * - G → gastos
 * - I → inventario
 * - R → reportes
 * - ? → ayuda (atajos)
 *
 * Las letras solo aplican cuando NO estamos en un input/textarea/contenteditable.
 */
export function useKeyboardShortcuts({
  onOpenCmdK,
  onOpenHelp,
}: ShortcutHandlers) {
  const router = useRouter();

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInputContext =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true ||
        target?.closest("[role=dialog]") !== null;

      // Cmd+K / Ctrl+K — abrir palette (funciona aunque esté en input)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenCmdK();
        return;
      }

      // ? para ayuda
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isInputContext
      ) {
        e.preventDefault();
        if (onOpenHelp) onOpenHelp();
        return;
      }

      // Letras solo si no estamos escribiendo
      if (isInputContext || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/gastos/nuevo");
          break;
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "g":
          e.preventDefault();
          router.push("/gastos");
          break;
        case "i":
          e.preventDefault();
          router.push("/inventario");
          break;
        case "r":
          e.preventDefault();
          router.push("/reportes");
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenCmdK, onOpenHelp, router]);
}
