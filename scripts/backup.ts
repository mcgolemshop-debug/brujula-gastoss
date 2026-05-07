/**
 * Backup script · Brújula Markets
 * --------------------------------------------------------------------
 * Descarga todas las tablas de Supabase a un archivo JSON local.
 * Útil como respaldo antes de cambios grandes o como dump periódico.
 *
 * Uso: pnpm backup
 *
 * Genera: backups/brujula-YYYY-MM-DD-HHmmss.json
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES = [
  "users",
  "categorias",
  "tasa_cambio",
  "mobiliario",
  "gastos",
  "facturas",
  "presupuestos",
  "auditoria",
] as const;

function timestamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function dumpTable(name: string) {
  const { data, error, count } = await sb
    .from(name)
    .select("*", { count: "exact" });
  if (error) throw new Error(`${name}: ${error.message}`);
  return { rows: data ?? [], count: count ?? 0 };
}

async function main() {
  console.log("🧭 Brújula Markets · Backup");
  console.log(`   Source: ${SUPABASE_URL}`);
  console.log(`   Hora: ${new Date().toISOString()}\n`);

  const dump: Record<string, unknown> = {
    _meta: {
      generated_at: new Date().toISOString(),
      source: SUPABASE_URL,
      version: "0.1.0",
    },
  };

  let totalRows = 0;
  for (const t of TABLES) {
    process.stdout.write(`  ${t.padEnd(15)} ... `);
    try {
      const { rows, count } = await dumpTable(t);
      dump[t] = rows;
      totalRows += count;
      console.log(`✓ ${count} filas`);
    } catch (e) {
      console.log(
        `✗ ${e instanceof Error ? e.message : "error desconocido"}`
      );
      dump[t] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  const backupsDir = resolve(__dirname, "../backups");
  if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });

  const filename = `brujula-${timestamp()}.json`;
  const filepath = join(backupsDir, filename);
  writeFileSync(filepath, JSON.stringify(dump, null, 2), "utf-8");

  const sizeKB = (Buffer.byteLength(JSON.stringify(dump)) / 1024).toFixed(1);
  console.log(`\n✅ Backup completado`);
  console.log(`   Archivo: ${filepath}`);
  console.log(`   Filas:   ${totalRows.toLocaleString()}`);
  console.log(`   Tamaño:  ${sizeKB} KB`);
}

main().catch((e) => {
  console.error("\n💥 Backup falló:", e);
  process.exit(1);
});
