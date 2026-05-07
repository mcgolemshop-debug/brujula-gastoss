"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  cambiarPasswordSchema,
  type CambiarPasswordInput,
} from "@/lib/validations/perfil";
import { cambiarPasswordAction } from "../_actions";

export function PasswordForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const [show, setShow] = React.useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const form = useForm<CambiarPasswordInput>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { actual: "", nueva: "", confirmar: "" },
  });

  async function onSubmit(values: CambiarPasswordInput) {
    setSubmitting(true);
    const result = await cambiarPasswordAction(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo cambiar", { description: result.error });
      return;
    }
    toast.success("Contraseña actualizada", {
      description: "La próxima vez que entres usa la nueva.",
    });
    form.reset();
  }

  function toggleShow(key: keyof typeof show) {
    setShow((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />
          Cambiar contraseña
        </CardTitle>
        <CardDescription>
          Mínimo 8 caracteres. Se verifica tu contraseña actual antes de
          cambiarla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              name="actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <PasswordInput
                      visible={show.actual}
                      onToggle={() => toggleShow("actual")}
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                name="nueva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        visible={show.nueva}
                        onToggle={() => toggleShow("nueva")}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="confirmar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva</FormLabel>
                    <FormControl>
                      <PasswordInput
                        visible={show.confirmar}
                        onToggle={() => toggleShow("confirmar")}
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-info/5 border border-info/20 rounded-lg p-3">
              <ShieldCheck className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p>
                <strong className="text-info">Tip de seguridad:</strong>{" "}
                combina mayúsculas, números y un símbolo. No uses la misma
                contraseña que en otros sitios.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="accent"
                disabled={submitting || !form.formState.isDirty}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  visible: boolean;
  onToggle: () => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ visible, onToggle, ...props }, ref) => (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        placeholder="••••••••"
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  )
);
PasswordInput.displayName = "PasswordInput";
