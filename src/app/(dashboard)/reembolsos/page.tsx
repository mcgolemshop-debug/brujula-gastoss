import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
// import { ReembolsoRow } from "./_components/reembolso-row"; // ← TEMPORAL: aislando
import { formatUSD, getInitials, colorFromName } from "@/lib/utils";
import type { Reembolso } from "@/types/domain";

export const metadata: Metadata = { title: "Reembolsos" };
export const dynamic = "force-dynamic";

function ErrorPage({ msg }: { msg: string }) {
  return (
    <div className="container max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Caja"
        title="Reembolsos"
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

interface DataResult {
  reembolsos: Reembolso[];
  tasaUsdBs: number;
  totales: Awaited<
    ReturnType<typeof repo.reembolsos.totalesPorBeneficiario>
  >;
  error: string | null;
}

async function loadData(isAdmin: boolean, userId: string): Promise<DataResult> {
  const filtros = isAdmin ? {} : { beneficiario_id: userId };
  try {
    const [reembolsos, tasaActual, totales] = await Promise.all([
      repo.reembolsos.list(filtros),
      repo.tasaCambio.actual(),
      isAdmin
        ? repo.reembolsos.totalesPorBeneficiario()
        : Promise.resolve([] as Awaited<
            ReturnType<typeof repo.reembolsos.totalesPorBeneficiario>
          >),
    ]);
    return {
      reembolsos,
      tasaUsdBs: tasaActual.valor_bs_por_usd,
      totales,
      error: null,
    };
  } catch (e) {
    return {
      reembolsos: [],
      tasaUsdBs: 0,
      totales: [],
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

export default async function ReembolsosPage() {
  let user;
  try {
    user = await repo.users.current();
  } catch (e) {
    return (
      <ErrorPage
        msg={`users.current: ${e instanceof Error ? e.message : "?"}`}
      />
    );
  }
  if (!user) redirect("/login");

  const isAdmin = user.rol === "admin";
  const data = await loadData(isAdmin, user.id);

  if (data.error) {
    return <ErrorPage msg={data.error} />;
  }

  const pendientes = data.reembolsos.filter((r) => r.estado === "pendiente");
  const pagados = data.reembolsos.filter((r) => r.estado === "pagado");
  const totalPendiente = pendientes.reduce(
    (s, r) => s + Number(r.monto_usd),
    0
  );

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Caja"
        title="Reembolsos · v2"
        description={
          isAdmin
            ? `${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"} · ${formatUSD(totalPendiente)} por pagar`
            : `Cuando pagues un gasto de la oficina con tu dinero personal, queda registrado aquí hasta que te lo devuelvan.`
        }
      />

      {isAdmin && data.totales.length > 0 && (
        <Card className="p-4 md:p-5">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            Por beneficiario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.totales.map((t) => {
              const initials = getInitials(t.nombre);
              const bg = colorFromName(t.nombre);
              return (
                <div
                  key={t.beneficiario_id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border bg-secondary/20"
                >
                  <Avatar className="h-9 w-9 ring-1 shrink-0">
                    <AvatarFallback
                      style={{ background: bg, color: "white", fontSize: 11 }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{t.nombre}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.cuenta} reembolso{t.cuenta === 1 ? "" : "s"}
                    </div>
                  </div>
                  <MoneyDisplay
                    usd={t.total_usd}
                    tasa={data.tasaUsdBs}
                    align="right"
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Tabs defaultValue="pendiente" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendiente" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pendientes
            <span className="ml-1 text-[10px] tabular-nums opacity-70">
              {pendientes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pagado" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pagados
            <span className="ml-1 text-[10px] tabular-nums opacity-70">
              {pagados.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendiente">
          <Card className="py-4">
            <EmptyState
              icon={Wallet}
              title="No hay reembolsos pendientes"
              description={
                isAdmin
                  ? "Cuando alguien pague un gasto con dinero personal aparecerá aquí."
                  : "No tienes reembolsos pendientes por cobrar."
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="pagado">
          <Card className="py-4">
            <EmptyState
              icon={CheckCircle2}
              title="Sin historial"
              description="Aún no se ha registrado ningún reembolso pagado."
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
