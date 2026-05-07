import { describe, it, expect } from "vitest";
import {
  cn,
  formatUSD,
  formatBs,
  formatNumber,
  getInitials,
  colorFromName,
} from "@/lib/utils";

describe("cn", () => {
  it("combina clases simples", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("resuelve conflictos de Tailwind con tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
  it("ignora valores falsy", () => {
    expect(cn("base", false, null, undefined, "extra")).toBe("base extra");
  });
  it("acepta arrays y objetos via clsx", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});

describe("formatUSD", () => {
  it("formatea con 2 decimales por defecto", () => {
    expect(formatUSD(89.7)).toBe("$89.70");
    expect(formatUSD(1234.5)).toBe("$1,234.50");
  });
  it("redondea correctamente", () => {
    expect(formatUSD(99.999)).toBe("$100.00");
    expect(formatUSD(0.005)).toBe("$0.01");
  });
  it("maneja cero y negativos", () => {
    expect(formatUSD(0)).toBe("$0.00");
    expect(formatUSD(-50)).toBe("-$50.00");
  });
  it("modo compact comprime miles", () => {
    expect(formatUSD(1500, { compact: true })).toBe("$1.5K");
    expect(formatUSD(2300000, { compact: true })).toBe("$2.3M");
  });
  it("compact ignora valores < 1000", () => {
    expect(formatUSD(500, { compact: true })).toBe("$500.00");
  });
});

describe("formatBs", () => {
  it("añade prefijo Bs y formato es-VE", () => {
    expect(formatBs(36.5)).toMatch(/Bs\s.*36/);
    expect(formatBs(0)).toMatch(/Bs\s.*0/);
  });
  it("modo compact", () => {
    expect(formatBs(2500, { compact: true })).toMatch(/Bs/);
  });
});

describe("formatNumber", () => {
  it("formatea con decimales custom", () => {
    expect(formatNumber(1.5, 1)).toBe("1,5");
    expect(formatNumber(1234.567, 2)).toBe("1.234,57");
  });
});

describe("getInitials", () => {
  it("extrae las dos primeras iniciales en mayúsculas", () => {
    expect(getInitials("Orlando Velásquez")).toBe("OV");
    expect(getInitials("Christian Polanco")).toBe("CP");
    expect(getInitials("Gean Carlos Moncalves")).toBe("GC");
  });
  it("maneja nombre con una sola palabra", () => {
    expect(getInitials("Orlando")).toBe("O");
  });
  it("maneja string vacío", () => {
    expect(getInitials("")).toBe("");
  });
  it("maneja espacios extra", () => {
    expect(getInitials("  Orlando   Velásquez  ")).toBe("OV");
  });
});

describe("colorFromName", () => {
  it("devuelve formato HSL", () => {
    expect(colorFromName("Orlando")).toMatch(/^hsl\(\d+ 55% 45%\)$/);
  });
  it("es deterministica para el mismo nombre", () => {
    expect(colorFromName("Christian")).toBe(colorFromName("Christian"));
  });
  it("genera colores distintos para nombres distintos", () => {
    const c1 = colorFromName("Orlando");
    const c2 = colorFromName("Christian");
    expect(c1).not.toBe(c2);
  });
  it("maneja string vacío sin lanzar error", () => {
    expect(() => colorFromName("")).not.toThrow();
  });
});
