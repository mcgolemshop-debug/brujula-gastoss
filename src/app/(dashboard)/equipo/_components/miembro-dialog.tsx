"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  crearMiembroSchema,
  editarMiembroSchema,
  cambiarPasswordMiembroSchema,
  type CrearMiembroInput,
  type EditarMiembroInput,
  type CambiarPasswordMiembroInput,
} from "@/lib/validations/equipo";
import type { User } from "@/types/domain";
import {
  actualizarMiembroAction,
  cambiarPasswordMiembroAction,
  crearMiembroAction,
  eliminarMiembroAction,
} from "../_actions";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Si está presente, modo edición; si no, modo creación */
  miembro?: User | null;
  /** ID del usuario actual logueado (para deshabilitar auto-eliminación) */
  currentUserId?: string;
}

export function MiembroDialog({
  open,
  onOpenChange,
  miembro,
  currentUserId,
}: Props) {
  const isEditing = !!miembro;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-accent" />
            {isEditing ? "Editar miembro" : "Nuevo miembro del equipo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cambia datos personales, rol o contraseña. Cada cambio queda registrado en auditoría."
              : "Crea una cuenta para un nuevo trader o admin. Le llegará el email/password que definas — compártelos por canal seguro."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <EditarTabs
            miembro={miembro}
            currentUserId={currentUserId}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <CrearForm onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Crear miembro
// =====================================================================

function CrearForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const form = useForm<CrearMiembroInput>({
    resolver: zodResolver(crearMiembroSchema),
    defaultValues: {
      email: "",
      password: "",
      nombre_completo: "",
      cargo: "Trader",
      rol: "empleado",
    },
  });

  async function onSubmit(values: CrearMiembroInput) {
    setSubmitting(true);
    const result = await crearMiembroAction(values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo crear", { description: result.error });
      // Mostrar errores por campo si vienen
      if (result.fieldErrors?.email) {
        form.setError("email", { message: result.fieldErrors.email[0] });
      }
      return;
    }
    toast.success(`${values.nombre_completo} agregado al equipo`, {
      description: `Comparte el correo y contraseña con la persona.`,
    });
    onClose();
    form.reset();
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre_completo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: María Pérez"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="maria@brujula.local"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Se usará para iniciar sesión. Convención: nombre@brujula.local
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Contraseña inicial
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription>
                La persona puede cambiarla en su perfil después de entrar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            name="cargo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Cargo
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Trader, Asistente..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="rol"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Rol
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="empleado">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="accent"
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Crear miembro
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

// =====================================================================
// Editar miembro (3 tabs: datos, contraseña, eliminar)
// =====================================================================

function EditarTabs({
  miembro,
  currentUserId,
  onClose,
}: {
  miembro: User;
  currentUserId?: string;
  onClose: () => void;
}) {
  const isSelf = miembro.id === currentUserId;
  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="datos">Datos</TabsTrigger>
        <TabsTrigger value="password">Contraseña</TabsTrigger>
        <TabsTrigger
          value="eliminar"
          className="data-[state=active]:text-destructive"
          disabled={isSelf}
        >
          Eliminar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datos" className="pt-4">
        <DatosTab miembro={miembro} isSelf={isSelf} onClose={onClose} />
      </TabsContent>

      <TabsContent value="password" className="pt-4">
        <PasswordTab miembro={miembro} onClose={onClose} />
      </TabsContent>

      <TabsContent value="eliminar" className="pt-4">
        <EliminarTab miembro={miembro} isSelf={isSelf} onClose={onClose} />
      </TabsContent>
    </Tabs>
  );
}

function DatosTab({
  miembro,
  isSelf,
  onClose,
}: {
  miembro: User;
  isSelf: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditarMiembroInput>({
    resolver: zodResolver(editarMiembroSchema),
    defaultValues: {
      email: miembro.email,
      nombre_completo: miembro.nombre_completo,
      cargo: miembro.cargo ?? "",
      rol: miembro.rol,
    },
  });

  async function onSubmit(values: EditarMiembroInput) {
    setSubmitting(true);
    const result = await actualizarMiembroAction(miembro.id, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error });
      if (result.fieldErrors?.email) {
        form.setError("email", { message: result.fieldErrors.email[0] });
      }
      return;
    }
    toast.success("Datos actualizados");
    onClose();
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre_completo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo
              </FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>
                Si cambia, debe usar el nuevo email para iniciar sesión.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            name="cargo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Cargo
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Trader, Asistente..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="rol"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Rol
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  disabled={isSelf}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="empleado">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && (
                  <FormDescription className="text-warning">
                    No puedes cambiar tu propio rol.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
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
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function PasswordTab({
  miembro,
  onClose,
}: {
  miembro: User;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const form = useForm<CambiarPasswordMiembroInput>({
    resolver: zodResolver(cambiarPasswordMiembroSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: CambiarPasswordMiembroInput) {
    setSubmitting(true);
    const result = await cambiarPasswordMiembroAction(miembro.id, values);
    setSubmitting(false);
    if (!result.ok) {
      toast.error("No se pudo cambiar", { description: result.error });
      return;
    }
    toast.success(`Contraseña de ${miembro.nombre_completo} actualizada`, {
      description: "Compártela con la persona por canal seguro.",
    });
    form.reset();
    onClose();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-info/5 border border-info/20 rounded-lg p-3 text-xs">
          <p className="text-foreground">
            Como admin puedes cambiar la contraseña de{" "}
            <strong>{miembro.nombre_completo}</strong> sin necesidad de la
            actual. Después comparte la nueva por WhatsApp o canal seguro.
          </p>
        </div>

        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                    autoFocus
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <p className="text-xs text-muted-foreground">
          Alternativa: si {miembro.nombre_completo.split(" ")[0]} tiene acceso a
          su correo, puedes enviarle un enlace de recuperación desde el menú
          principal del miembro (más seguro).
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="accent"
            disabled={submitting || !form.formState.isDirty}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Cambiar contraseña
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function EliminarTab({
  miembro,
  isSelf,
  onClose,
}: {
  miembro: User;
  isSelf: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  if (isSelf) {
    return (
      <div className="rounded-lg bg-warning/5 border border-warning/30 p-4 text-sm">
        <p className="font-semibold text-warning mb-1">
          No puedes eliminarte a ti mismo
        </p>
        <p className="text-muted-foreground">
          Si necesitas eliminar tu cuenta, pide a otro admin que lo haga, o
          revoca tu rol primero (también requiere otro admin).
        </p>
      </div>
    );
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await eliminarMiembroAction(miembro.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error("No se pudo eliminar", { description: result.error });
      setConfirm(false);
      return;
    }
    toast.success(`${miembro.nombre_completo} eliminado del equipo`);
    setConfirm(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-4 text-sm space-y-2">
        <p className="font-semibold text-destructive flex items-center gap-1.5">
          <Trash2 className="h-4 w-4" />
          Zona peligrosa
        </p>
        <p className="text-muted-foreground">
          Eliminar a <strong>{miembro.nombre_completo}</strong> borra
          permanentemente su cuenta de Supabase Auth + su perfil en la app.
          Esto incluye su avatar y datos personales.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Si tiene gastos registrados</strong>,
          la eliminación se rechaza automáticamente. Para esos casos, mejor
          desactiva al miembro (mantiene histórico) desde la card del equipo.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={deleting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirm(true)}
          disabled={deleting}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar permanentemente
        </Button>
      </DialogFooter>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`¿Eliminar a ${miembro.nombre_completo}?`}
        description="Esta acción es irreversible. Si tiene gastos registrados, será rechazada."
        variant="destructive"
        confirmLabel="Sí, eliminar"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
