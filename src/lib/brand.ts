/**
 * Brújula Markets · Brand Tokens (TypeScript)
 * Mirror del CSS, exportable para charts y componentes que necesiten valores raw.
 */

export const BRAND = {
  name: "Brújula Markets",
  tagline: "Sistema de Control de Gastos",
  domain: "brujulamarkets.com",
  colors: {
    navy: "#0A2540",
    navyLight: "#143659",
    navyDark: "#061829",
    gold: "#D4A574",
    goldLight: "#E2BD92",
    goldDark: "#B88857",
    cream: "#FAF7F2",
    creamWarm: "#F3EDE1",
    graphite: "#5F5E5A",
  },
  fonts: {
    sans: "Inter, system-ui, sans-serif",
    serif: "'Crimson Pro', Georgia, serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  chart: ["#0A2540", "#D4A574", "#5F5E5A", "#B88857", "#143659", "#E2BD92"],
  chartDark: ["#D4A574", "#FAF7F2", "#A8B3C4", "#E2BD92", "#60A5FA", "#143659"],
} as const;

export type BrandColor = keyof typeof BRAND.colors;
