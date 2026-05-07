"use client";

import { ArrowRightLeft } from "lucide-react";

export function ExchangeRateBanner({ rate }: { rate: number }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-elegant">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent">
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Tasa actual
        </span>
        <span className="font-mono text-sm font-semibold">
          1 USD = <span className="text-accent">Bs {rate.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
