"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, LogOut, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { signOutAction } from "@/app/(auth)/_actions";
import { cerrarOtrasSesionesAction } from "../_actions";

export function SesionesCard({ ultimoSignin }: { ultimoSignin?: string }) {
  const router = useRouter();
  const [confirmOthers, setConfirmOthers] = React.useState(false);
  const [confirmAll, setConfirmAll] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Detectar device actual
  const [deviceInfo, setDeviceInfo] = React.useState<{
    label: string;
    Icon: typeof Monitor;
  }>({ label: "Este dispositivo", Icon: Monitor });

  React.useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    let label = isMobile ? "Móvil" : "Desktop";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) label += " · Chrome";
    else if (/Firefox/i.test(ua)) label += " · Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) label += " · Safari";
    else if (/Edg/i.test(ua)) label += " · Edge";
    setDeviceInfo({ label, Icon: isMobile ? Smartphone : Monitor });
  }, []);

  async function handleCerrarOtras() {
    setLoading(true);
    const result = await cerrarOtrasSesionesAction();
    setLoading(false);
    if (result.ok) {
      toast.success("Otras sesiones cerradas", {
        description: "Solo este dispositivo sigue activo.",
      });
      setConfirmOthers(false);
    } else {
      toast.error("No se pudo", { description: result.error });
    }
  }

  async function handleCerrarTodas() {
    setLoading(true);
    await signOutAction();
    // signOutAction redirige a /login
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-accent" />
            Sesiones
          </CardTitle>
          <CardDescription>
            Gestiona el acceso a tu cuenta desde otros dispositivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sesión actual */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
              <deviceInfo.Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>Esta sesión</span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-success/15 text-success px-1.5 py-0.5 rounded">
                  Activa
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {deviceInfo.label}
              </div>
              {ultimoSignin && (
                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                  Último ingreso:{" "}
                  {format(new Date(ultimoSignin), "d MMM yyyy, HH:mm", {
                    locale: es,
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-info/5 border border-info/20 rounded-lg p-3">
            Si crees que alguien más entró a tu cuenta, cierra todas las otras
            sesiones y cambia tu contraseña.
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setConfirmOthers(true)}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión en otros dispositivos
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmAll(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Cerrar mi sesión actual
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOthers}
        onOpenChange={setConfirmOthers}
        title="¿Cerrar otras sesiones?"
        description="Tu sesión en este dispositivo sigue activa. Cualquier otro dispositivo donde hayas entrado tendrá que volver a iniciar sesión."
        confirmLabel="Sí, cerrarlas"
        loading={loading}
        onConfirm={handleCerrarOtras}
      />

      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title="¿Cerrar tu sesión actual?"
        description="Volverás a la pantalla de login. No afecta otros dispositivos."
        variant="destructive"
        confirmLabel="Sí, salir"
        loading={loading}
        onConfirm={handleCerrarTodas}
      />
    </>
  );
}
