"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getInitials, colorFromName } from "@/lib/utils";
import { signOutAction } from "@/app/(auth)/_actions";

interface UserMenuProps {
  name: string;
  email: string;
  role: "admin" | "empleado";
  avatarUrl?: string | null;
}

export function UserMenu({ name, email, role, avatarUrl }: UserMenuProps) {
  const initials = getInitials(name);
  const bgColor = colorFromName(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-0"
          aria-label="Menú de usuario"
        >
          <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-accent transition-all">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback
              style={{ background: bgColor, color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 p-3 normal-case tracking-normal">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback
              style={{ background: bgColor, color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold truncate text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground truncate">{email}</span>
            <Badge
              variant={role === "admin" ? "accent" : "muted"}
              className="mt-1 self-start text-[10px] uppercase tracking-wider"
            >
              {role === "admin" ? "Administrador" : "Empleado"}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil">
            <User className="h-4 w-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/configuracion">
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <button
            type="submit"
            className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
