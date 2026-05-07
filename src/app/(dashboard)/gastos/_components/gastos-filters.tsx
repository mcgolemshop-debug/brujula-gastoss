"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { METODOS_PAGO } from "@/lib/constants";
import type { Categoria, User } from "@/types/domain";

interface Props {
  categorias: Categoria[];
  usuarios: User[];
}

const SORT_OPTIONS = [
  { value: "fecha_desc", label: "Más recientes primero" },
  { value: "fecha_asc", label: "Más antiguos primero" },
  { value: "total_desc", label: "Mayor monto primero" },
  { value: "total_asc", label: "Menor monto primero" },
  { value: "codigo_desc", label: "Código G-XXXX descendente" },
];

export function GastosFilters({ categorias, usuarios }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [search, setSearch] = React.useState(sp.get("q") ?? "");

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (search) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    setSearch("");
    router.replace(pathname, { scroll: false });
  };

  const activeCount = ["cat", "user", "pago", "desde", "hasta"].filter((k) =>
    sp.get(k)
  ).length;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por descripción, código, persona, lugar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={sp.get("sort") ?? "fecha_desc"}
          onValueChange={(v) => setParam("sort", v)}
        >
          <SelectTrigger className="w-56 hidden md:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest pr-1">
          <SlidersHorizontal className="h-3 w-3" />
          Filtros
        </div>

        <Select
          value={sp.get("cat") ?? "all"}
          onValueChange={(v) => setParam("cat", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs gap-2">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sp.get("user") ?? "all"}
          onValueChange={(v) => setParam("user", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs gap-2">
            <SelectValue placeholder="Persona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el equipo</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre_completo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sp.get("pago") ?? "all"}
          onValueChange={(v) => setParam("pago", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs gap-2">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier método</SelectItem>
            {METODOS_PAGO.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="Desde"
          value={sp.get("desde") ?? ""}
          onChange={(e) => setParam("desde", e.target.value)}
          className="w-auto h-8 text-xs"
        />
        <Input
          type="date"
          placeholder="Hasta"
          value={sp.get("hasta") ?? ""}
          onChange={(e) => setParam("hasta", e.target.value)}
          className="w-auto h-8 text-xs"
        />

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 gap-1.5 text-xs"
          >
            <X className="h-3 w-3" />
            Limpiar
            <Badge variant="muted" className="ml-1 text-[9px] h-4 px-1.5">
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
