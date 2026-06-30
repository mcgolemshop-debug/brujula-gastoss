"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrujulaIcon } from "@/components/brand/brujula-icon";
import { NAV_ITEMS, NUEVO_GASTO_HREF } from "./nav-config";
import { cn } from "@/lib/utils";

interface Props {
  userRole?: "admin" | "empleado";
}

/**
 * Cajón de navegación para móvil/tablet. Da acceso a TODAS las páginas
 * (no solo las 4 del nav inferior). Se abre con el botón hamburguesa del
 * topbar. En desktop no se usa (la sidebar fija cubre la navegación).
 */
export function MobileNavDrawer({ userRole = "admin" }: Props) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-1.5"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 max-w-[80vw] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navegación</SheetTitle>

        {/* Brand header */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b border-border shrink-0">
          <BrujulaIcon size={32} className="shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-serif font-medium text-lg tracking-tight">
              Brújula
            </span>
            <span
              className="font-sans text-[9px] uppercase text-muted-foreground"
              style={{ letterSpacing: "0.4em" }}
            >
              Markets
            </span>
          </div>
        </div>

        {/* CTA Nuevo gasto */}
        <div className="px-3 pt-3 shrink-0">
          <Button
            asChild
            variant="accent"
            className="w-full gap-2 font-semibold"
            onClick={() => setOpen(false)}
          >
            <Link href={NUEVO_GASTO_HREF}>
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Link>
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
