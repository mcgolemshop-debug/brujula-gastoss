import type { Metadata } from "next";
import {
  Boxes,
  Wrench,
  AlertTriangle,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MobiliarioGrid } from "./_components/mobiliario-grid";
import { NuevoMobiliarioButton } from "./_components/nuevo-mobiliario-button";
import { ESTADOS_MOBILIARIO } from "@/lib/constants";
import { formatUSD } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventarioPage() {
  const [items, currentUser, tasaActual] = await Promise.all([
    repo.mobiliario.list(),
    repo.users.current(),
    repo.tasaCambio.actual(),
  ]);

  const isAdmin = currentUser?.rol === "admin";
  const valorTotal = items.reduce(
    (sum, m) => sum + m.precio_compra_usd * m.cantidad,
    0
  );
  const necesitanReparacion = items.filter(
    (m) => m.estado === "necesita_reparacion"
  ).length;
  const dadosBaja = items.filter((m) => m.estado === "dado_de_baja").length;
  const buenEstado = items.filter(
    (m) => m.estado === "buen_estado" || m.estado === "nuevo"
  ).length;

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Mobiliario y dispositivos"
        title="Inventario"
        description={`${items.length} ítems registrados · valor total ${formatUSD(valorTotal)}`}
        actions={isAdmin ? <NuevoMobiliarioButton /> : null}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total ítems"
          value={items.length.toString()}
          icon={Boxes}
          tone="primary"
        />
        <StatCard
          label="Valor inventario"
          value={formatUSD(valorTotal, { compact: true })}
          icon={Sparkles}
          tone="accent"
        />
        <StatCard
          label="En buen estado"
          value={buenEstado.toString()}
          icon={CheckCheck}
          tone="success"
        />
        <StatCard
          label="Necesitan atención"
          value={(necesitanReparacion + dadosBaja).toString()}
          icon={necesitanReparacion > 0 ? AlertTriangle : Wrench}
          tone={necesitanReparacion > 0 ? "destructive" : "muted"}
          pulse={necesitanReparacion > 0}
        />
      </div>

      <MobiliarioGrid
        items={items}
        isAdmin={!!isAdmin}
        tasaActual={tasaActual.valor_bs_por_usd}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "accent" | "success" | "destructive" | "muted";
  pulse?: boolean;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </span>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${colors} ${
              pulse ? "animate-pulse" : ""
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="font-mono text-2xl md:text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
