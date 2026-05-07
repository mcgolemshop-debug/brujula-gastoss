"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrujulaIcon } from "@/components/brand/brujula-icon";

interface ComingSoonProps {
  title: string;
  description: string;
  phase: "Fase 2" | "Fase 3" | "Fase 4" | "Fase 5";
  features: string[];
}

export function ComingSoon({
  title,
  description,
  phase,
  features,
}: ComingSoonProps) {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="overflow-hidden">
          <div className="relative bg-brand-gradient px-8 py-10 md:px-12 md:py-14 text-brand-cream">
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-gold/10 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
              <BrujulaIcon size={72} variant="default" className="shrink-0" />
              <div className="flex-1 space-y-3 min-w-0">
                <Badge
                  variant="accent"
                  className="bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 backdrop-blur"
                >
                  <Sparkles className="h-3 w-3" />
                  {phase}
                </Badge>
                <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
                  {title}
                </h1>
                <p className="text-brand-cream/80 text-base leading-relaxed max-w-xl">
                  {description}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-8 md:p-12 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Rocket className="h-4 w-4 text-accent" />
              Lo que vas a poder hacer
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {features.map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <span className="font-mono">Fase 1</span> de 5 ·
              <span className="ml-1.5">
                Foundation completada · Trabajando en {phase}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
