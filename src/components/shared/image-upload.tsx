"use client";

import * as React from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, Camera, X, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Archivo actual (controlled) */
  file?: File | null;
  /** Preview URL si ya hay imagen subida */
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  /** Activa input separado de cámara en mobile */
  enableCamera?: boolean;
  className?: string;
  hint?: string;
  uploading?: boolean;
}

export function ImageUpload({
  file,
  previewUrl,
  onChange,
  maxSizeMB = 10,
  enableCamera = true,
  className,
  hint = "JPG, PNG o WebP · máximo " + 10 + " MB",
  uploading = false,
}: ImageUploadProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Genera preview cuando hay file
  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalPreview(null);
  }, [file]);

  const onDrop = React.useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        const r = rejections[0];
        if (r.errors[0]?.code === "file-too-large") {
          setError(`Archivo muy grande (máx ${maxSizeMB} MB)`);
        } else if (r.errors[0]?.code === "file-invalid-type") {
          setError("Tipo de archivo no soportado");
        } else {
          setError(r.errors[0]?.message ?? "Error subiendo archivo");
        }
        return;
      }
      if (accepted[0]) onChange(accepted[0]);
    },
    [maxSizeMB, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      // Formato nativo de cámara iPhone
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    noClick: false,
  });

  const display = localPreview ?? previewUrl;

  if (display) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-border bg-secondary group", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={display}
          alt="Factura"
          className="w-full h-64 object-contain bg-card"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}
        {!uploading && (
          <button
            type="button"
            aria-label="Quitar imagen"
            onClick={() => onChange(null)}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors px-3 py-1.5 text-xs font-medium border border-border shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
            Quitar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors group",
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-secondary/40"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            {isDragActive ? <ImagePlus className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive
                ? "Suelta la foto aquí"
                : "Arrastra la foto o haz click para subir"}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
      </div>

      {/* Botón cámara mobile */}
      {enableCamera && (
        <div className="md:hidden">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            Tomar foto con la cámara
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
