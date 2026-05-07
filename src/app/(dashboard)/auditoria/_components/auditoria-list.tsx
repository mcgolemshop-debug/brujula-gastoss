"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronDown,
  ChevronRight,
  History,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  cn,
  colorFromName,
  getInitials,
} from "@/lib/utils";
import type { User } from "@/types/domain";

interface AuditEvent {
  id: string;
  tabla: string;
  registro_id: string;
  accion: "crear" | "editar" | "eliminar";
  usuario_id: string | null;
  cambios: { old?: Record<string, unknown>; new?: Record<string, unknown> };
  created_at: string;
  usuario?: User | null;
}

const TABLAS_LABELS: Record<string, string> = {
  gastos: "Gasto",
  mobiliario: "Mobiliario",
  categorias: "Categoría",
  presupuestos: "Presupuesto",
  tasa_cambio: "Tasa de cambio",
};

const ACCION_META = {
  crear: { icon: Plus, color: "success", label: "Creado" },
  editar: { icon: Pencil, color: "warning", label: "Editado" },
  eliminar: { icon: Trash2, color: "destructive", label: "Eliminado" },
} as const;

interface Props {
  items: AuditEvent[];
  usuarios: User[];
}

export function AuditoriaList({ items, usuarios }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const activeFilters = ["tabla", "accion", "usuario"].filter((k) =>
    sp.get(k)
  ).length;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={sp.get("tabla") ?? "all"}
          onValueChange={(v) => setParam("tabla", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs">
            <SelectValue placeholder="Tabla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tablas</SelectItem>
            {Object.entries(TABLAS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sp.get("accion") ?? "all"}
          onValueChange={(v) => setParam("accion", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="crear">Crear</SelectItem>
            <SelectItem value="editar">Editar</SelectItem>
            <SelectItem value="eliminar">Eliminar</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sp.get("usuario") ?? "all"}
          onValueChange={(v) => setParam("usuario", v)}
        >
          <SelectTrigger className="w-auto h-8 text-xs">
            <SelectValue placeholder="Usuario" />
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

        {activeFilters > 0 && (
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
              {activeFilters}
            </Badge>
          </Button>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <Card className="py-4">
          <EmptyState
            icon={ScrollText}
            title="Sin eventos registrados"
            description="Cuando alguien cree, edite o elimine un gasto, inventario, presupuesto o tasa, el evento aparecerá acá."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {items.map((event, i) => {
              const meta = ACCION_META[event.accion];
              const Icon = meta.icon;
              const userName = event.usuario?.nombre_completo ?? "Sistema";
              const isExp = expanded.has(event.id);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(i * 0.02, 0.3),
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(event.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                        meta.color === "success" && "bg-success/10 text-success",
                        meta.color === "warning" && "bg-warning/15 text-warning",
                        meta.color === "destructive" &&
                          "bg-destructive/10 text-destructive"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback
                            style={{
                              background: colorFromName(userName),
                              color: "white",
                              fontSize: 9,
                            }}
                          >
                            {getInitials(userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{userName}</span>
                        <span className="text-muted-foreground">
                          {meta.label.toLowerCase()}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {TABLAS_LABELS[event.tabla] ?? event.tabla}
                        </Badge>
                        {event.cambios?.new &&
                          typeof (event.cambios.new as { codigo?: string })
                            .codigo === "string" && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {(event.cambios.new as { codigo: string }).codigo}
                            </span>
                          )}
                        {event.cambios?.old &&
                          typeof (event.cambios.old as { codigo?: string })
                            .codigo === "string" &&
                          !event.cambios.new && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {(event.cambios.old as { codigo: string }).codigo}
                            </span>
                          )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                        {formatDistanceToNow(new Date(event.created_at), {
                          locale: es,
                          addSuffix: true,
                        })}
                        {" · "}
                        {format(
                          new Date(event.created_at),
                          "d MMM yyyy, HH:mm:ss",
                          { locale: es }
                        )}
                      </div>
                    </div>

                    {isExp ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-secondary/30 border-t border-border"
                      >
                        <div className="px-4 py-3 space-y-3">
                          {event.cambios.old && (
                            <DiffBlock
                              label="Antes"
                              data={event.cambios.old}
                              tone="destructive"
                            />
                          )}
                          {event.cambios.new && (
                            <DiffBlock
                              label={
                                event.accion === "crear" ? "Creado" : "Después"
                              }
                              data={event.cambios.new}
                              tone="success"
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function DiffBlock({
  label,
  data,
  tone,
}: {
  label: string;
  data: Record<string, unknown>;
  tone: "destructive" | "success";
}) {
  // Filtrar campos sensibles / técnicos
  const SKIP = new Set(["created_at", "updated_at"]);
  const entries = Object.entries(data).filter(([k]) => !SKIP.has(k));

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "inline-block text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded",
          tone === "success" && "bg-success/15 text-success",
          tone === "destructive" && "bg-destructive/15 text-destructive"
        )}
      >
        {label}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">{k}:</span>
            <span className="truncate text-foreground">
              {v === null
                ? "null"
                : typeof v === "object"
                ? JSON.stringify(v)
                : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
