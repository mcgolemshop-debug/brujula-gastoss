"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Phone, Save, User as UserIcon } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import {
  datosPerfilSchema,
  type DatosPerfilInput,
} from "@/lib/validations/perfil";
import type { User } from "@/types/domain";
import { actualizarDatosPerfilAction } from "../_actions";

export function DatosPersonalesForm({ user }: { user: User }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<DatosPerfilInput>({
    resolver: zodResolver(datosPerfilSchema),
    defaultValues: {
      nombre_completo: user.nombre_completo,
      telefono: user.telefono ?? "",
    },
  });

  async function onSubmit(values: DatosPerfilInput) {
    setSubmitting(true);
    const result = await actualizarDatosPerfilAction({
      nombre_completo: values.nombre_completo,
      telefono: values.telefono,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      return;
    }
    toast.success("Datos actualizados");
    form.reset(values);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-accent" />
          Datos personales
        </CardTitle>
        <CardDescription>
          El correo no se puede cambiar (lo gestiona el admin). Si necesitas
          actualizar el correo, contacta a Orlando.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              name="nombre_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email read-only */}
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo
              </FormLabel>
              <FormControl>
                <Input
                  value={user.email}
                  disabled
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>
                Solo el admin puede cambiar el correo.
              </FormDescription>
            </FormItem>

            <FormField
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Teléfono
                    <span className="font-normal text-muted-foreground text-[10px] ml-1">
                      opcional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+58 414 1234567"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cargo + rol read-only */}
            <div className="grid grid-cols-2 gap-3">
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input value={user.cargo ?? "—"} disabled />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <FormControl>
                  <Input
                    value={user.rol === "admin" ? "Administrador" : "Empleado"}
                    disabled
                  />
                </FormControl>
              </FormItem>
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
                Guardar cambios
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
