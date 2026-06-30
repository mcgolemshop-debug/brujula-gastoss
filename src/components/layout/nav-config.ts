import {
  LayoutDashboard,
  Receipt,
  Sandwich,
  Boxes,
  ChartLine,
  Target,
  Users,
  Settings,
  ScrollText,
  Wallet,
  HandCoins,
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Si aparece en la barra inferior móvil (max 4 + un FAB) */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { label: "Gastos", href: "/gastos", icon: Receipt, mobile: true },
  { label: "Comida", href: "/comida", icon: Sandwich },
  { label: "Inventario", href: "/inventario", icon: Boxes, mobile: true },
  { label: "Reportes", href: "/reportes", icon: ChartLine, mobile: true },
  { label: "Reembolsos", href: "/reembolsos", icon: Wallet },
  { label: "Presupuestos", href: "/presupuestos", icon: Target, adminOnly: true },
  { label: "Equipo", href: "/equipo", icon: Users, adminOnly: true },
  { label: "Nómina", href: "/nomina", icon: HandCoins, adminOnly: true },
  { label: "Configuración", href: "/configuracion", icon: Settings },
  { label: "Auditoría", href: "/auditoria", icon: ScrollText, adminOnly: true },
];

export const NUEVO_GASTO_HREF = "/gastos/nuevo";
export const NUEVO_GASTO_ICON = Plus;
