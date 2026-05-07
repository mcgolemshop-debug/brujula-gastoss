"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  nombre: string;
  icono?: string;
  color?: string;
  variant?: "default" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export function CategoryBadge({
  nombre,
  icono = "MoreHorizontal",
  color = "#6B7280",
  variant = "soft",
  size = "md",
  className,
}: CategoryBadgeProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[icono] ?? Icons.Tag;

  if (variant === "ghost") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-foreground",
          size === "sm" ? "text-xs" : "text-sm",
          className
        )}
      >
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} style={{ color }} />
        {nombre}
      </span>
    );
  }

  if (variant === "default") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-white",
          size === "sm" ? "text-[10px]" : "text-xs",
          className
        )}
        style={{ backgroundColor: color }}
      >
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {nombre}
      </span>
    );
  }

  // soft (default)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium",
        size === "sm" ? "text-[10px]" : "text-xs",
        className
      )}
      style={{
        backgroundColor: `${color}1A`, // 10% opacity hex
        color,
        borderColor: `${color}33`,
      }}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {nombre}
    </span>
  );
}
