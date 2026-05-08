"use client";

import * as React from "react";
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  enrollMfaAction,
  verifyMfaAction,
  unenrollMfaAction,
  listMfaFactorsAction,
} from "../_actions";

type Factor = { id: string; status: string; friendly_name: string | null };

export function DosFaCard() {
  const [factors, setFactors] = React.useState<Factor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [enrollState, setEnrollState] = React.useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [confirmDisable, setConfirmDisable] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const loadFactors = React.useCallback(async () => {
    setLoading(true);
    const r = await listMfaFactorsAction();
    if (r.ok) setFactors(r.data.factors);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFactors();
  }, [loadFactors]);

  const verifiedFactor = factors.find((f) => f.status === "verified");

  function handleEnroll() {
    startTransition(async () => {
      const r = await enrollMfaAction();
      if (r.ok) {
        setEnrollState(r.data);
      } else {
        toast.error("No se pudo iniciar 2FA", { description: r.error });
      }
    });
  }

  function handleVerify() {
    if (!enrollState) return;
    if (!/^\d{6}$/.test(code)) {
      toast.error("El código debe ser de 6 dígitos");
      return;
    }
    startTransition(async () => {
      const r = await verifyMfaAction({
        factorId: enrollState.factorId,
        code,
      });
      if (r.ok) {
        toast.success("2FA activado", {
          description: "A partir del próximo login pedirá código.",
        });
        setEnrollState(null);
        setCode("");
        await loadFactors();
      } else {
        toast.error("Código inválido", { description: r.error });
      }
    });
  }

  function handleCancelEnroll() {
    if (!enrollState) return;
    startTransition(async () => {
      // Si abandona el enroll, lo limpiamos para no dejar factor pending
      await unenrollMfaAction(enrollState.factorId);
      setEnrollState(null);
      setCode("");
      await loadFactors();
    });
  }

  function handleDisable() {
    if (!confirmDisable) return;
    startTransition(async () => {
      const r = await unenrollMfaAction(confirmDisable);
      if (r.ok) {
        toast.success("2FA desactivado");
        setConfirmDisable(null);
        await loadFactors();
      } else {
        toast.error("No se pudo desactivar", { description: r.error });
      }
    });
  }

  async function handleCopySecret() {
    if (!enrollState) return;
    try {
      await navigator.clipboard.writeText(enrollState.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Verificación en dos pasos (2FA)
          </CardTitle>
          <CardDescription>
            Añade un código de 6 dígitos al iniciar sesión. Usa Google
            Authenticator, 1Password o cualquier app TOTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando estado…
            </div>
          ) : verifiedFactor && !enrollState ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">2FA activo</div>
                  <div className="text-xs text-muted-foreground">
                    Se pedirá código en cada inicio de sesión nuevo.
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDisable(verifiedFactor.id)}
                disabled={pending}
              >
                <ShieldOff className="h-4 w-4" />
                Desactivar 2FA
              </Button>
            </>
          ) : enrollState ? (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium mb-1">Paso 1 · Escanea el QR</p>
                <p className="text-xs text-muted-foreground">
                  Abre tu app autenticadora y agrega una nueva cuenta.
                </p>
              </div>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                {/* Supabase devuelve un data URL SVG */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollState.qrCode}
                  alt="QR code 2FA"
                  width={180}
                  height={180}
                  className="block"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  ¿No puedes escanear? Pega esta clave manualmente
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1.5 rounded-md bg-secondary/50 text-xs font-mono break-all">
                    {enrollState.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleCopySecret}
                    aria-label="Copiar"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totp">
                  Paso 2 · Ingresa el código de 6 dígitos
                </Label>
                <Input
                  id="totp"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="font-mono tracking-widest text-center text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEnroll}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="accent"
                  onClick={handleVerify}
                  disabled={pending || code.length !== 6}
                  className="gap-2"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verificar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground bg-info/5 border border-info/20 rounded-lg p-3">
                Sin 2FA, cualquiera con tu contraseña puede entrar a tu cuenta.
                Recomendado para admins.
              </div>
              <Button
                onClick={handleEnroll}
                className="w-full gap-2"
                variant="accent"
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Activar 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDisable}
        onOpenChange={(o) => !pending && !o && setConfirmDisable(null)}
        title="¿Desactivar 2FA?"
        description="A partir del próximo login solo se pedirá tu contraseña. Tu cuenta queda menos protegida."
        variant="destructive"
        confirmLabel="Sí, desactivar"
        loading={pending}
        onConfirm={handleDisable}
      />
    </>
  );
}

