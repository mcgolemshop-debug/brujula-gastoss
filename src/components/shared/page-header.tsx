"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-6 border-b border-border",
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </motion.div>
  );
}
