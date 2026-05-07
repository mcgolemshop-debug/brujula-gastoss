"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Suscripción Supabase Realtime para gastos.
 * Cuando otro usuario crea un gasto, se muestra un toast y se refresca el dashboard.
 *
 * No-op si NEXT_PUBLIC_DATA_SOURCE !== "supabase".
 */
export function RealtimeProvider({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const router = useRouter();

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase") return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const sb = createSupabaseBrowserClient();
    let cancelled = false;

    const channel = sb
      .channel("brujula-gastos-realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "gastos",
        },
        (payload: { new?: { usuario_id?: string; codigo?: string; descripcion?: string } }) => {
          if (cancelled) return;
          const nuevo = payload.new;
          // No notificar al propio autor
          if (!nuevo || nuevo.usuario_id === currentUserId) return;

          toast(
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold">
                  Nuevo gasto registrado
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {nuevo.codigo} · {nuevo.descripcion ?? "Sin descripción"}
                </span>
              </div>
            </div>,
            {
              duration: 4000,
            }
          );
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [currentUserId, router]);

  return null;
}
