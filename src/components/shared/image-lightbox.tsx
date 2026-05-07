"use client";

import * as React from "react";
import { Download, ExternalLink, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt: string;
  fileName?: string;
  className?: string;
  thumbClassName?: string;
}

export function ImageLightbox({
  src,
  alt,
  fileName,
  className,
  thumbClassName,
}: ImageLightboxProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border bg-secondary/40 transition-colors hover:border-accent",
            className
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={cn(
              "w-full h-full object-cover",
              thumbClassName
            )}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm font-medium">
              <ZoomIn className="h-4 w-4" />
              Ampliar
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card" showCloseButton={false}>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative bg-zinc-950 flex items-center justify-center min-h-[400px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-card">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {fileName ?? "Foto factura"}
            </p>
            <p className="text-xs text-muted-foreground">{alt}</p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </a>
            <a
              href={src}
              download={fileName}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
