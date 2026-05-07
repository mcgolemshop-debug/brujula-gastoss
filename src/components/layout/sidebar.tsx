"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { BrujulaIcon } from "@/components/brand/brujula-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";

interface SidebarProps {
  userRole?: "admin" | "empleado";
}

const COLLAPSED_KEY = "brujula:sidebar:collapsed";

export function Sidebar({ userRole = "admin" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 shrink-0",
        "border-r border-border bg-card",
        "z-30"
      )}
    >
      {/* Logo header */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label="Brújula Markets"
        >
          <BrujulaIcon size={36} className="shrink-0 transition-transform group-hover:rotate-12 duration-500" />
          {!collapsed && mounted && (
            <div className="flex flex-col min-w-0 leading-none">
              <span className="font-serif font-medium text-lg tracking-tight truncate">
                Brújula
              </span>
              <span
                className="font-sans text-[9px] uppercase text-muted-foreground"
                style={{ letterSpacing: "0.4em" }}
              >
                Markets
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nuevo gasto CTA */}
      <div className="px-3 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="accent"
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full gap-2 font-semibold",
                collapsed && "justify-center"
              )}
            >
              <Link href="/gastos/nuevo">
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && "Nuevo gasto"}
              </Link>
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Nuevo gasto</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent rounded-r"
                  transition={{ duration: 0.25 }}
                />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      {/* Footer: collapse toggle */}
      <div className="p-3 border-t border-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className={cn(
            "w-full text-muted-foreground gap-2 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
