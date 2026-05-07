import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repositories";
import { PageHeader } from "@/components/shared/page-header";
import { AvatarUploader } from "./_components/avatar-uploader";
import { DatosPersonalesForm } from "./_components/datos-personales-form";
import { PasswordForm } from "./_components/password-form";
import { StatsMes } from "./_components/stats-mes";
import { SesionesCard } from "./_components/sesiones-card";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const me = await repo.users.current();
  if (!me) redirect("/login");

  const [stats, tasa] = await Promise.all([
    repo.users.statsPersonales(me.id),
    repo.tasaCambio.actual(),
  ]);

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mi perfil"
        description={`${me.email} · ${me.cargo ?? "Sin cargo"} · miembro desde ${
          new Date(me.created_at).toLocaleDateString("es-VE", {
            year: "numeric",
            month: "long",
          })
        }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda · Avatar + datos + password */}
        <div className="lg:col-span-2 space-y-6">
          <AvatarUploader user={me} />
          <DatosPersonalesForm user={me} />
          <PasswordForm />
        </div>

        {/* Columna derecha · Stats + sesiones */}
        <div className="space-y-6">
          <StatsMes stats={stats} tasa={tasa.valor_bs_por_usd} />
          <SesionesCard ultimoSignin={stats.ultimo_signin} />
        </div>
      </div>
    </div>
  );
}
