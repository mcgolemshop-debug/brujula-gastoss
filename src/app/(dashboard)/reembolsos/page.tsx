import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reembolsos" };
export const dynamic = "force-dynamic";

export default async function ReembolsosPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <h1 className="font-serif text-2xl font-medium">Reembolsos · DEBUG</h1>
      <p className="text-sm text-muted-foreground">
        Esta es una página trivial de prueba. Si la ves correctamente, el
        problema está en el código real (queries, componentes, etc.). Si sigue
        saliendo el boundary genérico, el problema está en el layout o
        providers de la app.
      </p>
      <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs font-mono">
        Build timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
}
