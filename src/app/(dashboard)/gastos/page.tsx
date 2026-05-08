import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { GastosTable } from "./_components/gastos-table";
import { GastosFilters } from "./_components/gastos-filters";
import type { GastoFilters, MetodoPago } from "@/types/domain";

export const metadata: Metadata = { title: "Gastos" };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    cat?: string;
    user?: string;
    pago?: string;
    desde?: string;
    hasta?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function GastosPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const filters: GastoFilters = {
    search: sp.q,
    categoria_id: sp.cat,
    usuario_id: sp.user,
    metodo_pago: sp.pago as MetodoPago | undefined,
    fecha_desde: sp.desde,
    fecha_hasta: sp.hasta,
    sort: (sp.sort as GastoFilters["sort"]) ?? "fecha_desc",
    page: sp.page ? parseInt(sp.page, 10) : 1,
    page_size: 25,
  };

  const [
    { items, total, page },
    categorias,
    usuarios,
    tasaActual,
    currentUser,
  ] = await Promise.all([
    repo.gastos.list(filters),
    repo.categorias.list(),
    repo.users.list(),
    repo.tasaCambio.actual(),
    repo.users.current(),
  ]);

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Registros"
        title="Gastos"
        description={`${total} ${total === 1 ? "gasto" : "gastos"} en total · ordenados por ${
          filters.sort === "fecha_desc"
            ? "fecha (más recientes primero)"
            : filters.sort === "total_desc"
            ? "total (mayor a menor)"
            : "fecha"
        }`}
        actions={
          <Button asChild variant="accent" size="lg" className="gap-2">
            <Link href="/gastos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </Link>
          </Button>
        }
      />

      <GastosFilters categorias={categorias} usuarios={usuarios} />

      <GastosTable
        gastos={items}
        total={total}
        page={page}
        pageSize={filters.page_size!}
        tasaActual={tasaActual.valor_bs_por_usd}
        currentUserId={currentUser?.id ?? ""}
        isAdmin={currentUser?.rol === "admin"}
        categorias={categorias}
      />
    </div>
  );
}
