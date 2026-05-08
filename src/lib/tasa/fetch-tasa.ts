/**
 * Fetch de tasa de cambio Bs/USD desde fuentes públicas.
 *
 * Estrategia:
 *   1. PyDolarVE (proxy gratis del BCV/Monitor): https://pydolarve.org/api/v1/dollar
 *      → tomamos `monitor.usd_ves` o `bcv.price` según preferencia.
 *   2. Fallback: ExchangeRate.host (gratis, sin API key, devuelve VES oficial).
 *
 * El cron job /api/cron/tasa-cambio llama esta función. Si todas fallan,
 * deja la tasa actual como está (no rompe el sistema).
 */

export interface TasaFetchResult {
  valor: number;
  fuente: string;
  fetched_at: string;
}

interface PyDolarVeRow {
  price?: number;
  last_update?: string;
}

interface PyDolarVeResponse {
  monitors?: {
    bcv?: PyDolarVeRow;
    enparalelovzla?: PyDolarVeRow;
    promedio?: PyDolarVeRow;
  };
}

const HEADERS = {
  "User-Agent": "Brujula-Markets/1.0 (+brujula-gastoss.vercel.app)",
  Accept: "application/json",
};

/** Fuente principal: PyDolarVE — devuelve BCV oficial */
async function fetchPyDolarVE(): Promise<TasaFetchResult | null> {
  try {
    const res = await fetch(
      "https://pydolarve.org/api/v1/dollar?page=bcv",
      {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as PyDolarVeResponse;
    const valor = json.monitors?.bcv?.price;
    if (!valor || valor <= 0 || valor > 1_000_000) return null;
    return {
      valor: Number(valor),
      fuente: "BCV (auto)",
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Fallback: ExchangeRate.host */
async function fetchExchangeRateHost(): Promise<TasaFetchResult | null> {
  try {
    const res = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=VES",
      {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      rates?: { VES?: number };
    };
    const valor = json.rates?.VES;
    if (!valor || valor <= 0 || valor > 1_000_000) return null;
    return {
      valor: Number(valor),
      fuente: "ExchangeRate (auto)",
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchTasaActual(): Promise<TasaFetchResult | null> {
  const result = await fetchPyDolarVE();
  if (result) return result;
  return await fetchExchangeRateHost();
}
