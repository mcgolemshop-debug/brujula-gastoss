import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { EquipoTable } from "./_components/equipo-table";

export const metadata: Metadata = { title: "Equipo" };

export default async function EquipoPage() {
  const [me, usuarios, gastos, tasa] = await Promise.all([
    repo.users.current(),
    repo.users.list(),
    repo.gastos.list({ page_size: 5000 }),
    repo.tasaCambio.actual(),
  ]);

  if (!me) redirect("/login");
  if (me.rol !== "admin") redirect("/dashboard");

  // Stats por usuario
  const statsByUser = new Map<
    string,
    {
      total_usd: number;
      compras: number;
      categoria_favorita: string;
      ultima_compra?: string;
    }
  >();

  for (const u of usuarios) {
    statsByUser.set(u.id, {
      total_usd: 0,
      compras: 0,
      categoria_favorita: "—",
    });
  }

  const catCount = new Map<string, Map<string, number>>(); // userId → catName → count
  for (const g of gastos.items) {
    const s = statsByUser.get(g.usuario_id);
    if (!s) continue;
    s.total_usd += g.total_usd;
    s.compras += 1;
    if (
      !s.ultima_compra ||
      g.fecha + g.hora > s.ultima_compra
    ) {
      s.ultima_compra = g.fecha;
    }
    if (g.categoria) {
      const cm = catCount.get(g.usuario_id) ?? new Map<string, number>();
      cm.set(g.categoria.nombre, (cm.get(g.categoria.nombre) ?? 0) + 1);
      catCount.set(g.usuario_id, cm);
    }
  }
  for (const [userId, cats] of catCount.entries()) {
    const top = Array.from(cats.entries()).sort((a, b) => b[1] - a[1])[0];
    const s = statsByUser.get(userId);
    if (s && top) s.categoria_favorita = top[0];
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Equipo"
        description={`${usuarios.length} miembros · activar/desactivar acceso, ver estadísticas individuales, enviar enlace de recuperación de contraseña`}
      />
      <EquipoTable
        usuarios={usuarios}
        stats={Array.from(statsByUser.entries()).map(([userId, s]) => ({
          userId,
          ...s,
        }))}
        currentUserId={me.id}
        tasa={tasa.valor_bs_por_usd}
      />
    </div>
  );
}
