"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardContent className="p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-medium tracking-tight">
              No pudimos cargar esta sección
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Hay un problema temporal con la conexión a Supabase o un cálculo
              falló. Intenta de nuevo en unos segundos.
            </p>
            {error.digest && (
              <p className="font-mono text-[10px] text-muted-foreground inline-block bg-muted px-2 py-0.5 rounded mt-2">
                {error.digest}
              </p>
            )}
          </div>
          <Button onClick={() => reset()} variant="accent" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
