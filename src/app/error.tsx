"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, Compass, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive">
          <AlertOctagon className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Algo se rompió
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            Ocurrió un error inesperado
          </h1>
          <p className="text-sm text-muted-foreground">
            Avísale a Orlando si persiste. Mientras tanto, intenta volver a
            cargar la página.
          </p>
          {error.digest && (
            <p className="mt-3 inline-block font-mono text-[10px] text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="accent"
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Compass className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
