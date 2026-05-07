# Brújula Markets · Sistema de Control de Gastos

> Sistema multi-usuario, mobile-first y PWA para el control de gastos
> operativos de la oficina de Trading Forex de **Brújula Markets** (Caracas).

![Status](https://img.shields.io/badge/status-Producción%20ready-15803D)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20·%20Supabase-0a2540)
![Tests](https://img.shields.io/badge/tests-72%20passing-15803D)
![Cost](https://img.shields.io/badge/infra-$0%2Fmes-D4A574)

---

## 🧭 Sobre el proyecto

App web full-stack que reemplaza un Excel para que el equipo de 8 personas
registre todos los gastos operativos del día (comida, ferretería, mobiliario,
etc.) con foto de factura, conversión USD↔Bs en vivo, y dashboards analíticos.

| Fase | Estado | Entregable principal |
|------|--------|--------------------|
| **1 · Foundation** | ✅ | Setup Next.js + Tailwind + Supabase, branding Brújula, layout responsive, dashboard mockeado, schema SQL, seed |
| **2 · CRUD core** | ✅ | Multi-step form con foto + cámara móvil, lista de gastos con filtros, inventario con CRUD, repository pattern |
| **2.5 · Conexión real** | ✅ | Supabase Cloud, auth real, RLS verificada, seed con admin API |
| **3 · Analítica + admin** | ✅ | /reportes con stacked bar + heatmap + export, /presupuestos con alertas, /equipo con admin actions, /auditoria con triggers SQL, /configuracion |
| **4 · Polish** | ✅ | Cmd+K command palette, atajos de teclado, realtime con toasts, /comida especializada, PDF con branding, PWA básica |
| **5 · Producción** | ✅ | Tests Vitest, error boundaries, loading states, health check, lazy imports, backup script, deploy a Vercel ready |

---

## 🛠️ Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| **Framework** | Next.js 16 (App Router) + TypeScript estricto | Turbopack, Server Actions, RSC |
| **Estilos** | Tailwind CSS v4 + tw-animate-css | CSS vars + tokens Brújula |
| **UI** | Radix UI primitives + shadcn-style custom | 13 primitivos + 6 shared + brand |
| **Forms** | React Hook Form + Zod 4 | Multi-step con validación per-step |
| **Cache** | TanStack Query v5 | + ReactQueryDevtools en dev |
| **Charts** | Recharts 3 | Pie, stacked bar, heatmap custom |
| **Animaciones** | Framer Motion 12 | Page transitions + count-up |
| **Iconos** | Lucide React 1.x | + iconos de marca SVG inline |
| **Toasts** | Sonner | RichColors con tema |
| **Búsqueda** | cmdk | Cmd+K con search + nav + theme |
| **PDF** | @react-pdf/renderer 4 | Lazy-loaded, branding inline |
| **Backend** | Supabase Cloud | Postgres + Auth + Storage + RLS + Realtime |
| **Tests** | Vitest 4 + Testing Library + jsdom | 72 tests pasando |
| **Deploy** | Vercel + Supabase Cloud | Plan free para 8 usuarios |

---

## 🚀 Setup local (5 minutos)

### Requisitos previos

- **Node.js 20+** (probado con 24.15)
- **pnpm 11+** — `npm install -g pnpm`
- **Cuenta Supabase Cloud** — https://supabase.com/dashboard

### Pasos

```bash
# 1. Instalar deps
pnpm install

# 2. Variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus claves de Supabase
# Ver "Variables de entorno" abajo

# 3. Aplicar migraciones (primera vez):
#    Ve a https://supabase.com/dashboard/project/<tu-ref>/sql/new
#    Pega y corre los SQL de:
#    - supabase/migrations/20260507000000_initial_schema.sql
#    - supabase/migrations/20260507000001_audit_triggers.sql

# 4. Crear usuarios + datos iniciales
pnpm seed

# 5. Habilitar realtime para gastos (en SQL Editor):
#    ALTER PUBLICATION supabase_realtime ADD TABLE public.gastos;

# 6. Arrancar
pnpm dev
# → http://localhost:3000
# Login: orlando@brujula.local · password: Brujula2026!
```

---

## 🌐 Deploy a producción (Vercel · 10 minutos)

### Paso 1 · Push a GitHub

```bash
git remote add origin git@github.com:tu-usuario/brujula-gastos.git
git branch -M main
git push -u origin main
```

### Paso 2 · Conectar a Vercel

1. Ve a https://vercel.com/new
2. **Import Git Repository** → selecciona `brujula-gastos`
3. Framework: **Next.js** (auto-detectado)
4. Build Command: `pnpm build` (auto)
5. Install Command: `pnpm install` (auto)

### Paso 3 · Variables de entorno

En Vercel → **Project Settings → Environment Variables**, agrega (ver `.env.production.example`):

```
NEXT_PUBLIC_SUPABASE_URL          → https://jzkwqkazwhplzhnxtbex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     → sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY         → sb_secret_... (rota la actual primero)
NEXT_PUBLIC_DATA_SOURCE           → supabase
NEXT_PUBLIC_APP_URL               → https://tu-app.vercel.app
```

Marca **Production**, **Preview** y **Development** para cada una.

### Paso 4 · Configurar Supabase para producción

En el dashboard de Supabase:
1. **Authentication → URL Configuration → Site URL**: `https://tu-app.vercel.app`
2. **Authentication → URL Configuration → Redirect URLs**: agrega `https://tu-app.vercel.app/**`
3. (Opcional) **Authentication → Email Templates**: personaliza con branding Brújula

### Paso 5 · Deploy

Click **Deploy**. En 2-3 minutos:
- ✅ App live en `https://tu-proyecto.vercel.app`
- ✅ HTTPS automático con certificado Let's Encrypt
- ✅ Cada `git push` despliega automáticamente
- ✅ Preview deployments en cada PR

### Paso 6 · Health check

Verifica que todo esté OK: `curl https://tu-app.vercel.app/api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-05-07T15:30:00.000Z",
  "version": "0.1.0",
  "data_source": "supabase",
  "db": { "ok": true, "latency_ms": 87 }
}
```

---

## 📁 Estructura

```
.
├── public/
│   ├── icons/           # Iconos PWA (192, 512)
│   └── manifest.json    # PWA manifest
├── scripts/
│   ├── seed.ts          # Crea usuarios + categorías + datos
│   └── backup.ts        # Dump JSON de todas las tablas
├── src/
│   ├── app/
│   │   ├── (auth)/      # /login + auth actions
│   │   ├── (dashboard)/ # Layout principal con sidebar
│   │   │   ├── dashboard/
│   │   │   ├── gastos/[id]/
│   │   │   ├── gastos/nuevo/
│   │   │   ├── inventario/
│   │   │   ├── reportes/   # KPIs, charts, export PDF/Excel/CSV
│   │   │   ├── presupuestos/   # Admin: tope mensual + alertas
│   │   │   ├── equipo/         # Admin: stats + activar/desactivar
│   │   │   ├── auditoria/      # Admin: log de cambios
│   │   │   ├── configuracion/  # Tasa cambio + categorías
│   │   │   └── comida/         # Vista especializada
│   │   ├── api/health/
│   │   ├── error.tsx           # Error boundary global
│   │   ├── not-found.tsx       # 404 custom
│   │   ├── globals.css         # Brand tokens
│   │   └── layout.tsx          # Root + fonts + providers + manifest
│   ├── components/
│   │   ├── brand/              # BrujulaIcon, BrujulaLogo
│   │   ├── command-palette/    # Cmd+K
│   │   ├── layout/             # Sidebar, Topbar, MobileBottomNav
│   │   ├── providers/          # Theme, Query, Realtime, Tooltip
│   │   ├── shared/             # MoneyDisplay, ImageLightbox, etc.
│   │   └── ui/                 # 22 primitivos (Button, Dialog, etc.)
│   ├── hooks/
│   │   └── use-keyboard-shortcuts.ts
│   ├── lib/
│   │   ├── repositories/       # Pattern: Mock + Supabase
│   │   ├── supabase/           # Browser, Server, Admin clients
│   │   ├── validations/        # Schemas Zod
│   │   ├── brand.ts            # Tokens TS mirror del CSS
│   │   ├── constants.ts        # Datos del Excel
│   │   └── utils.ts            # cn, formatUSD/Bs, etc.
│   ├── proxy.ts                # Middleware (Next 16)
│   └── types/
│       ├── database.types.ts   # Auto-gen via supabase gen types
│       └── domain.ts           # Tipos de dominio
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260507000000_initial_schema.sql
│   │   └── 20260507000001_audit_triggers.sql
│   └── seed.sql                # Para `supabase db reset` local
├── tests/                      # Vitest
│   ├── setup.ts
│   ├── utils.test.ts
│   ├── validations.test.ts
│   └── mock-repository.test.ts
└── vercel.json                 # Config de deploy
```

---

## 🗂️ Modelo de datos

| Tabla | Filas (seed) | Notas |
|-------|--------------|-------|
| `users` | 8 | Extiende `auth.users`. Roles: admin / empleado |
| `categorias` | 12 | Comida, Ferretería, ..., Otros · 3 tipos |
| `gastos` | 5 | Tabla principal. `total_usd`, `total_bs` son **generated columns** |
| `mobiliario` | 10 | 5 estados · ubicaciones |
| `tasa_cambio` | 1 (insert-only) | Cada cambio nuevo registro · gastos viejos conservan tasa |
| `facturas` | 0 | Metadata de fotos en bucket `facturas` |
| `presupuestos` | 0 | Por categoria/mes/anio |
| `auditoria` | auto | Triggers en gastos/mobiliario/categorias/presupuestos/tasa |

**RLS habilitada en todas las tablas.**

---

## 🎨 Sistema de diseño · Brújula Markets

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-navy` | `#0A2540` | Primary, fondos oscuros |
| `--brand-gold` | `#D4A574` | Accent, North compass |
| `--brand-cream` | `#FAF7F2` | Background light theme |
| `--brand-graphite` | `#5F5E5A` | Texto secundario |

Tipografías: **Inter** (UI) + **Crimson Pro** (titulares serif) + **JetBrains Mono** (números).

---

## 🧪 Comandos disponibles

```bash
pnpm dev              # Dev server con Turbopack
pnpm build            # Build de producción
pnpm start            # Servir build
pnpm lint             # ESLint
pnpm type-check       # TypeScript --noEmit
pnpm format           # Prettier --write

pnpm test             # Vitest (run once, 72 tests)
pnpm test:watch       # Vitest watch mode
pnpm test:ui          # Vitest UI
pnpm test:coverage    # Reporte de cobertura

pnpm seed             # Crea usuarios + categorías + datos
pnpm backup           # Dump JSON de Supabase a /backups/
pnpm db:push          # supabase db push (requiere link)
pnpm db:types         # Regenera src/types/database.types.ts
```

---

## 🔐 Seguridad

- **RLS** en todas las tablas. Empleados solo ven sus gastos. Admin ve todo.
- **service_role** key SOLO en server actions (admin operations).
- **Rotación de keys**: cuando compartes en chat o screenshots, rota en
  Dashboard → Settings → API Keys → Roll.
- **Auditoría completa**: cada create/edit/delete deja huella en `auditoria`.
- **Backups**: ejecuta `pnpm backup` periódicamente. Genera JSON local.
- **HTTPS**: automático en Vercel.

---

## ⚡ Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `⌘K` / `Ctrl+K` | Búsqueda global · navegación · cambio de tema |
| `N` | Nuevo gasto |
| `D` | Dashboard |
| `G` | Gastos |
| `I` | Inventario |
| `R` | Reportes |
| `?` | Ver atajos |

(Las letras solo aplican fuera de inputs.)

---

## 📚 Decisiones arquitectónicas

- **Repository pattern** (Mock + Supabase) → cambiar de DB sin tocar UI
- **Cliente Supabase nativo** sobre Drizzle → menos boilerplate, RLS-first
- **Server Actions** sobre API routes → menos código, mejor DX
- **Zod 4** con `.preprocess()` para normalizar inputs antes de validar
- **Mock repository** → desarrollo sin DB, perfecto para CI o demos
- **Generated columns SQL** para `total_usd`/`total_bs` → consistencia garantizada
- **Tasa de cambio insert-only** → auditoría natural sin update history
- **Lazy import del PDF** → bundle inicial liviano (~500KB ahorrados)
- **PWA con SVG icons** → cero generación de PNGs en build

---

## 🛟 Troubleshooting

### "ERR_PNPM_IGNORED_BUILDS"
Ya está resuelto en `pnpm-workspace.yaml`. Si vuelve a aparecer:
```bash
pnpm install
```

### "Database error creating new user" en seed
Migration parchada (search_path en `handle_new_user`). Si re-aplicas migrations
y vuelve, corre el patch SQL de `migrations/20260507000000_initial_schema.sql`.

### Realtime no llega
Verifica en SQL Editor:
```sql
SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
Debe incluir `gastos`. Si no:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.gastos;
```

### Build falla por tipos en Supabase queries
Regenera tipos:
```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref tu-ref
pnpm db:types
```

---

## 📜 Licencia

Proyecto interno de Brújula Markets — uso privado, no distribuir.

---

> **Construido para el equipo de Brújula Markets**
> Cada gasto, en su lugar. 🧭
