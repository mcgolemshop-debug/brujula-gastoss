"use client";

import * as React from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { enviarPushPruebaAction } from "../_actions";

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "default"
  | "subscribed"
  | "subscribing"
  | "unsubscribing";

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function NotifCard() {
  const [status, setStatus] = React.useState<Status>("loading");
  const [pendingTest, startTransition] = React.useTransition();

  const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  React.useEffect(() => {
    let active = true;
    async function init() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/service-worker.js");
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!active) return;
        if (sub) {
          setStatus("subscribed");
        } else if (Notification.permission === "denied") {
          setStatus("denied");
        } else {
          setStatus("default");
        }
      } catch {
        setStatus("unsupported");
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubscribe() {
    if (!VAPID) {
      toast.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      return;
    }
    setStatus("subscribing");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        toast.error("Permiso denegado", {
          description: "Habilita las notificaciones en tu navegador para activarlas.",
        });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(VAPID),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
          user_agent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "No se pudo guardar la suscripción");
      }
      setStatus("subscribed");
      toast.success("Notificaciones activadas", {
        description: "Te avisaremos cuando haya algo importante.",
      });
    } catch (e) {
      setStatus("default");
      toast.error("No se pudo activar", {
        description: e instanceof Error ? e.message : "Intenta de nuevo",
      });
    }
  }

  async function handleUnsubscribe() {
    setStatus("unsubscribing");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("default");
      toast.success("Notificaciones desactivadas");
    } catch (e) {
      setStatus("subscribed");
      toast.error("No se pudo desactivar", {
        description: e instanceof Error ? e.message : "Intenta de nuevo",
      });
    }
  }

  function handleTest() {
    startTransition(async () => {
      const r = await enviarPushPruebaAction();
      if (r.ok) {
        toast.success("Push enviado", {
          description: "Revisa la notificación del sistema.",
        });
      } else {
        toast.error("No se pudo enviar", { description: r.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          Notificaciones push
        </CardTitle>
        <CardDescription>
          Recibe avisos en tu teléfono cuando alguien registre un gasto importante o cambie la tasa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Comprobando…
          </div>
        )}

        {status === "unsupported" && (
          <div className="text-xs text-muted-foreground bg-info/5 border border-info/20 rounded-lg p-3">
            Tu navegador no soporta notificaciones push. Prueba en Chrome o
            Safari recientes (en iOS, instala la app a la pantalla de inicio).
          </div>
        )}

        {status === "denied" && (
          <div className="text-xs text-muted-foreground bg-warn/5 border border-warn/20 rounded-lg p-3">
            Bloqueaste las notificaciones para este sitio. Cámbialo en los
            permisos del navegador (icono del candado en la barra de URL).
          </div>
        )}

        {status === "default" && (
          <Button onClick={handleSubscribe} className="w-full gap-2" variant="accent">
            <Bell className="h-4 w-4" />
            Activar notificaciones
          </Button>
        )}

        {status === "subscribing" && (
          <Button disabled className="w-full gap-2" variant="accent">
            <Loader2 className="h-4 w-4 animate-spin" />
            Activando…
          </Button>
        )}

        {status === "subscribed" && (
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Activadas en este dispositivo</div>
                <div className="text-xs text-muted-foreground">
                  Recibirás avisos del sistema (incluso con la app cerrada).
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleTest}
                disabled={pendingTest}
              >
                {pendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar prueba
              </Button>
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleUnsubscribe}
              >
                <BellOff className="h-4 w-4" />
                Desactivar
              </Button>
            </div>
          </div>
        )}

        {status === "unsubscribing" && (
          <Button disabled variant="ghost" className="w-full gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Desactivando…
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
