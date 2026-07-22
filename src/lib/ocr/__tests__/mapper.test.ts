import { describe, it, expect } from "vitest";
import {
  parseFechaVe,
  parseHoraVe,
  mapUnidad,
  mapCategoria,
  mapMetodoPago,
  prorratearItems,
  construirPrefill,
  type MapperContext,
} from "../mapper";
import { extraccionComprobanteSchema, type ExtraccionComprobante } from "../contract";
import farmatodo from "../__fixtures__/farmatodo.json";
import redvital from "../__fixtures__/redvital.json";
import bdv from "../__fixtures__/bdv.json";
import banesco from "../__fixtures__/banesco.json";

const CATS = [
  { id: "id-comida", nombre: "Comida" },
  { id: "id-limpieza", nombre: "Limpieza" },
  { id: "id-medicinas", nombre: "Medicinas" },
  { id: "id-mobiliario", nombre: "Mobiliario" },
  { id: "id-papeleria", nombre: "Papelería/Oficina" },
  { id: "id-otros", nombre: "Otros" },
];
const CTX: MapperContext = { tasa: 500, usuarioId: "u-1", categorias: CATS };

const fx = (o: unknown) => o as unknown as ExtraccionComprobante;

describe("parseFechaVe / parseHoraVe (formato venezolano)", () => {
  it("dd-mm-yyyy y dd/mm/yyyy → ISO", () => {
    expect(parseFechaVe("25-06-2026")).toBe("2026-06-25");
    expect(parseFechaVe("13/06/2026")).toBe("2026-06-13");
    expect(parseFechaVe("2026-06-25")).toBe("2026-06-25");
  });
  it("NUNCA interpreta mes primero (mm/dd inválido → null)", () => {
    expect(parseFechaVe("06/13/2026")).toBeNull(); // mes 13 imposible
    expect(parseFechaVe("basura")).toBeNull();
    expect(parseFechaVe(null)).toBeNull();
  });
  it("12h AM/PM → 24h; 24h se conserva; ausente → null", () => {
    expect(parseHoraVe("04:43:24PM")).toBe("16:43");
    expect(parseHoraVe("12:00AM")).toBe("00:00");
    expect(parseHoraVe("21:09")).toBe("21:09");
    expect(parseHoraVe(null)).toBeNull();
    expect(parseHoraVe("25:00")).toBeNull();
  });
});

describe("mapUnidad / mapCategoria / mapMetodoPago", () => {
  it("unidad: match, sinónimos y fallback", () => {
    expect(mapUnidad("Kg")).toBe("Kg");
    expect(mapUnidad("kilo")).toBe("Kg");
    expect(mapUnidad("xyz")).toBe("Unidad");
  });
  it("categoría: insensible a acentos, fallback Otros marcado", () => {
    expect(mapCategoria("Comida", CATS)).toEqual({ id: "id-comida", fallback: false });
    expect(mapCategoria("papelería/oficina", CATS).id).toBe("id-papeleria");
    const r = mapCategoria("Cosa Rara", CATS);
    expect(r.id).toBe("id-otros");
    expect(r.fallback).toBe(true);
  });
  it("método de pago: sugerido válido o derivado del subtipo", () => {
    expect(mapMetodoPago("Tarjeta", "voucher_pos", "Bs")).toBe("Tarjeta");
    expect(mapMetodoPago(null, "pago_movil", "Bs")).toBe("Pago Móvil");
    expect(mapMetodoPago(null, "voucher_pos", "Bs")).toBe("Tarjeta");
    expect(mapMetodoPago(null, "zelle", "USD")).toBe("Zelle");
  });
});

describe("prorratearItems (IVA)", () => {
  it("recarga IVA solo a líneas gravadas (G), no a exentas (E)", () => {
    const ex = fx({
      ...farmatodo,
      items: [
        { descripcion: "grav", cantidad: 1, unidad: "Unidad", unidades: 1, precio_unitario: 100, total_linea: 100, iva: "G", categoria_sugerida: null, confianza: 1 },
        { descripcion: "exento", cantidad: 1, unidad: "Unidad", unidades: 1, precio_unitario: 100, total_linea: 100, iva: "E", categoria_sugerida: null, confianza: 1 },
      ],
    });
    const [g, e] = prorratearItems(ex);
    expect(g.total_linea_final).toBe(116); // 100 × 1.16
    expect(e.total_linea_final).toBe(100); // exento intacto
  });
  it("línea por peso: precio_unitario_final = total con IVA / unidades", () => {
    const ex = fx({
      ...farmatodo,
      items: [
        { descripcion: "Jamón", cantidad: 0.535, unidad: "Kg", unidades: 1, precio_unitario: 5480.66, total_linea: 2932.15, iva: "G", categoria_sugerida: "Comida", confianza: 1 },
      ],
    });
    const [it] = prorratearItems(ex);
    expect(it.total_linea_final).toBe(3401.29); // 2932.15 × 1.16
    expect(it.precio_unitario_final).toBe(3401.29); // / 1 unidad
  });
  it("multiplicidad 3x: precio unitario = total / 3", () => {
    const ex = fx({
      ...farmatodo,
      items: [
        { descripcion: "Bisteck", cantidad: 3, unidad: "Unidad", unidades: 3, precio_unitario: 82.31, total_linea: 246.93, iva: "E", categoria_sugerida: "Comida", confianza: 1 },
      ],
    });
    const [it] = prorratearItems(ex);
    expect(it.total_linea_final).toBe(246.93); // exento
    expect(it.precio_unitario_final).toBe(82.31);
  });
});

describe("construirPrefill · Farmatodo (IVA cuadra con el total)", () => {
  const p = construirPrefill(fx(farmatodo), CTX);
  it("va a lote con 8 filas y suma ≈ total impreso", () => {
    expect(p.destino).toBe("lote");
    if (p.destino !== "lote") return;
    expect(p.rows).toHaveLength(8);
    expect(Math.abs(p.meta.sumaFilasBs - 34955.62)).toBeLessThanOrEqual(1);
    expect(p.meta.cuadra).toBe(true);
  });
  it("precio guardado en USD (Bs / tasa); invariante items×precio", () => {
    if (p.destino !== "lote") return;
    const r = p.rows[0]; // Compota Heinz Manzana G 1181.03 → ×1.16 = 1370.0 aprox
    const esperadoUsd = (1181.03 * 1.16) / 500;
    expect(Math.abs(r.precio_unitario_usd - esperadoUsd)).toBeLessThan(0.01);
  });
});

describe("construirPrefill · Redvital (fusión de duplicados)", () => {
  it("las 4 cortinas idénticas se fusionan en 1 fila con items=4", () => {
    const p = construirPrefill(fx(redvital), CTX);
    expect(p.destino).toBe("lote");
    if (p.destino !== "lote") return;
    const cortina = p.rows.find((r) => /cortina/i.test(r.descripcion));
    expect(cortina).toBeDefined();
    expect(cortina!.items).toBe(4);
    expect(p.rows.length).toBe(7); // 10 ítems, 4 cortinas → 1
    // categoría Mobiliario resuelta
    expect(cortina!.categoria_id).toBe("id-mobiliario");
  });
});

describe("construirPrefill · comprobantes de pago (sin ítems)", () => {
  it("BDV sin hora → gasto individual, hora vacía + advertencia", () => {
    const p = construirPrefill(fx(bdv), CTX);
    expect(p.destino).toBe("gasto");
    if (p.destino !== "gasto") return;
    expect(p.values.hora).toBe("");
    expect(p.values.metodo_pago).toBe("Pago Móvil");
    expect(p.values.precio_unitario_usd).toBeCloseTo(200 / 500, 4);
    expect(p.advertencias.some((a) => /hora/i.test(a))).toBe(true);
  });
  it("Banesco → método Pago Móvil, observaciones con bancos/beneficiario", () => {
    const p = construirPrefill(fx(banesco), CTX);
    if (p.destino !== "gasto") return;
    expect(p.values.numero_factura).toBe("061831291166");
    expect(p.values.observaciones).toMatch(/Banesco/);
  });
});

describe("construirPrefill · descuadre", () => {
  it("si la suma no coincide con el total → cuadra=false + advertencia", () => {
    const p = construirPrefill(fx({ ...farmatodo, total: 99999 }), CTX);
    if (p.destino !== "lote") return;
    expect(p.meta.cuadra).toBe(false);
    expect(p.advertencias.some((a) => /no coincide/i.test(a))).toBe(true);
  });
});

describe("Zod del contrato", () => {
  it("acepta un fixture válido", () => {
    expect(extraccionComprobanteSchema.safeParse(farmatodo).success).toBe(true);
  });
  it("rechaza JSON malformado del proveedor", () => {
    const bad = { ...farmatodo, tipo_documento: "inventado" };
    expect(extraccionComprobanteSchema.safeParse(bad).success).toBe(false);
  });
});
