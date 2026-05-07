"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Boxes,
  ChartLine,
  ChartPie,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Receipt,
  Sandwich,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  User as UserIcon,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/_actions";
import { searchGlobalAction, type SearchResults } from "@/app/(dashboard)/_search-actions";
import { CategoryBadge } from "@/components/shared/category-badge";
import { ESTADOS_MOBILIARIO } from "@/lib/constants";
import {
  cn,
  colorFromName,
  formatUSD,
  getInitials,
} from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isAdmin: boolean;
}

interface NavPage {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const PAGES: NavPage[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/gastos/nuevo", label: "Nuevo gasto", icon: Plus, shortcut: "N" },
  { href: "/gastos", label: "Gastos", icon: Receipt, shortcut: "G" },
  { href: "/comida", label: "Detalle de comida", icon: Sandwich },
  { href: "/inventario", label: "Inventario", icon: Boxes, shortcut: "I" },
  { href: "/reportes", label: "Reportes", icon: ChartLine, shortcut: "R" },
];

const ADMIN_PAGES: NavPage[] = [
  { href: "/presupuestos", label: "Presupuestos", icon: Target },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/auditoria", label: "Auditoría", icon: ScrollText },
];

export function CommandPalette({
  open,
  onOpenChange,
  isAdmin,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults>({
    gastos: [],
    mobiliario: [],
    personas: [],
  });
  const [searching, setSearching] = React.useState(false);

  // Debounce de búsqueda
  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ gastos: [], mobiliario: [], personas: [] });
      return;
    }
    setSearching(true);
    const handler = setTimeout(async () => {
      try {
        const r = await searchGlobalAction(trimmed);
        setResults(r);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const hasResults =
    results.gastos.length > 0 ||
    results.mobiliario.length > 0 ||
    results.personas.length > 0;
  const showResults = query.trim().length >= 2 && hasResults;
  const showLoading = query.trim().length >= 2 && searching && !hasResults;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Busca gastos, mobiliario, personas o navega..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {showLoading
            ? "Buscando..."
            : query.trim().length >= 2
            ? "Sin resultados."
            : "Empieza a escribir para buscar..."}
        </CommandEmpty>

        {/* Resultados de búsqueda */}
        {results.gastos.length > 0 && (
          <CommandGroup heading="Gastos">
            {results.gastos.map((g) => (
              <CommandItem
                key={g.id}
                value={`gasto-${g.id}-${g.codigo}-${g.descripcion}`}
                onSelect={() => go(`/gastos/${g.id}`)}
              >
                <Receipt className="text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{g.descripcion}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {g.codigo} · {g.fecha}{" "}
                    {g.categoria_nombre && `· ${g.categoria_nombre}`}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {formatUSD(g.total_usd)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.mobiliario.length > 0 && (
          <CommandGroup heading="Mobiliario / Inventario">
            {results.mobiliario.map((m) => {
              const estadoMeta = ESTADOS_MOBILIARIO.find(
                (e) => e.value === m.estado
              );
              return (
                <CommandItem
                  key={m.id}
                  value={`mob-${m.id}-${m.codigo}-${m.descripcion}`}
                  onSelect={() => go(`/inventario`)}
                >
                  <Boxes className="text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {m.descripcion}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {m.codigo}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      estadoMeta?.color === "success" &&
                        "bg-success/10 text-success",
                      estadoMeta?.color === "warning" &&
                        "bg-warning/15 text-warning",
                      estadoMeta?.color === "destructive" &&
                        "bg-destructive/10 text-destructive",
                      estadoMeta?.color === "muted" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {estadoMeta?.label ?? m.estado}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.personas.length > 0 && (
          <CommandGroup heading="Personas">
            {results.personas.map((p) => (
              <CommandItem
                key={p.id}
                value={`pers-${p.id}-${p.nombre_completo}-${p.email}`}
                onSelect={() =>
                  go(isAdmin ? `/equipo` : `/gastos?user=${p.id}`)
                }
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    style={{
                      background: colorFromName(p.nombre_completo),
                      color: "white",
                      fontSize: 9,
                    }}
                  >
                    {getInitials(p.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {p.nombre_completo}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {p.email}
                  </div>
                </div>
                {p.rol === "admin" && (
                  <ShieldCheck className="text-accent" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showResults && <CommandSeparator />}

        {/* Navegación */}
        {!showResults && (
          <>
            <CommandGroup heading="Navegar">
              {PAGES.map((p) => (
                <CommandItem
                  key={p.href}
                  value={`page-${p.label}`}
                  onSelect={() => go(p.href)}
                >
                  <p.icon />
                  <span>{p.label}</span>
                  {p.shortcut && (
                    <CommandShortcut>{p.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
              {isAdmin &&
                ADMIN_PAGES.map((p) => (
                  <CommandItem
                    key={p.href}
                    value={`page-${p.label}`}
                    onSelect={() => go(p.href)}
                  >
                    <p.icon />
                    <span>{p.label}</span>
                    <ShieldCheck className="ml-auto h-3 w-3 text-accent" />
                  </CommandItem>
                ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Acciones rápidas">
              <CommandItem
                value="action-perfil"
                onSelect={() => go("/perfil")}
              >
                <UserIcon />
                Mi perfil
              </CommandItem>
              <CommandItem
                value="action-configuracion"
                onSelect={() => go("/configuracion")}
              >
                <Settings />
                Configuración
              </CommandItem>
              <CommandItem
                value="action-ayuda"
                onSelect={() => onOpenChange(false)}
              >
                <CircleHelp />
                Ayuda y atajos
                <CommandShortcut>?</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Tema">
              <CommandItem
                value="theme-light"
                onSelect={() => {
                  setTheme("light");
                  onOpenChange(false);
                }}
              >
                <Sun />
                Tema claro
              </CommandItem>
              <CommandItem
                value="theme-dark"
                onSelect={() => {
                  setTheme("dark");
                  onOpenChange(false);
                }}
              >
                <Moon />
                Tema oscuro
              </CommandItem>
              <CommandItem
                value="theme-system"
                onSelect={() => {
                  setTheme("system");
                  onOpenChange(false);
                }}
              >
                <Monitor />
                Tema sistema
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Sesión">
              <CommandItem
                value="action-signout"
                onSelect={async () => {
                  onOpenChange(false);
                  await signOutAction();
                }}
                className="text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive"
              >
                <LogOut />
                Cerrar sesión
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Footer hint con chart pie icon for visual */}
        {!showResults && query.trim().length === 0 && (
          <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ChartPie className="h-3 w-3" />
              Brújula Markets
            </span>
            <span className="ml-auto flex items-center gap-2 font-mono">
              <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">↑↓</kbd>
              navegar
              <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">↵</kbd>
              ir
              <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">esc</kbd>
              cerrar
            </span>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
