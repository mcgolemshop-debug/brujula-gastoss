"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Gasto } from "@/types/domain";

// PDF lazy-loaded para no inflar el bundle inicial (~500KB).

interface Props {
  gastos: Gasto[];
  rango: { desde: string; hasta: string };
  tasa?: number;
  generadoPor?: string;
}

export function ExportButton({
  gastos,
  rango,
  tasa = 36.5,
  generadoPor = "Brujula Markets",
}: Props) {
  const [pdfLoading, setPdfLoading] = React.useState(false);

  function buildRows() {
    return gastos.map((g) => ({
      Codigo: g.codigo,
      Fecha: g.fecha,
      Hora: g.hora,
      Persona: g.usuario?.nombre_completo ?? "",
      Categoria: g.categoria?.nombre ?? "",
      Descripcion: g.descripcion,
      Cantidad: g.cantidad,
      Unidad: g.unidad,
      Items: g.items,
      "Precio unit USD": g.precio_unitario_usd,
      "Total USD": g.total_usd,
      "Tasa Bs/USD": g.tasa_cambio,
      "Total Bs": g.total_bs,
      "Metodo de pago": g.metodo_pago,
      "Lugar de compra": g.lugar_compra ?? "",
      "N factura": g.numero_factura ?? "",
      "Va a inventario": g.va_a_inventario ? "Sí" : "No",
      Observaciones: g.observaciones ?? "",
    }));
  }

  function exportCSV() {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    triggerDownload(
      blob,
      `brujula-gastos-${rango.desde}-a-${rango.hasta}.csv`
    );
    toast.success("CSV exportado", { description: `${rows.length} gastos` });
  }

  function exportXLSX() {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gastos");
    const cols = Object.keys(rows[0] ?? {}).map((k) => ({
      wch: Math.max(k.length, 14),
    }));
    ws["!cols"] = cols;
    XLSX.writeFile(wb, `brujula-gastos-${rango.desde}-a-${rango.hasta}.xlsx`);
    toast.success("Excel exportado", { description: `${rows.length} gastos` });
  }

  async function exportPDF() {
    setPdfLoading(true);
    try {
      // Dynamic import: el bundle PDF (~500KB) solo se descarga al primer click
      const { downloadPdfReport } = await import("./pdf-report");
      await downloadPdfReport({ gastos, rango, tasa, generadoPor });
      toast.success("PDF generado", { description: `${gastos.length} gastos` });
    } catch (e) {
      toast.error("No se pudo generar el PDF", {
        description: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportPDF} disabled={pdfLoading}>
          {pdfLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          PDF con branding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportXLSX}>
          <FileSpreadsheet className="h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV}>
          <FileText className="h-4 w-4" />
          CSV (UTF-8)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
