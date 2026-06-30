"use client";

import * as React from "react";
import { Clock, CheckCircle2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Reembolso } from "@/types/domain";
import { ReembolsoRow } from "./reembolso-row";

type TabKey = "pendiente" | "pagado";

interface Props {
  pendientes: Reembolso[];
  pagados: Reembolso[];
  isAdmin: boolean;
  tasa: number;
}

export function ReembolsosTabs({ pendientes, pagados, isAdmin, tasa }: Props) {
  const [tab, setTab] = React.useState<TabKey>("pendiente");

  return (
    <div className="space-y-4">
      {/* Toggle de tabs (sin Radix, control total en SSR) */}
      <div
        className="inline-flex rounded-lg border border-border bg-secondary/30 p-0.5"
        role="tablist"
        aria-label="Estado de reembolsos"
      >
        <TabButton
          active={tab === "pendiente"}
          onClick={() => setTab("pendiente")}
          count={pendientes.length}
        >
          <Clock className="h-3.5 w-3.5" />
          Pendientes
        </TabButton>
        <TabButton
          active={tab === "pagado"}
          onClick={() => setTab("pagado")}
          count={pagados.length}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pagados
        </TabButton>
      </div>

      {tab === "pendiente" &&
        (pendientes.length === 0 ? (
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
                tasaActual={tasa}
              />
            ))}
          </Card>
        ))}

      {tab === "pagado" &&
        (pagados.length === 0 ? (
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
                tasaActual={tasa}
              />
            ))}
          </Card>
        ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
      <span className="text-[10px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}
