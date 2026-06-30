import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { NominaSemana } from "./_components/nomina-semana";
import { NominaHistorial } from "./_components/nomina-historial";
import type { PagoNomina, User } from "@/types/domain";

export const metadata: Metadata = { title: "Nómina" };
export const dynamic = "force-dynamic";

function ErrorPage({ msg }: { msg: string }) {
  return (
    <div className="container max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Equipo"
        title="Nómina"
        description="Hubo un problema cargando esta sección."
      />
      <Card className="p-6 space-y-3 border-destructive/30">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-medium">Error técnico</h2>
        </div>
        <pre className="text-[11px] font-mono bg-secondary/50 border border-border rounded-md p-3 whitespace-pre-wrap break-words">
          {msg}
        </pre>
      </Card>
    </div>
  );
}

export default async function NominaPage() {
  const user = await repo.users.current();
  if (!user) redirect("/login");
  if (user.rol !== "admin") {
    // La nómina es solo para el admin
    redirect("/dashboard");
  }

  let empleados: User[];
  let pagos: PagoNomina[];
  let tasaUsdBs: number;
  try {
    const [users, allPagos, tasa] = await Promise.all([
      repo.users.list(),
      repo.nominas.list(),
      repo.tasaCambio.actual(),
    ]);
    empleados = users.filter((u) => u.activo);
    pagos = allPagos;
    tasaUsdBs = tasa.valor_bs_por_usd;
  } catch (e) {
    return <ErrorPage msg={e instanceof Error ? `${e.name}: ${e.message}` : String(e)} />;
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Equipo"
        title="Nómina"
        description="El sueldo se define mensual en USD; el pago se hace semanal (mensual ÷ 4). Cada pago se registra como gasto."
      />

      <NominaSemana empleados={empleados} pagos={pagos} tasa={tasaUsdBs} />

      <NominaHistorial pagos={pagos} tasa={tasaUsdBs} />
    </div>
  );
}
