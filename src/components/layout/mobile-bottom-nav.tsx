"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";

interface MobileBottomNavProps {
  userRole?: "admin" | "empleado";
}

export function MobileBottomNav({ userRole = "admin" }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => item.mobile && (!item.adminOnly || userRole === "admin")
  ).slice(0, 4);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto relative">
        {items.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* FAB central: Nuevo gasto */}
        <Link
          href="/gastos/nuevo"
          aria-label="Nuevo gasto"
          className="relative -mt-6 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-elegant ring-4 ring-background hover:scale-105 active:scale-95 transition-transform shrink-0"
        >
          <Plus className="h-6 w-6" />
        </Link>

        {items.slice(2, 4).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-w-0",
        isActive ? "text-accent" : "text-muted-foreground"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-[10px] font-medium tracking-wide truncate max-w-full px-1">
        {item.label}
      </span>
    </Link>
  );
}
