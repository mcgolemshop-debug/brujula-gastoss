"use client";

import * as React from "react";
import { cn, formatUSD, formatBs } from "@/lib/utils";

interface MoneyDisplayProps {
  usd: number;
  tasa: number;
  /** Cuál mostrar grande */
  primary?: "usd" | "bs";
  /** Tamaño del valor primario */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Compactar números grandes (1.5K, 2.3M) */
  compact?: boolean;
  /** Mostrar el secundario */
  showSecondary?: boolean;
  className?: string;
  align?: "left" | "right" | "center";
}

const SIZE_CLASSES = {
  xs: { primary: "text-xs", secondary: "text-[9px]" },
  sm: { primary: "text-sm", secondary: "text-[10px]" },
  md: { primary: "text-base", secondary: "text-xs" },
  lg: { primary: "text-lg", secondary: "text-xs" },
  xl: { primary: "text-2xl", secondary: "text-sm" },
};

export function MoneyDisplay({
  usd,
  tasa,
  primary = "usd",
  size = "md",
  compact = false,
  showSecondary = true,
  className,
  align = "left",
}: MoneyDisplayProps) {
  const usdStr = formatUSD(usd, { compact });
  const bsStr = formatBs(usd * tasa, { compact });
  const primaryStr = primary === "usd" ? usdStr : bsStr;
  const secondaryStr = primary === "usd" ? bsStr : usdStr;
  const s = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        "flex flex-col leading-tight",
        align === "right" && "items-end",
        align === "center" && "items-center",
        className
      )}
    >
      <span className={cn("font-mono font-semibold tabular-nums", s.primary)}>
        {primaryStr}
      </span>
      {showSecondary && (
        <span
          className={cn("font-mono text-muted-foreground tabular-nums", s.secondary)}
        >
          {secondaryStr}
        </span>
      )}
    </div>
  );
}
