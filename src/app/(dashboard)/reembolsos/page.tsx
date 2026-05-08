import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet, Clock, CheckCircle2 } from "lucide-react";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ReembolsoRow } from "./_components/reembolso-row";
import { formatUSD, getInitials, colorFromName } from "@/lib/utils";

export const metadata: Metadata = { title: "Reembolsos" };

export default async function ReembolsosPage() {
  const user = await repo.users.current();
  if (!user) redirect("/login");

  const isAdmin = user.rol === "admin";

  const filtros = isAdmin ? {} : { beneficiario_id: user.id };

  const [reembolsos, tasaActual, totales] = await Promise.all([
    repo.reembolsos.list(filtros),
    repo.tasaCambio.actual(),
    isAdmin
      ? repo.reembolsos.totalesPorBeneficiario()
      : Promise.resolve([]),
  ]);

  const pendientes = reembolsos.filter((r) => r.estado === "pendiente");
  const pagados = reembolsos.filter((r) => r.estado === "pagado");
  const totalPendiente = pendientes.reduce((s, r) => s + Number(r.monto_usd), 0);

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Caja"
        title="Reembolsos"
        description={
          isAdmin
            ? `${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"} · ${formatUSD(totalPendiente)} por pagar`
            : `Cuando pagues un gasto de la oficina con tu dinero personal, queda registrado aquí hasta que te lo devuelvan.`
        }
      />

      {/* Resumen para admin: por beneficiario */}
      {isAdmin && totales.length > 0 && (
        <Card className="p-4 md:p-5">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            Por beneficiario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {totales.map((t) => {
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
                    tasa={tasaActual.valor_bs_por_usd}
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
          {pendientes.length === 0 ? (
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
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {pendientes.map((r) => (
                <ReembolsoRow
                  key={r.id}
                  reembolso={r}
                  isAdmin={isAdmin}
                  tasaActual={tasaActual.valor_bs_por_usd}
                />
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pagado">
          {pagados.length === 0 ? (
            <Card className="py-4">
              <EmptyState
                icon={CheckCircle2}
                title="Sin historial"
                description="Aún no se ha registrado ningún reembolso pagado."
              />
            </Card>
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {pagados.map((r) => (
                <ReembolsoRow
                  key={r.id}
                  reembolso={r}
                  isAdmin={isAdmin}
                  tasaActual={tasaActual.valor_bs_por_usd}
                />
              ))}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
