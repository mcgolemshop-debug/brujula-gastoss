import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repositories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { AuditoriaList } from "./_components/auditoria-list";

export const metadata: Metadata = { title: "Auditoría" };

interface PageProps {
  searchParams: Promise<{
    tabla?: string;
    accion?: string;
    usuario?: string;
    desde?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const me = await repo.users.current();
  if (!me) redirect("/login");
  if (me.rol !== "admin") redirect("/dashboard");

  const sb = await createSupabaseServerClient();
  let q = sb
    .from("auditoria")
    .select(
      "*, usuario:users!auditoria_usuario_id_fkey(id, nombre_completo, email, rol)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.tabla && sp.tabla !== "all") q = q.eq("tabla", sp.tabla);
  if (sp.accion && sp.accion !== "all") q = q.eq("accion", sp.accion);
  if (sp.usuario && sp.usuario !== "all") q = q.eq("usuario_id", sp.usuario);
  if (sp.desde) q = q.gte("created_at", sp.desde);

  const { data, count } = await q;
  const usuarios = await repo.users.list();

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Auditoría"
        description={`${count ?? 0} ${(count ?? 0) === 1 ? "evento" : "eventos"} registrados · log automático de cambios en gastos, mobiliario, categorías, presupuestos y tasa`}
      />
      <AuditoriaList
        items={(data ?? []) as never[]}
        usuarios={usuarios}
      />
    </div>
  );
}
