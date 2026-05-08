/**
 * Genera el HTML del reporte semanal a enviar por email.
 * Diseño mobile-first, inline styles (Gmail no respeta <style>).
 */

import { formatUSD, formatBs } from "@/lib/utils";

export interface ReporteSemanalData {
  semanaInicio: string; // YYYY-MM-DD
  semanaFin: string; // YYYY-MM-DD
  totalUsd: number;
  totalBs: number;
  comprasCount: number;
  promedioCompraUsd: number;
  topCategorias: {
    nombre: string;
    color: string;
    total_usd: number;
    pct: number;
  }[];
  topPersonas: {
    nombre: string;
    total_usd: number;
    compras: number;
  }[];
  reembolsosPendientes: number;
  reembolsosPendientesUsd: number;
  appUrl: string;
}

export function buildReporteSemanalHtml(data: ReporteSemanalData): string {
  const top3 = data.topCategorias.slice(0, 3);
  const personas = data.topPersonas.slice(0, 5);

  const fmtFecha = (s: string) => {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("es-VE", {
      day: "numeric",
      month: "long",
    });
  };

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Reporte semanal · Brújula Markets</title>
</head>
<body style="margin:0;padding:0;background:#0F1115;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E8E5DC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0F1115;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:linear-gradient(180deg,#1A1F2E 0%,#13161E 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(232,229,220,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:32px 28px 24px;background:linear-gradient(135deg,#3B2F1E 0%,#2A2014 100%);">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:600;">Reporte semanal</p>
              <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#F5F1E8;letter-spacing:-0.3px;">Brújula Markets</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(245,241,232,0.65);">${fmtFecha(data.semanaInicio)} — ${fmtFecha(data.semanaFin)}</p>
            </td>
          </tr>

          <!-- Total semana -->
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(232,229,220,0.5);">Gastado esta semana</p>
              <p style="margin:0;font-family:'SF Mono',Menlo,monospace;font-size:36px;font-weight:600;color:#D4AF37;letter-spacing:-1px;">${formatUSD(data.totalUsd)}</p>
              <p style="margin:4px 0 0;font-family:'SF Mono',Menlo,monospace;font-size:14px;color:rgba(232,229,220,0.6);">${formatBs(data.totalBs)}</p>
              <p style="margin:16px 0 0;font-size:13px;color:rgba(232,229,220,0.7);">
                <strong style="color:#E8E5DC;">${data.comprasCount}</strong> compra${data.comprasCount === 1 ? "" : "s"} ·
                promedio <strong style="color:#E8E5DC;">${formatUSD(data.promedioCompraUsd)}</strong> por compra
              </p>
            </td>
          </tr>

          ${
            top3.length > 0
              ? `
          <!-- Top categorías -->
          <tr>
            <td style="padding:0 28px 24px;">
              <h2 style="margin:0 0 14px;font-size:13px;font-weight:600;color:#E8E5DC;letter-spacing:0.3px;">Top categorías</h2>
              ${top3
                .map(
                  (c) => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
                <tr>
                  <td style="padding:12px 14px;background:rgba(232,229,220,0.04);border-radius:10px;border-left:3px solid ${c.color};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#E8E5DC;font-weight:500;">${escapeHtml(c.nombre)}</td>
                        <td align="right" style="font-family:'SF Mono',Menlo,monospace;font-size:13px;color:#D4AF37;font-weight:600;">${formatUSD(c.total_usd)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:6px;">
                          <div style="height:4px;background:rgba(232,229,220,0.08);border-radius:99px;overflow:hidden;">
                            <div style="height:4px;width:${Math.min(100, c.pct).toFixed(0)}%;background:${c.color};border-radius:99px;"></div>
                          </div>
                          <p style="margin:6px 0 0;font-size:10px;color:rgba(232,229,220,0.5);font-family:'SF Mono',Menlo,monospace;">${c.pct.toFixed(1)}%</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `
                )
                .join("")}
            </td>
          </tr>
          `
              : ""
          }

          ${
            personas.length > 0
              ? `
          <!-- Top personas -->
          <tr>
            <td style="padding:0 28px 24px;">
              <h2 style="margin:0 0 14px;font-size:13px;font-weight:600;color:#E8E5DC;">Quién más gastó</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${personas
                  .map(
                    (p) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(232,229,220,0.06);">
                    <span style="font-size:13px;color:#E8E5DC;">${escapeHtml(p.nombre)}</span>
                    <span style="font-size:11px;color:rgba(232,229,220,0.5);margin-left:6px;">${p.compras} compra${p.compras === 1 ? "" : "s"}</span>
                  </td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid rgba(232,229,220,0.06);font-family:'SF Mono',Menlo,monospace;font-size:13px;color:#D4AF37;font-weight:600;">${formatUSD(p.total_usd)}</td>
                </tr>
                `
                  )
                  .join("")}
              </table>
            </td>
          </tr>
          `
              : ""
          }

          ${
            data.reembolsosPendientes > 0
              ? `
          <!-- Reembolsos -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:14px 16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;">
                    <p style="margin:0;font-size:12px;color:#F59E0B;font-weight:600;letter-spacing:0.3px;">⏱ ${data.reembolsosPendientes} reembolso${data.reembolsosPendientes === 1 ? "" : "s"} pendiente${data.reembolsosPendientes === 1 ? "" : "s"}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:rgba(232,229,220,0.7);">${formatUSD(data.reembolsosPendientesUsd)} por pagar al equipo.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- CTA -->
          <tr>
            <td style="padding:0 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:14px;background:linear-gradient(135deg,#D4AF37 0%,#B8941F 100%);border-radius:10px;">
                    <a href="${data.appUrl}/dashboard" style="display:block;font-size:13px;font-weight:600;color:#0F1115;text-decoration:none;letter-spacing:0.3px;">Ver dashboard completo →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;background:rgba(232,229,220,0.03);border-top:1px solid rgba(232,229,220,0.06);">
              <p style="margin:0;font-size:10px;color:rgba(232,229,220,0.4);text-align:center;">
                Brújula Markets · Sistema de gastos automatizado<br/>
                Este reporte se genera cada lunes a las 7am.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
