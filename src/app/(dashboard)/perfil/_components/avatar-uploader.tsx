"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn, colorFromName, getInitials } from "@/lib/utils";
import type { User } from "@/types/domain";
import {
  eliminarAvatarAction,
  subirAvatarAction,
} from "../_actions";

export function AvatarUploader({ user }: { user: User }) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const onDrop = React.useCallback(
    async (accepted: File[]) => {
      if (!accepted[0]) return;
      await uploadFile(accepted[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noClick: true, // click manejamos por separado
  });

  async function uploadFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await subirAvatarAction(formData);
    setUploading(false);
    if (result.ok) {
      toast.success("Foto actualizada");
      router.refresh();
    } else {
      toast.error("No se pudo subir la foto", { description: result.error });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await eliminarAvatarAction();
    setDeleting(false);
    if (result.ok) {
      toast.success("Foto eliminada");
      setConfirmDelete(false);
      router.refresh();
    } else {
      toast.error("No se pudo eliminar", { description: result.error });
    }
  }

  const initials = getInitials(user.nombre_completo);
  const bgColor = colorFromName(user.nombre_completo);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            Foto de perfil
          </CardTitle>
          <CardDescription>
            JPG, PNG o WebP · máximo 5 MB · Se sincroniza con tu avatar en toda la app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "flex items-center gap-5 p-4 rounded-xl border-2 border-dashed transition-colors",
              isDragActive
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="relative shrink-0">
              <Avatar className="h-24 w-24 ring-4 ring-border">
                {user.avatar_url && (
                  <AvatarImage
                    src={user.avatar_url}
                    alt={user.nombre_completo}
                  />
                )}
                <AvatarFallback
                  style={{ background: bgColor, color: "white" }}
                  className="text-2xl"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm">
                {isDragActive
                  ? "Suelta la foto aquí"
                  : "Arrastra una foto o usa los botones"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) uploadFile(f);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Subir foto
                </Button>

                {/* Cámara móvil */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 md:hidden"
                  disabled={uploading}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Cámara
                </Button>

                {user.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={uploading}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Quitar foto de perfil?"
        description="Volverás a tener tus iniciales como avatar."
        variant="destructive"
        confirmLabel="Sí, quitar"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
