import * as React from "react";
import { cn } from "@/lib/utils";
import { BrujulaIcon } from "./brujula-icon";

interface BrujulaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "light";
  className?: string;
  showTagline?: boolean;
}

const SIZES = {
  sm: { icon: 28, title: "text-base", subtitle: "text-[9px]", gap: "gap-2" },
  md: { icon: 40, title: "text-2xl", subtitle: "text-[10px]", gap: "gap-3" },
  lg: { icon: 64, title: "text-4xl", subtitle: "text-xs", gap: "gap-4" },
  xl: { icon: 96, title: "text-5xl", subtitle: "text-sm", gap: "gap-5" },
};

/**
 * Logotipo de marca: brújula + tipografía "Brújula MARKETS".
 * `vertical` apila el icono encima del texto (default).
 * `horizontal` los pone lado a lado.
 */
export function BrujulaLogo({
  size = "md",
  orientation = "horizontal",
  variant = "default",
  className,
  showTagline = true,
}: BrujulaLogoProps) {
  const s = SIZES[size];
  const titleColor = variant === "light" ? "text-brand-cream" : "text-foreground";
  const subtitleColor = variant === "light" ? "text-brand-cream/70" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center",
        orientation === "vertical" ? "flex-col" : "flex-row",
        s.gap,
        className
      )}
    >
      <BrujulaIcon size={s.icon} variant={variant} />
      {showTagline && (
        <div
          className={cn(
            "flex flex-col",
            orientation === "vertical" ? "items-center" : "items-start"
          )}
        >
          <span
            className={cn(
              "font-serif font-medium leading-none tracking-tight",
              s.title,
              titleColor
            )}
          >
            Brújula
          </span>
          <span
            className={cn(
              "mt-1 font-sans uppercase",
              s.subtitle,
              subtitleColor
            )}
            style={{ letterSpacing: "0.4em" }}
          >
            Markets
          </span>
        </div>
      )}
    </div>
  );
}
