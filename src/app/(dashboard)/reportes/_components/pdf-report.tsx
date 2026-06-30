"use client";

import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Line,
  G,
  pdf,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Gasto } from "@/types/domain";
import { formatBs, formatUSD } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0A2540",
    backgroundColor: "#FAF7F2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#0A2540",
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandText: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: "Times-Roman",
    color: "#0A2540",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 7,
    color: "#5F5E5A",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 2,
  },
  metaRight: {
    textAlign: "right",
    fontSize: 9,
    color: "#5F5E5A",
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0A2540",
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#5F5E5A",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#D4A574",
  },
  kpiLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    color: "#5F5E5A",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0A2540",
  },
  kpiSub: {
    fontSize: 7,
    color: "#5F5E5A",
    marginTop: 2,
  },
  table: {
    width: "auto",
    backgroundColor: "white",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0A2540",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "white",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0D8C4",
  },
  tableRowAlt: {
    backgroundColor: "#F5F0E5",
  },
  cellCodigo: { width: "10%", fontFamily: "Courier", fontSize: 8 },
  cellFecha: { width: "11%", fontFamily: "Courier", fontSize: 8 },
  cellPersona: { width: "16%", fontSize: 8 },
  cellCategoria: { width: "14%", fontSize: 8 },
  cellDescripcion: { width: "27%", fontSize: 8 },
  cellPago: { width: "12%", fontSize: 8 },
  cellTotal: {
    width: "10%",
    textAlign: "right",
    fontFamily: "Courier",
    fontSize: 8,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#5F5E5A",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E0D8C4",
  },
  pageNumber: {
    fontFamily: "Courier",
  },
});

// Logo Brújula (compass) para PDF
function BrujulaPdfLogo() {
  return (
    <Svg width={32} height={32} viewBox="0 0 500 500">
      <G transform="translate(250, 250)">
        <Circle cx={0} cy={0} r={195} fill="#0A2540" />
        <G stroke="#D4A574" strokeWidth={2} opacity={0.5}>
          <Line x1={0} y1={-175} x2={0} y2={-160} />
          <Line x1={0} y1={175} x2={0} y2={160} />
          <Line x1={-175} y1={0} x2={-160} y2={0} />
          <Line x1={175} y1={0} x2={160} y2={0} />
        </G>
        <Path d="M 0 -108 L 14 0 L 0 -5 L -14 0 Z" fill="#D4A574" />
        <Path d="M 0 108 L 14 0 L 0 5 L -14 0 Z" fill="#FAF7F2" opacity={0.85} />
        <Path d="M 92 0 L 0 8 L 5 0 L 0 -8 Z" fill="#D4A574" opacity={0.7} />
        <Path d="M -92 0 L 0 8 L -5 0 L 0 -8 Z" fill="#FAF7F2" opacity={0.5} />
        <Circle cx={0} cy={0} r={11} fill="#0A2540" stroke="#D4A574" strokeWidth={2.5} />
        <Circle cx={0} cy={0} r={4} fill="#D4A574" />
      </G>
    </Svg>
  );
}

interface PdfReportProps {
  gastos: Gasto[];
  rango: { desde: string; hasta: string };
  tasa: number;
  generadoPor: string;
  /** Etiqueta legible del período (ej. "Mayo 2026") */
  periodoLabel?: string;
  /** Slug para el nombre del archivo */
  periodoSlug?: string;
}

export function GastosReportDocument({
  gastos,
  rango,
  tasa,
  generadoPor,
  periodoLabel,
}: PdfReportProps) {
  const totalUsd = gastos.reduce((s, g) => s + g.total_usd, 0);
  const totalBs = totalUsd * tasa;
  const compras = gastos.length;
  const dias = new Set(gastos.map((g) => g.fecha)).size || 1;
  const promedioCompra = compras > 0 ? totalUsd / compras : 0;
  const promedioDiario = totalUsd / dias;

  const desdeF = format(parseISO(rango.desde), "d 'de' MMMM yyyy", {
    locale: es,
  });
  const hastaF = format(parseISO(rango.hasta), "d 'de' MMMM yyyy", {
    locale: es,
  });
  const generadoF = format(new Date(), "d 'de' MMMM yyyy, HH:mm", {
    locale: es,
  });

  // Limit to ~28 rows per page (rough)
  const ROWS_PER_PAGE = 28;
  const pages: Gasto[][] = [];
  for (let i = 0; i < gastos.length; i += ROWS_PER_PAGE) {
    pages.push(gastos.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document
      title={`Brujula - Gastos ${periodoLabel ?? `${rango.desde} a ${rango.hasta}`}`}
      author="Brujula Markets"
      subject="Reporte de gastos operativos"
    >
      {pages.map((pageGastos, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <BrujulaPdfLogo />
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>Brujula</Text>
                <Text style={styles.brandSubtitle}>M A R K E T S</Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.reportTitle}>
                {periodoLabel
                  ? `Reporte · ${periodoLabel}`
                  : "Reporte de gastos"}
              </Text>
              <Text>Del {desdeF}</Text>
              <Text>al {hastaF}</Text>
            </View>
          </View>

          {/* KPIs en la primera página */}
          {pageIdx === 0 && (
            <>
              <Text style={styles.sectionLabel}>Resumen ejecutivo</Text>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Total acumulado</Text>
                  <Text style={styles.kpiValue}>{formatUSD(totalUsd)}</Text>
                  <Text style={styles.kpiSub}>
                    {formatBs(totalBs, { compact: true })}
                  </Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Compras</Text>
                  <Text style={styles.kpiValue}>{compras}</Text>
                  <Text style={styles.kpiSub}>
                    en {dias} {dias === 1 ? "día" : "días"} con actividad
                  </Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Promedio compra</Text>
                  <Text style={styles.kpiValue}>
                    {formatUSD(promedioCompra)}
                  </Text>
                  <Text style={styles.kpiSub}>por transaccion</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Promedio diario</Text>
                  <Text style={styles.kpiValue}>
                    {formatUSD(promedioDiario)}
                  </Text>
                  <Text style={styles.kpiSub}>
                    tasa: Bs {tasa.toFixed(2)}/USD
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>
                Detalle de gastos ({compras})
              </Text>
            </>
          )}

          {/* Tabla */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                Codigo
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "11%" }]}>
                Fecha
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "16%" }]}>
                Persona
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "14%" }]}>
                Categoria
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "27%" }]}>
                Descripcion
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                Pago
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "10%", textAlign: "right" },
                ]}
              >
                Total $
              </Text>
            </View>
            {pageGastos.map((g, i) => (
              <View
                key={g.id}
                style={[
                  styles.tableRow,
                  i % 2 === 0 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={styles.cellCodigo}>{g.codigo}</Text>
                <Text style={styles.cellFecha}>{g.fecha}</Text>
                <Text style={styles.cellPersona}>
                  {g.usuario?.nombre_completo ?? "-"}
                </Text>
                <Text style={styles.cellCategoria}>
                  {g.categoria?.nombre ?? "-"}
                </Text>
                <Text style={styles.cellDescripcion}>{g.descripcion}</Text>
                <Text style={styles.cellPago}>{g.metodo_pago}</Text>
                <Text style={styles.cellTotal}>
                  {formatUSD(g.total_usd)}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>
              Brujula Markets · Generado por {generadoPor} · {generadoF}
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} de ${totalPages}`
              }
            />
          </View>
        </Page>
      ))}
    </Document>
  );
}

/** Helper: genera y descarga el PDF */
export async function downloadPdfReport(props: PdfReportProps): Promise<void> {
  const blob = await pdf(<GastosReportDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = props.periodoSlug ?? `${props.rango.desde}-a-${props.rango.hasta}`;
  a.download = `brujula-gastos-${slug}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
