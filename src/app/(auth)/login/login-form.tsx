"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Fase 1 · Auth simulada — en Fase 2 conectamos a Supabase
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Bienvenido", {
      description: "Auth simulada en Fase 1 · conectaremos Supabase en Fase 2.",
    });
    router.push("/dashboard");
  }

  async function handleMagicLink() {
    toast.info("Magic link estará disponible en Fase 2", {
      description: "Por ahora usa email + contraseña.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="orlando@brujula.local"
            className="pl-10 h-12"
            defaultValue="orlando@brujula.local"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() =>
              toast.info("Reset de contraseña disponible en Fase 2")
            }
          >
            ¿Olvidaste?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pl-10 h-12"
            defaultValue="demo1234"
          />
        </div>
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
        className="w-full h-12 text-base gap-2"
      >
        <Mail className="h-4 w-4" />
        Enviar magic link
      </Button>
    </form>
  );
}
