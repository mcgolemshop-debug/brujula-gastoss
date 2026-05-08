"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  KeyRound,
  MoreVertical,
  Pencil,
  Plus,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  cn,
  colorFromName,
  formatBs,
  formatUSD,
  getInitials,
} from "@/lib/utils";
import type { User } from "@/types/domain";
import {
  cambiarRolAction,
  enviarRecuperacionAction,
  toggleUsuarioActivoAction,
} from "../_actions";
import { MiembroDialog } from "./miembro-dialog";

interface UserStats {
  userId: string;
  total_usd: number;
  compras: number;
  categoria_favorita: string;
  ultima_compra?: string;
}

interface Props {
  usuarios: User[];
  stats: UserStats[];
  currentUserId: string;
  tasa: number;
}

export function EquipoTable({ usuarios, stats, currentUserId, tasa }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [confirmRol, setConfirmRol] = React.useState<{
    user: User;
    nuevoRol: "admin" | "empleado";
  } | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMiembro, setEditingMiembro] = React.useState<User | null>(
    null
  );

  function openCreate() {
    setEditingMiembro(null);
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditingMiembro(u);
    setDialogOpen(true);
  }

  const statsByUser = new Map(stats.map((s) => [s.userId, s]));
  const totalCompras = stats.reduce((s, x) => s + x.compras, 0);
  const totalUsd = stats.reduce((s, x) => s + x.total_usd, 0);

  function setBusy(id: string, busy: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleToggleActivo(user: User) {
    setBusy(user.id, true);
    const result = await toggleUsuarioActivoAction(user.id, !user.activo);
    setBusy(user.id, false);
    if (result.ok) {
      toast.success(
        user.activo
          ? `${user.nombre_completo} desactivado`
          : `${user.nombre_completo} reactivado`
      );
      router.refresh();
    } else {
      toast.error("No se pudo actualizar", { description: result.error });
    }
  }

  async function handleCambiarRol() {
    if (!confirmRol) return;
    setBusy(confirmRol.user.id, true);
    const result = await cambiarRolAction(
      confirmRol.user.id,
      confirmRol.nuevoRol
    );
    setBusy(confirmRol.user.id, false);
    if (result.ok) {
      toast.success(
        `${confirmRol.user.nombre_completo} ahora es ${confirmRol.nuevoRol}`
      );
      router.refresh();
    } else {
      toast.error("No se pudo cambiar el rol", { description: result.error });
    }
    setConfirmRol(null);
  }

  async function handleResetPassword(user: User) {
    setBusy(user.id, true);
    const result = await enviarRecuperacionAction(user.email);
    setBusy(user.id, false);
    if (result.ok) {
      toast.success("Email de recuperación enviado", {
        description: `Revisa la bandeja de ${user.email}`,
      });
    } else {
      toast.error("No se pudo enviar", { description: result.error });
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar · agregar miembro */}
      <div className="flex items-center justify-end">
        <Button
          variant="accent"
          size="sm"
          onClick={openCreate}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar miembro
        </Button>
      </div>

      {/* Resumen */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Miembros"
              value={usuarios.length.toString()}
              sub={`${usuarios.filter((u) => u.activo).length} activos`}
            />
            <Stat
              label="Admins"
              value={usuarios.filter((u) => u.rol === "admin").length.toString()}
              sub="con acceso completo"
            />
            <Stat
              label="Compras totales"
              value={totalCompras.toString()}
              sub="todo el tiempo"
            />
            <Stat
              label="Total invertido"
              value={formatUSD(totalUsd, { compact: true })}
              sub={formatBs(totalUsd * tasa, { compact: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-3">
        {usuarios.map((u, i) => {
          const s = statsByUser.get(u.id);
          const busy = pending.has(u.id);
          const isMe = u.id === currentUserId;
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Card className={cn(!u.activo && "opacity-60")}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-border">
                      <AvatarFallback
                        style={{
                          background: colorFromName(u.nombre_completo),
                          color: "white",
                        }}
                        className="text-base"
                      >
                        {getInitials(u.nombre_completo)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">
                          {u.nombre_completo}
                        </span>
                        {isMe && (
                          <Badge variant="muted" className="text-[9px]">
                            Tú
                          </Badge>
                        )}
                        <Badge
                          variant={u.rol === "admin" ? "accent" : "muted"}
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {u.rol === "admin" ? "Admin" : "Empleado"}
                        </Badge>
                        {!u.activo && (
                          <Badge variant="destructive" className="text-[10px]">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {u.email} · {u.cargo ?? "Sin cargo definido"}
                      </div>
                      {s && (
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground font-mono">
                          <span>
                            <strong className="text-foreground font-semibold">
                              {s.compras}
                            </strong>{" "}
                            compras
                          </span>
                          <span>·</span>
                          <span>
                            <strong className="text-foreground font-semibold">
                              {formatUSD(s.total_usd, { compact: true })}
                            </strong>{" "}
                            invertido
                          </span>
                          {s.categoria_favorita !== "—" && (
                            <>
                              <span>·</span>
                              <span>fav: {s.categoria_favorita}</span>
                            </>
                          )}
                          {s.ultima_compra && (
                            <>
                              <span>·</span>
                              <span>
                                última:{" "}
                                {format(parseISO(s.ultima_compra), "d MMM", {
                                  locale: es,
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.activo}
                          disabled={busy || isMe}
                          onCheckedChange={() => handleToggleActivo(u)}
                          aria-label={u.activo ? "Desactivar" : "Activar"}
                        />
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label="Más acciones"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                            Editar miembro
                          </DropdownMenuItem>
                          {!isMe &&
                            (u.rol === "empleado" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmRol({
                                    user: u,
                                    nuevoRol: "admin",
                                  })
                                }
                              >
                                <ShieldCheck className="h-4 w-4" />
                                Promover a admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmRol({
                                    user: u,
                                    nuevoRol: "empleado",
                                  })
                                }
                              >
                                <ShieldOff className="h-4 w-4" />
                                Degradar a empleado
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(u)}
                          >
                            <KeyRound className="h-4 w-4" />
                            Enviar recuperación
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmRol !== null}
        onOpenChange={(o) => !o && setConfirmRol(null)}
        title={
          confirmRol?.nuevoRol === "admin"
            ? `¿Promover a ${confirmRol.user.nombre_completo}?`
            : `¿Degradar a ${confirmRol?.user.nombre_completo}?`
        }
        description={
          confirmRol?.nuevoRol === "admin"
            ? "Tendrá acceso completo: editar/eliminar gastos de cualquiera, gestionar inventario, presupuestos y equipo."
            : "Pasará a ver solo sus propios gastos. Pierde permisos de admin."
        }
        variant={confirmRol?.nuevoRol === "admin" ? "default" : "destructive"}
        confirmLabel={
          confirmRol?.nuevoRol === "admin" ? "Promover" : "Degradar"
        }
        onConfirm={handleCambiarRol}
      />

      <MiembroDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        miembro={editingMiembro}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </span>
      <div className="font-mono text-2xl font-semibold tabular-nums">
        {value}
      </div>
      {sub && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {sub}
        </span>
      )}
    </div>
  );
}
