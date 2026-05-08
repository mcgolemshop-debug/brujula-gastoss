import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  ImageIcon,
  MapPin,
  Package,
  Pencil,
  Receipt,
} from "lucide-react";
import { repo } from "@/lib/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, colorFromName, formatUSD, formatBs } from "@/lib/utils";
import { DeleteGastoButton } from "./_components/delete-button";
import { ReembolsoSection } from "./_components/reembolso-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gasto = await repo.gastos.byId(id);
  return { title: gasto ? `${gasto.codigo} · ${gasto.descripcion}` : "Gasto" };
}

async function getFacturasUrls(facturas: { url_storage: string }[]) {
  if (facturas.length === 0) return [];
  const sb = await createSupabaseServerClient();
  return facturas.map((f) => {
    const { data } = sb.storage.from("facturas").getPublicUrl(f.url_storage);
    return { ...f, publicUrl: data.publicUrl };
  });
}

export default async function GastoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [gasto, currentUser] = await Promise.all([
    repo.gastos.byId(id),
    repo.users.current(),
  ]);

  if (!gasto) notFound();

  const isAdmin = currentUser?.rol === "admin";
  const isOwner = currentUser?.id === gasto.usuario_id;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin;

  const fecha = new Date(gasto.fecha + "T00:00:00");
  const [facturasUrls, reembolsoExistente] = await Promise.all([
    getFacturasUrls(gasto.facturas ?? []),
    // Si la tabla reembolsos no existe (migración no aplicada), no rompemos toda la página
    repo.reembolsos.byGastoId(gasto.id).catch(() => null),
  ]);

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      {/* Back nav */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
          <Link href="/gastos">
            <ArrowLeft className="h-4 w-4" />
            Todos los gastos
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/gastos/${gasto.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Link>
            </Button>
          )}
          {canDelete && <DeleteGastoButton id={gasto.id} codigo={gasto.codigo} />}
        </div>
      </div>

      {/* Reembolso */}
      <ReembolsoSection
        gastoId={gasto.id}
        totalUsd={gasto.total_usd}
        totalBs={gasto.total_bs}
        beneficiarioId={gasto.usuario_id}
        beneficiarioNombre={gasto.usuario?.nombre_completo ?? "—"}
        reembolsoExistente={reembolsoExistente}
        canManage={canEdit}
      />

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-brand-gradient p-6 md:p-8 text-brand-cream">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm bg-brand-cream/10 backdrop-blur-sm border border-brand-cream/20 px-2.5 py-0.5 rounded-md">
                  {gasto.codigo}
                </span>
                {gasto.categoria && (
                  <CategoryBadge
                    nombre={gasto.categoria.nombre}
                    icono={gasto.categoria.icono}
                    color={gasto.categoria.color}
                    variant="default"
                    size="sm"
                  />
                )}
                {gasto.va_a_inventario && (
                  <Badge variant="accent" className="bg-brand-gold/30 text-brand-gold-light border-brand-gold/40">
                    <Package className="h-3 w-3" />
                    En inventario
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight">
                {gasto.descripcion}
              </h1>
              <p className="text-brand-cream/70 text-sm font-mono">
                {format(fecha, "EEEE, d 'de' MMMM yyyy", { locale: es })} · {gasto.hora}
              </p>
            </div>
            <div className="text-right">
              <MoneyDisplay
                usd={gasto.total_usd}
                tasa={gasto.tasa_cambio}
                size="xl"
                primary="usd"
                align="right"
                className="[&>span:first-child]:text-brand-gold [&>span:last-child]:text-brand-cream/60"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalles */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border">
              <Receipt className="h-4 w-4 text-accent" />
              Detalles del gasto
            </div>

            <DetailRow label="Cantidad y unidad">
              <span className="font-mono">
                {gasto.cantidad} {gasto.unidad}
                {gasto.items > 1 && (
                  <span className="text-muted-foreground ml-1.5">
                    · {gasto.items} ítems
                  </span>
                )}
              </span>
            </DetailRow>

            <DetailRow label="Precio unitario">
              <span className="font-mono">{formatUSD(gasto.precio_unitario_usd)}</span>
            </DetailRow>

            <DetailRow label="Tasa al momento">
              <span className="font-mono">
                Bs <span className="text-foreground font-semibold">{gasto.tasa_cambio.toFixed(2)}</span> / 1 USD
              </span>
            </DetailRow>

            <DetailRow label="Total bolívares">
              <span className="font-mono">{formatBs(gasto.total_bs)}</span>
            </DetailRow>

            <div className="pt-2 mt-2 border-t border-border" />

            <DetailRow label="Persona" icon={null}>
              <PersonChip name={gasto.usuario?.nombre_completo ?? "—"} />
            </DetailRow>

            <DetailRow label="Fecha · hora">
              <span className="font-mono text-xs">
                {format(fecha, "d MMM yyyy", { locale: es })} ·{" "}
                {gasto.hora}
              </span>
            </DetailRow>
          </CardContent>
        </Card>

        {/* Pago + factura */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border">
              <CreditCard className="h-4 w-4 text-accent" />
              Pago y origen
            </div>

            <DetailRow label="Método de pago">
              <span className="font-medium">{gasto.metodo_pago}</span>
            </DetailRow>

            {gasto.lugar_compra && (
              <DetailRow label="Lugar de compra">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {gasto.lugar_compra}
                </span>
              </DetailRow>
            )}

            {gasto.numero_factura && (
              <DetailRow label="N° factura">
                <span className="font-mono">{gasto.numero_factura}</span>
              </DetailRow>
            )}

            {gasto.observaciones && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  Observaciones
                </span>
                <p className="text-sm text-foreground italic">
                  &ldquo;{gasto.observaciones}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-2 text-[10px] text-muted-foreground font-mono">
              Registrado{" "}
              {format(new Date(gasto.created_at), "d MMM yyyy, HH:mm", {
                locale: es,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facturas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-3 mb-4 border-b border-border">
            <ImageIcon className="h-4 w-4 text-accent" />
            Foto de factura
            {facturasUrls.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {facturasUrls.length}{" "}
                {facturasUrls.length === 1 ? "foto" : "fotos"}
              </span>
            )}
          </div>

          {facturasUrls.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Sin foto de factura adjunta</p>
              {(isAdmin || isOwner) && (
                <p className="text-xs mt-1">
                  La edición con foto estará disponible próximamente
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {facturasUrls.map((f) => (
                <ImageLightbox
                  key={f.url_storage}
                  src={f.publicUrl}
                  alt={`Factura de ${gasto.codigo}`}
                  fileName={undefined}
                  className="aspect-[4/3]"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}

function PersonChip({ name }: { name: string }) {
  const initials = getInitials(name);
  const bg = colorFromName(name);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar className="h-5 w-5">
        <AvatarFallback
          style={{ background: bg, color: "white", fontSize: 9 }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span>{name}</span>
    </span>
  );
}
