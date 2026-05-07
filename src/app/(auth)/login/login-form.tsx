"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginSchema, type LoginInput } from "@/lib/validations/login";
import { loginAction, magicLinkAction } from "../_actions";

const IS_MOCK = process.env.NEXT_PUBLIC_DATA_SOURCE === "mock";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: IS_MOCK ? "orlando@brujula.local" : "",
      password: IS_MOCK ? "demo1234" : "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const result = await loginAction(values);
    setLoading(false);

    if (!result.ok) {
      toast.error("No se pudo iniciar sesión", { description: result.error });
      return;
    }
    if (IS_MOCK) {
      toast.success("Bienvenido", {
        description: "Auth simulada · datos del Excel",
      });
    } else {
      toast.success("Bienvenido de vuelta");
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Ingresa tu correo primero" });
      return;
    }
    setMagicLinkLoading(true);
    const result = await magicLinkAction({ email });
    setMagicLinkLoading(false);
    if (!result.ok) {
      toast.error("No se pudo enviar el link", { description: result.error });
      return;
    }
    toast.success("Magic link enviado", {
      description: "Revisa tu correo en unos minutos.",
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="orlando@brujula.local"
            className="pl-10 h-12"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() =>
              toast.info("Contacta a Orlando para resetear tu contraseña")
            }
          >
            ¿Olvidaste?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-10 h-12"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 h-12 text-base"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Entrar
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {!IS_MOCK && (
        <>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              o
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="w-full h-12 text-base gap-2"
          >
            {magicLinkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Enviar magic link
          </Button>
        </>
      )}

      {IS_MOCK && (
        <p className="text-[10px] text-center text-muted-foreground bg-warning/5 border border-warning/20 rounded-md p-2">
          Modo <strong className="font-mono text-warning">DATA_SOURCE=mock</strong>{" "}
          · cualquier credencial entra. Cambia a <code>supabase</code> en{" "}
          <code>.env.local</code> tras aplicar migraciones.
        </p>
      )}
    </form>
  );
}
