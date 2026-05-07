# Brújula Markets · Sistema de Control de Gastos

> Sistema multi-usuario, mobile-first, para el control de gastos operativos
> de la oficina de Trading Forex de **Brújula Markets** (Caracas, Venezuela).

![Status](https://img.shields.io/badge/status-Fase%201%20completa-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20·%20Supabase-0a2540)
![Cost](https://img.shields.io/badge/infra-$0%2Fmes-15803d)

---

## 🧭 Sobre el proyecto

Aplicación web full-stack que reemplaza el Excel de control de gastos. Cada
miembro del equipo (8 personas) registra sus compras del día, sube foto de
factura, y la app convierte automáticamente USD ↔ Bolívares con la tasa del
día. **Orlando** (admin) ve todo + edita; los demás solo sus propios gastos.

### Funcionalidad por fase

| Fase | Estado | Entregable |
|------|--------|-----------|
| **1 · Foundation** | ✅ Completada | Setup, branding, layout, dashboard mockeado, schema SQL, seed |
| **2 · CRUD core** | 🔜 Siguiente | Auth real, lista de gastos, multi-step form con foto, inventario |
| **3 · Analítica** | ⏳ | Reportes profundos, presupuestos, equipo, auditoría |
| **4 · Polish** | ⏳ | PWA, offline, realtime, atajos de teclado |
| **5 · Producción** | ⏳ | Tests, docs, deploy a Vercel + Supabase Cloud |

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript estricto |
| **Estilos** | Tailwind CSS v4 + tw-animate-css |
| **Componentes** | Radix UI primitives + custom (filosofía shadcn) |
| **Iconos** | Lucide React |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Cache cliente** | TanStack Query v5 |
| **Animaciones** | Framer Motion |
| **Toasts** | Sonner |
| **Backend** | Supabase (Postgres + Auth + Storage + RLS + Realtime) |
| **Deploy** | Vercel (web) + Supabase Cloud (DB) — **plan free** |

---

## 🚀 Setup local (5 minutos)

### Requisitos previos

- **Node.js 20+** (probado con 24.15)
- **pnpm 11+** — `npm install -g pnpm`
- **Docker Desktop** (para `supabase start` local) — opcional para Fase 1
- **Supabase CLI** — `npm install -g supabase` o `scoop install supabase`

### Pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus claves de Supabase (Fase 2 en adelante)

# 3. Levantar Supabase local (cuando estés en Fase 2)
pnpm supabase:start
# Imprime URL + anon key — pégalos en .env.local

# 4. Aplicar migraciones + seed (Fase 2)
pnpm supabase:reset
# Esto corre 20260507000000_initial_schema.sql + seed.sql

# 5. Generar tipos TypeScript desde la DB
pnpm db:types

# 6. Arrancar el dev server
pnpm dev
# → http://localhost:3000
```

### En Fase 1 (sin Supabase aún)

La app funciona sin Supabase configurado: el middleware/proxy detecta variables
de entorno faltantes y deja pasar todas las rutas. El "login" es simulado
(cualquier credencial entra al dashboard con datos de muestra del Excel).

```bash
pnpm install
pnpm dev   # → http://localhost:3000 funcional con datos mock
```

---

## 📁 Estructura

```
.
├── public/                          # Assets estáticos
├── src/
│   ├── app/
│   │   ├── (auth)/login/            # Auth split-screen
│   │   ├── (dashboard)/             # Layout con sidebar + topbar
│   │   │   ├── dashboard/           # Vista ejecutiva (KPIs, gráficos)
│   │   │   ├── gastos/              # Lista y nuevo gasto (Fase 2)
│   │   │   ├── inventario/          # Mobiliario (Fase 2)
│   │   │   └── ...                  # Otras secciones (stubs)
│   │   ├── globals.css              # Brand tokens (CSS vars + @theme)
│   │   └── layout.tsx               # Root: fonts + providers
│   ├── components/
│   │   ├── brand/                   # BrujulaIcon, BrujulaLogo
│   │   ├── layout/                  # Sidebar, Topbar, MobileBottomNav, etc.
│   │   ├── providers/               # Theme, Query, Tooltip + Toaster
│   │   └── ui/                      # Button, Input, Card, ...
│   ├── lib/
│   │   ├── brand.ts                 # Tokens de marca (TS mirror del CSS)
│   │   ├── constants.ts             # Categorías, equipo, métodos de pago...
│   │   ├── supabase/                # Clientes browser/server/middleware
│   │   └── utils.ts                 # cn(), formatUSD/Bs, getInitials
│   ├── types/
│   │   └── database.types.ts        # Auto-generado desde Supabase
│   └── proxy.ts                     # Middleware (Next 16 lo llama "proxy")
├── supabase/
│   ├── config.toml                  # Config local de `supabase start`
│   ├── migrations/
│   │   └── 20260507000000_initial_schema.sql
│   └── seed.sql                     # 8 usuarios + 12 categorías + tasa + 10 mobiliario + 5 gastos
├── .env.local.example
├── package.json
└── pnpm-workspace.yaml
```

---

## 🗂️ Modelo de datos (resumen)

| Tabla | Filas | Notas |
|-------|-------|-------|
| `users` | 8 | Extiende `auth.users`. Roles: `admin` (Orlando) / `empleado` |
| `categorias` | 12 | Comida, Ferretería, ..., Otros · 3 tipos: variable / fijo / activo_fijo |
| `gastos` | seed: 5 | Tabla principal. `total_usd` y `total_bs` son **generated columns** |
| `mobiliario` | seed: 10 | Inventario. Estados: nuevo / buen_estado / regular / necesita_reparacion / dado_de_baja |
| `tasa_cambio` | seed: 36.5 | Histórico (insert-only). View `tasa_actual` siempre da la última |
| `facturas` | 0 | Metadata de fotos en `storage.facturas` |
| `presupuestos` | 0 | Por categoría/mes — alertas a 80% y 100% |
| `auditoria` | 0 | Log de crear/editar/eliminar (Fase 3) |

**RLS habilitada en todas las tablas.** Empleados solo ven sus gastos; admin
ve y edita todo. Tasa de cambio y categorías solo las modifica admin.

---

## 👥 Usuarios de seed (dev local)

Password universal en seed: `Brujula2026!`

| Email | Rol | Cargo |
|-------|-----|-------|
| orlando@brujula.local | **admin** | Director / Jefe |
| arlet@brujula.local | empleado | Trader |
| lenin@brujula.local | empleado | Trader |
| christian@brujula.local | empleado | Trader |
| diego@brujula.local | empleado | Trader |
| sandro@brujula.local | empleado | Trader |
| luis@brujula.local | empleado | Trader |
| gean@brujula.local | empleado | Trader |

---

## 🎨 Sistema de diseño · Brújula Markets

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand-navy` | `#0A2540` | Primary, fondos oscuros, texto sobre cream |
| `--brand-gold` | `#D4A574` | Accent, CTAs importantes, highlight North compass |
| `--brand-cream` | `#FAF7F2` | Background light theme, texto sobre navy |
| `--brand-graphite` | `#5F5E5A` | Texto secundario, líneas sutiles |

Tipografías: **Inter** (UI), **Crimson Pro** (titulares serif), **JetBrains Mono** (números/códigos).

---

## 🧪 Comandos disponibles

```bash
pnpm dev              # Dev server con Turbopack en :3000
pnpm build            # Build de producción
pnpm start            # Servir build
pnpm lint             # ESLint
pnpm type-check       # TypeScript --noEmit
pnpm format           # Prettier --write
pnpm format:check     # Prettier --check

# Supabase (Fase 2)
pnpm supabase:start   # Levanta Postgres + Auth + Storage local en Docker
pnpm supabase:stop    # Detiene
pnpm supabase:status  # Muestra URLs y keys
pnpm supabase:reset   # Recrea DB desde migrations + seed
pnpm db:types         # Regenera types/database.types.ts
```

---

## 🚢 Deploy a producción (Fase 5)

1. **Crear proyecto Supabase** en supabase.com (plan free: 500 MB DB, 1 GB Storage, 50K MAU).
2. **Push migrations**: `supabase link --project-ref <ref> && supabase db push`
3. **Crear usuarios**: vía dashboard de Supabase o script `scripts/seed-auth-users.ts` (Fase 2).
4. **Conectar a Vercel**: importa el repo de GitHub, agrega env vars en dashboard de Vercel.
5. **Push a `main`** → deploy automático.

---

## 📚 Decisiones arquitectónicas (resumen)

- **Cliente Supabase nativo** en lugar de Drizzle ORM (RLS-first, menos boilerplate, types auto-generados con `supabase gen types`)
- **Custom UI primitives** sobre Radix en lugar de `shadcn add` (más control de la marca, sin el bug de `pnpm dlx`)
- **`supabase start`** (CLI oficial) en lugar de Docker Compose custom + MinIO (paridad 100% con prod, gratis)
- **PWA + Offline + Realtime → Fase 4**, no v1 (evitar complejidad de conflict-resolution antes de tener el core sólido)
- **OCR de facturas → Fase 5+ con API de Anthropic**, no Tesseract.js (menos peso, más preciso)

---

## 📜 Licencia

Proyecto interno de Brújula Markets — uso privado, no distribuir.

---

> **Construido para el equipo de Brújula Markets**
> Cada gasto, en su lugar. 🧭
