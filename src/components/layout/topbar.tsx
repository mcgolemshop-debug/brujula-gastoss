"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NAV_ITEMS } from "./nav-config";
import { useCommandPalette } from "@/components/command-palette/command-palette-provider";

interface TopbarProps {
  user: {
    name: string;
    email: string;
    role: "admin" | "empleado";
    avatarUrl?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const { openCmdK } = useCommandPalette();

  const currentSection = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Brújula</span>
          {currentSection && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-semibold text-foreground">
                {currentSection.label}
              </span>
            </>
          )}
        </div>
        <h1 className="md:hidden font-serif text-lg font-medium truncate">
          {currentSection?.label ?? "Brújula"}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openCmdK}
          className="hidden md:flex gap-3 text-muted-foreground font-normal w-56 lg:w-72 justify-start hover:bg-secondary"
          aria-label="Abrir búsqueda"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left text-xs">
            Buscar gastos, ítems...
          </span>
          <kbd className="ml-auto pointer-events-none text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={openCmdK}
          className="md:hidden"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserMenu
          name={user.name}
          email={user.email}
          role={user.role}
          avatarUrl={user.avatarUrl}
        />
      </div>
    </header>
  );
}
