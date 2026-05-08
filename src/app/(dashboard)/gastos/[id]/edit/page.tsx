import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { repo } from "@/lib/repositories";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EditGastoForm } from "./_components/edit-gasto-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gasto = await repo.gastos.byId(id);
  return { title: gasto ? `Editar ${gasto.codigo}` : "Editar gasto" };
}

export default async function EditarGastoPage({ params }: PageProps) {
  const { id } = await params;
  const [gasto, currentUser, categorias] = await Promise.all([
    repo.gastos.byId(id),
    repo.users.current(),
    repo.categorias.list(),
  ]);

  if (!currentUser) redirect("/login");
  if (!gasto) notFound();

  // Permisos: admin puede editar todo, empleado solo lo suyo
  const canEdit =
    currentUser.rol === "admin" || gasto.usuario_id === currentUser.id;
  if (!canEdit) {
    redirect(`/gastos/${id}`);
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href={`/gastos/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </Link>
      </Button>

      <PageHeader
        eyebrow={`Editar · ${gasto.codigo}`}
        title="Editar gasto"
        description={`Cambios quedan registrados en auditoría. La tasa de cambio (Bs ${gasto.tasa_cambio.toFixed(2)}/USD) y el código no se modifican.`}
      />

      <EditGastoForm
        gasto={gasto}
        categorias={categorias}
        isAdmin={currentUser.rol === "admin"}
      />
    </div>
  );
}
