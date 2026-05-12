/**
 * Fetch de tasa de cambio Bs/USD desde fuentes públicas.
 *
 * Estrategia: BCV oficial estricto. Intenta 3 fuentes en orden hasta encontrar
 * la primera que devuelva un valor válido. Si todas fallan, retorna null y
 * loguea cada error en console.error (visible en Vercel Function Logs).
 *
 * Fuentes (todas devuelven BCV oficial):
 *   1. DolarApi.com — `https://ve.dolarapi.com/v1/dolares/oficial`
 *   2. PyDolarVE   — `https://pydolarve.org/api/v1/dollar?page=bcv`
 *   3. Criptoya    — `https://criptoya.com/api/dolar` → `oficial.price`
 */

export interface TasaFetchResult {
  valor: number;
  fuente: string;
  fetched_at: string;
}

export interface TasaFetchAttempt {
  fuente: string;
  ok: boolean;
  valor?: number;
  error?: string;
  http_status?: number;
}

const HEADERS = {
  "User-Agent": "Brujula-Markets/1.0 (+brujula-gastoss.vercel.app)",
  Accept: "application/json",
};

const TIMEOUT_MS = 8000;

/** Validación común: rango razonable para Bs/USD (entre 1 y 1M) */
function isValidRate(v: unknown): v is number {
  return typeof v === "number" && v > 0 && v < 1_000_000 && Number.isFinite(v);
}

/**
 * Fuente 1: DolarApi.com (Venezuela)
 * GET https://ve.dolarapi.com/v1/dolares/oficial
 * Respuesta esperada: { fuente, nombre, compra, venta, promedio, fechaActualizacion }
 */
export async function fetchDolarApi(): Promise<{
  result: TasaFetchResult | null;
  attempt: TasaFetchAttempt;
}> {
  const fuente = "DolarApi.com (BCV)";
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `HTTP ${res.status}`,
        },
      };
    }
    const json = (await res.json()) as {
      promedio?: number;
      venta?: number;
      compra?: number;
    };
    const valor = json.promedio ?? json.venta ?? json.compra;
    if (!isValidRate(valor)) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `Valor inválido en respuesta: ${JSON.stringify(json).slice(0, 200)}`,
        },
      };
    }
    return {
      result: {
        valor,
        fuente: "BCV (DolarApi)",
        fetched_at: new Date().toISOString(),
      },
      attempt: { fuente, ok: true, valor, http_status: res.status },
    };
  } catch (e) {
    return {
      result: null,
      attempt: {
        fuente,
        ok: false,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    };
  }
}

/**
 * Fuente 2: PyDolarVE
 * GET https://pydolarve.org/api/v1/dollar?page=bcv
 * Respuesta: { monitors: { bcv: { price, last_update } } }
 */
export async function fetchPyDolarVE(): Promise<{
  result: TasaFetchResult | null;
  attempt: TasaFetchAttempt;
}> {
  const fuente = "PyDolarVE (BCV)";
  try {
    const res = await fetch(
      "https://pydolarve.org/api/v1/dollar?page=bcv",
      {
        headers: HEADERS,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `HTTP ${res.status}`,
        },
      };
    }
    const json = (await res.json()) as {
      monitors?: { bcv?: { price?: number } };
    };
    const valor = json.monitors?.bcv?.price;
    if (!isValidRate(valor)) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `Valor inválido en respuesta: ${JSON.stringify(json).slice(0, 200)}`,
        },
      };
    }
    return {
      result: {
        valor,
        fuente: "BCV (PyDolarVE)",
        fetched_at: new Date().toISOString(),
      },
      attempt: { fuente, ok: true, valor, http_status: res.status },
    };
  } catch (e) {
    return {
      result: null,
      attempt: {
        fuente,
        ok: false,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    };
  }
}

/**
 * Fuente 3: Criptoya
 * GET https://criptoya.com/api/dolar
 * Respuesta esperada: { oficial: { price }, ... }
 */
export async function fetchCriptoya(): Promise<{
  result: TasaFetchResult | null;
  attempt: TasaFetchAttempt;
}> {
  const fuente = "Criptoya (oficial)";
  try {
    const res = await fetch("https://criptoya.com/api/dolar", {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `HTTP ${res.status}`,
        },
      };
    }
    const json = (await res.json()) as { oficial?: { price?: number } };
    const valor = json.oficial?.price;
    if (!isValidRate(valor)) {
      return {
        result: null,
        attempt: {
          fuente,
          ok: false,
          http_status: res.status,
          error: `Valor inválido en respuesta: ${JSON.stringify(json).slice(0, 200)}`,
        },
      };
    }
    return {
      result: {
        valor,
        fuente: "BCV (Criptoya)",
        fetched_at: new Date().toISOString(),
      },
      attempt: { fuente, ok: true, valor, http_status: res.status },
    };
  } catch (e) {
    return {
      result: null,
      attempt: {
        fuente,
        ok: false,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      },
    };
  }
}

/**
 * Prueba las 3 fuentes en orden, devuelve la primera que responde válida.
 * Si todas fallan, retorna null y loguea todos los errores.
 */
export async function fetchTasaActual(): Promise<{
  result: TasaFetchResult | null;
  attempts: TasaFetchAttempt[];
}> {
  const attempts: TasaFetchAttempt[] = [];

  const sources = [fetchDolarApi, fetchPyDolarVE, fetchCriptoya];

  for (const source of sources) {
    const { result, attempt } = await source();
    attempts.push(attempt);
    if (result) {
      return { result, attempts };
    }
    // Log explícito en Vercel Function Logs
    console.warn(`[tasa] Falló fuente ${attempt.fuente}:`, attempt.error);
  }

  console.error("[tasa] Todas las fuentes fallaron:", attempts);
  return { result: null, attempts };
}
