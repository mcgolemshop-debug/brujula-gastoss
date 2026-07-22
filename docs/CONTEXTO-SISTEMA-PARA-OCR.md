# Brújula Markets — Contexto del sistema para diseñar la feature de OCR de facturas

> **Para el chat que recibe este documento:** al final tienes tu tarea. En resumen:
> lee todo esto, mira las fotos de facturas de ejemplo que te va a adjuntar el
> usuario, **idea un enfoque** para extraer los datos automáticamente de una foto
> de factura y **produce un prompt detallado** listo para pasarle al chat de código
> que va a construir la feature en este mismo sistema.

---

## 1. Qué es el sistema

**Brújula Markets** es una app de **control de gastos** para una oficina de trading
Forex en Venezuela (8 personas, dueño/admin: Orlando). Reemplazó un Excel. Es una
**PWA mobile-first** (la mayoría del uso es desde el teléfono) con infraestructura
de **costo cero**. Funciones actuales: registro de gastos, inventario, reembolsos,
nómina semanal, reportes con exportación PDF/Excel, dashboard, tasa de cambio BCV
automática, notificaciones push, 2FA.

El caso que se quiere resolver: hoy, para registrar un gasto, la persona **teclea a
mano** cada dato de la factura (descripción, cantidad, precio, total, fecha, lugar,
etc.). Se quiere que, al **tomar/subir la foto de una factura**, el sistema **lea la
imagen, identifique cada ítem con su precio, el total, la dirección/lugar, la
fecha/hora, el número de factura**, y **rellene automáticamente** el formulario de
gasto para que la persona solo revise y confirme.

---

## 2. Stack técnico

- **Next.js 16** (App Router, Turbopack) + **TypeScript** estricto.
- **Tailwind CSS v4** + primitivos **Radix UI** (componentes propios estilo shadcn:
  `Button`, `Dialog`, `Sheet`, `Select`, `Input`, `Card`, etc.).
- **Supabase Cloud** (Postgres + Auth + **Storage** + RLS + Realtime). Plan free.
- **React Hook Form + Zod 4** para formularios y validación.
- **Server Actions** de Next con un tipo de retorno `ActionResult<T>` (unión
  discriminada `{ ok: true, data } | { ok: false, error, fieldErrors? }`).
- **Recharts** (gráficas), **framer-motion** (animaciones), **cmdk** (command
  palette), **sonner** (toasts), **TanStack Query**, **@react-pdf/renderer** (PDFs
  con branding, lazy-loaded), **web-push** (VAPID), **resend** (email), **Vercel
  Cron** (jobs).
- **Vitest** para tests (102 pasando).
- **PWA**: manifest + service worker.
- Gestor de paquetes: **pnpm**.
- **Deploy**: **Vercel Hobby** + **Supabase free**. Restricciones clave del plan
  Hobby: **timeout de funciones serverless = 10 segundos**; los commits que
  disparan deploy deben ser del email del dueño (el dueño commitea vía GitHub
  Desktop, el asistente de código nunca commitea).

---

## 3. Arquitectura y estructura de carpetas

```
src/
  app/
    (auth)/                      # login
    (dashboard)/                 # app con layout (sidebar + topbar + nav)
      dashboard/                 # resumen ejecutivo (KPIs, gráficas)
      gastos/
        page.tsx                 # lista de gastos + filtros
        nuevo/                   # registro de UN gasto (form multi-paso de 5 pasos)
          _components/           # step-categoria, step-detalles, step-pago,
                                 #   step-foto, step-resumen, multi-step-form
        nuevo-lote/              # registro de VARIOS gastos a la vez (LOTE)
          _components/           # lote-form, lote-header, lote-row, lote-resumen
        [id]/                    # detalle de un gasto (+ /edit para editar)
        _actions.ts              # server actions: crearGastoAction,
                                 #   crearLoteGastosAction, subirFacturaAction, etc.
        _components/             # gastos-table, gastos-filters, bulk-toolbar
      inventario/  comida/  reportes/  reembolsos/  nomina/
      presupuestos/  equipo/  configuracion/  auditoria/  perfil/
    api/
      cron/                      # tasa-cambio, reporte-semanal
      push/                      # subscribe / unsubscribe
  components/
    ui/                          # primitivos (button, dialog, sheet, select, ...)
    shared/                      # numeric-input, money-input, image-upload,
                                 #   category-badge, money-display, confirm-dialog
    layout/                      # sidebar, topbar, mobile-nav-drawer,
                                 #   mobile-bottom-nav, nav-config
  lib/
    repositories/                # PATRÓN REPOSITORY: types.ts, mock.ts, supabase.ts,
                                 #   index.ts (factory). Las páginas y actions usan
                                 #   `repo.gastos.create(...)`, nunca el cliente crudo.
    validations/                 # esquemas Zod (gasto.ts, nomina.ts, reembolso.ts...)
    supabase/                    # clientes server/browser/admin
    utils.ts  constants.ts  brand.ts  periodo.ts  semana.ts  tasa/  push/  email/
  types/
    domain.ts                    # tipos de dominio (User, Gasto, Categoria, ...)
    database.types.ts            # tipos de tablas Supabase
supabase/migrations/*.sql        # esquema, RLS, triggers
```

**Patrón repository:** todo acceso a datos pasa por `repo.<entidad>.<metodo>()`. Hay
dos implementaciones (mock in-memory y Supabase real) intercambiables por la env
`NEXT_PUBLIC_DATA_SOURCE`. En prod se usa Supabase.

**RLS:** el admin ve todo; cada empleado ve solo lo suyo. Todas las mutaciones
validan permisos en el server action antes de tocar el repo.

---

## 4. Modelo de datos del gasto (lo más importante para el OCR)

Tabla `gastos` (campos que el OCR debe ayudar a llenar marcados con 👉):

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | auto |
| `codigo` | text | **auto** (G-0001, G-0002…) vía trigger. NO se llena a mano. |
| 👉 `fecha` | date (YYYY-MM-DD) | fecha del gasto |
| 👉 `hora` | text (HH:mm) | hora del gasto |
| `usuario_id` | uuid | quién registra (del usuario logueado) |
| 👉 `categoria_id` | uuid | una de 13 categorías (ver §7). El OCR debe **inferir** la categoría. |
| 👉 `descripcion` | text | qué se compró (por ítem) |
| 👉 `cantidad` | numeric | ej. 1.5 (kg), 2, 500 |
| 👉 `unidad` | text (enum) | "Unidad", "Kg", "Litros", "Docena"… (13 opciones) |
| 👉 `items` | int | número de líneas/unidades compradas |
| 👉 `precio_unitario_usd` | numeric | **precio en USD** (ver moneda dual, §6) |
| `total_usd` | numeric | **GENERATED** = `items * precio_unitario_usd` (NO se inserta) |
| `tasa_cambio` | numeric | **se inyecta** desde la tasa actual al crear |
| `total_bs` | numeric | **GENERATED** = `items * precio_unitario_usd * tasa_cambio` |
| 👉 `metodo_pago` | text (enum) | "Efectivo $", "Efectivo Bs", "Transferencia", "Pago Móvil", "Zelle", "Tarjeta", "Binance", "Otro" |
| 👉 `lugar_compra` | text? | dirección / nombre del comercio |
| 👉 `numero_factura` | text? | N° de factura/recibo |
| `va_a_inventario` | bool | si es activo fijo |
| `mobiliario_id` | uuid? | enlace a inventario |
| 👉 `observaciones` | text? | notas |

**Punto clave sobre precios:** el sistema guarda **todo en USD** (`precio_unitario_usd`).
La tasa Bs/USD queda **congelada** en cada gasto. Existe un componente
`MoneyInput` con toggle **Bs ⇄ USD**: el usuario puede escribir el monto en Bs y el
sistema lo convierte a USD con la tasa actual antes de guardar. **Muchas facturas
venezolanas están en Bs**, así que el OCR probablemente lea montos en Bs y habrá
que convertirlos (o dejar que el usuario elija la moneda leída).

**Tipo `NuevoGastoInput`** (lo que reciben las actions): `fecha, hora, usuario_id,
categoria_id, descripcion, cantidad, unidad, items, precio_unitario_usd, metodo_pago,
lugar_compra?, numero_factura?, va_a_inventario?, mobiliario_id?, observaciones?,
factura_file?`.

**Facturas / Storage:** las fotos van al bucket **`facturas`** de Supabase Storage,
ruta `${userId}/${gastoId}/${archivo}`, con una tabla `facturas` (`gasto_id`,
`url_storage`, `nombre_archivo`, `tamano_bytes`, `mime_type`, `subida_por`). Hoy la
foto se sube **después** de crear el gasto (`subirFacturaAction`). Tipos aceptados:
JPG, PNG, WebP, HEIC/HEIF (cámara iPhone), PDF, máx 10 MB.

---

## 5. Flujo actual de registro (dónde encajaría el OCR)

Hay **tres** flujos, todos usando `repo.gastos.create()` / `crearLoteGastosAction`:

1. **Un gasto** — `/gastos/nuevo`: formulario **multi-paso** (5 pasos: categoría →
   detalles → pago → foto → confirmar). RHF + Zod, autosave en localStorage. La foto
   es opcional y se sube al final.

2. **Lote (varios gastos a la vez)** — `/gastos/nuevo-lote`: **una pantalla** con un
   **encabezado compartido** (fecha, hora, método de pago, lugar, N° factura + **una
   foto compartida**) y **N filas**, cada fila = un gasto con su categoría,
   descripción, cantidad, unidad, ítems y precio. `crearLoteGastosAction` los inserta
   **secuencialmente** (el trigger de código G-XXXX no es seguro en paralelo), con
   rollback si una fila falla, y copia la misma foto a cada gasto.

3. **Editar** — `/gastos/[id]/edit`.

> 🔑 **INSIGHT CLAVE PARA EL OCR:** una factura de supermercado/ferretería con
> **varios ítems** mapea de forma NATURAL al **flujo de LOTE**: el encabezado
> compartido (fecha, lugar, método, N° factura) sale una vez de la factura, y **cada
> línea de la factura → una fila (un gasto)** con su descripción, cantidad y precio.
> El OCR debería producir un JSON con esa estructura (header + items[]) y
> **pre-rellenar el formulario de lote**, para que el usuario revise y confirme.
> Una factura de un solo ítem cae en el flujo de un gasto normal.

---

## 5-bis. Realidad de los documentos adjuntos (CRÍTICO para el diseño)

La imagen que se anexa a un gasto **NO siempre es una factura con ítems**. En la
práctica hay **tres tipos** de documento, y el más común **no tiene desglose**:

1. **Captura de transferencia bancaria / Pago Móvil** — **el caso MÁS frecuente**.
   Muchos comercios en Venezuela no dan factura, así que se adjunta el **screenshot
   de la transferencia** como comprobante. Contiene: **monto** (casi siempre en
   **Bs**), **fecha**, **hora**, **número de referencia/operación**, banco, a veces
   el beneficiario. **NO contiene:** qué se compró (ítems), ni la descripción/motivo
   del gasto, ni la categoría.

2. **Ticket de punto de venta (POS / datáfono).** Comprobante del punto de venta.
   Trae **monto**, **fecha/hora**, nombre del comercio, últimos dígitos de la
   tarjeta, referencia. Normalmente **sin desglose de ítems**.

3. **Factura formal.** Sí trae **ítems + precios + total + N° de factura + RIF/
   dirección**. Es la minoría.

**Implicaciones para el OCR (importantísimo):**

- El motor debe **primero DETECTAR el tipo de documento** y luego extraer solo lo
  que ese tipo permite:
  - **Transferencia / ticket POS** → monto total, fecha, hora, método de pago,
    referencia → rellena `precio/total`, `fecha`, `hora`, `metodo_pago` (Pago Móvil
    / Transferencia / Tarjeta según el caso) y `numero_factura` (la referencia).
    Pero **`descripcion`, `categoria` e ítems NO están en el documento** → los
    completa el humano.
  - **Factura** → todo, incluidos los ítems → encaja en el flujo de **lote**.
- El **"motivo" del gasto** (qué se compró y para qué) **muchas veces NO aparece**
  en el documento —sobre todo en transferencias—. El OCR **no puede adivinar** la
  descripción/categoría en esos casos: debe dejar esos campos para que el usuario
  los escriba (o sugerirlos con baja confianza), nunca inventarlos.
- Casi todos los montos de transferencias/Pago Móvil vienen **en Bs** → convertir a
  USD con la tasa actual, o dejar en Bs con el `MoneyInput`.

**Simplificación práctica (verificado con las imágenes reales):** en el fondo el
sistema solo necesita distinguir **dos casos** — (A) **comprobante SIN ítems**
(transferencia / Pago Móvil / voucher de punto): solo hay un monto total, fecha,
hora y referencia → 1 gasto, con `descripcion`/`categoria` a mano; (B)
**comprobante CON ítems** (factura SENIAT): hay desglose → flujo de lote. Nota: los
tickets térmicos SENIAT (pagados en efectivo o con "PUNTO"/tarjeta) normalmente SÍ
listan ítems, así que caen en el caso B. Un mismo comprobante puede estar adjunto a
varios gastos (un mercado grande dividido en registros).

**Requisito firme:** el flujo de **ENTRADA MANUAL actual se mantiene SIEMPRE**. El
OCR es un **acelerador opcional** (un botón "Escanear comprobante"), **no un
reemplazo**. Si el OCR falla, la imagen no trae el dato, o simplemente no hay
documento, el usuario llena/edita a mano como hoy. **Nunca** bloquear ni condicionar
el registro de un gasto a que el OCR funcione.

## 6. Moneda dual (USD / Bs)

- Los precios se **almacenan en USD**. La tasa Bs/USD se actualiza sola cada día
  (cron que lee el BCV desde APIs públicas: DolarApi.com / PyDolarVE / Criptoya) y
  se puede sincronizar manual desde Configuración.
- El componente `MoneyInput` permite ingresar en **Bs o USD** con un toggle y
  convierte a USD con la tasa del momento antes de guardar.
- **Implicación para el OCR:** las facturas suelen estar en **Bs**. El sistema
  extraído debe (a) detectar la moneda de la factura, (b) o bien convertir a USD con
  la tasa actual, (c) o bien pre-rellenar en Bs y dejar que `MoneyInput` convierta.

---

## 7. Categorías (el OCR debe inferir una)

13 categorías, cada una con un `tipo` (`variable` / `fijo` / `activo_fijo`):
Comida, Ferretería, Limpieza, Repuestos, Aceites Carro/Moto, Mobiliario,
Tecnología/Dispositivos, Servicios, Combustible, Medicinas, Papelería/Oficina,
Nómina, Otros.

El OCR (o el modelo de visión) debería **sugerir** la categoría de cada ítem a
partir de su descripción (ej. "café molido" → Comida; "tornillos" → Ferretería).
La categoría final la confirma el usuario.

---

## 8. Restricciones y realidades a considerar en el diseño

1. **Costo cero / bajo.** Preferencia fuerte por servicios gratis o muy baratos. Un
   modelo de visión (LLM multimodal) es lo más robusto para "leer" facturas
   desordenadas, pero implica un costo/API key. Opciones a evaluar:
   - **Modelos de visión con free tier** (ej. Google **Gemini** tiene tier gratis
     generoso; **Claude Haiku** es barato; OpenAI `gpt-4o-mini` barato).
   - **OCR clásico en el cliente** con **Tesseract.js** (gratis, corre en el
     navegador, sin API key) — pero es menos preciso con facturas de tickets y no
     "entiende" estructura; requeriría parsing/heurísticas.
   - Híbrido: Tesseract para texto crudo + un LLM barato para estructurarlo.
   - **Hoy NO hay ninguna API key de visión configurada** en el proyecto (las env
     existentes son Supabase, VAPID push, Resend, CRON_SECRET). Habría que agregar
     una si se usa un LLM.

2. **Timeout Vercel Hobby = 10 s.** Si la extracción corre en un server action /
   API route de Vercel, debe responder en <10 s. Alternativas: correr en el
   **cliente** (Tesseract o llamada directa al API de visión desde el browser con
   cuidado de no exponer la key), o en una **Supabase Edge Function** (límites
   distintos), o procesar de forma asíncrona.

3. **Mobile-first.** El usuario fotografía la factura con el teléfono (fotos HEIC,
   iluminación variable, tickets arrugados). El diseño debe tolerar imágenes de baja
   calidad y permitir re-tomar la foto.

4. **Revisión humana obligatoria.** Nunca guardar el gasto automáticamente sin que
   el usuario revise. El OCR **pre-rellena**; el humano corrige y confirma. Ideal:
   mostrar nivel de confianza por campo y resaltar lo dudoso.

5. **Multi-ítem → lote.** Ver el insight del §5.

6. **Moneda.** Ver §6 (probablemente Bs → convertir).

7. **Idioma/formato local.** Facturas en español, formato de fecha `dd/mm/aaaa`,
   decimales con **coma** (`1.234,56`), moneda Bs. El parser debe manejar esto.

---

## 9. Puntos de integración exactos (para el chat de código)

- **Esquema/validación:** `src/lib/validations/gasto.ts` (`gastoSchema`,
  `loteGastosSchema` con `header` + `rows[]`).
- **Server actions:** `src/app/(dashboard)/gastos/_actions.ts`
  (`crearGastoAction`, `crearLoteGastosAction`, `subirFacturaAction`).
- **Formularios a pre-rellenar:** `.../gastos/nuevo/_components/multi-step-form.tsx`
  y `.../gastos/nuevo-lote/_components/lote-form.tsx` (usan RHF; se puede
  `form.reset(valoresExtraídos)`).
- **Subida/lectura de imagen:** `src/components/shared/image-upload.tsx` (dropzone +
  cámara) y bucket Storage `facturas`.
- **Moneda:** `src/components/shared/money-input.tsx`.
- **Categorías/constantes:** `src/lib/constants.ts` (`CATEGORIAS_DEFAULT`,
  `UNIDADES`, `METODOS_PAGO`).
- **Repos:** `src/lib/repositories/{types,supabase,mock}.ts`.

Un enfoque natural: un botón "Escanear factura" en `/gastos/nuevo-lote` que abre la
cámara/galería → manda la imagen al motor de extracción → recibe
`{ header, items[] }` → hace `form.reset(...)` del formulario de lote → el usuario
revisa/edita → confirma con `crearLoteGastosAction`. La misma foto se adjunta como
factura.

---

## 10. Formato de salida que probablemente convenga (borrador)

El motor de extracción debería devolver algo como:

```jsonc
{
  "moneda_detectada": "Bs" | "USD",
  "fecha": "2026-06-30",              // normalizada YYYY-MM-DD
  "hora": "14:35",                    // HH:mm (o null)
  "lugar_compra": "Supermercado La Estrella, Av. ...",
  "numero_factura": "F-00012345",
  "metodo_pago": "Efectivo Bs" | null, // si aparece en el ticket
  "total_detectado": 1234.56,          // para validar contra la suma de ítems
  "items": [
    {
      "descripcion": "Café molido 500g",
      "cantidad": 1,
      "unidad": "Unidad",
      "items": 1,
      "precio_unitario": 350.00,       // en la moneda_detectada
      "categoria_sugerida": "Comida",
      "confianza": 0.92
    }
    // ...
  ]
}
```

…y una capa de la app que mapee eso a `loteGastosSchema` (convirtiendo moneda si
hace falta, resolviendo `categoria_sugerida` → `categoria_id`, `unidad` al enum).

---

## 11. TAREA PARA TI (chat que recibe este documento)

1. El usuario te va a **adjuntar imágenes reales** de su oficina. **Ojo: son de
   tres tipos** (ver §5-bis) — **capturas de transferencia bancaria/Pago Móvil**
   (las más comunes, sin ítems), **tickets de punto de venta** (sin ítems), y
   **facturas formales** (con ítems). Analiza los tres tipos: tu diseño debe
   funcionar para TODOS, no solo para facturas con desglose.
2. **Diseña el mejor enfoque** para extraer automáticamente los datos y rellenar los
   gastos, tomando en cuenta TODO lo anterior: costo cero, timeout de 10 s,
   mobile-first, moneda dual (Bs↔USD), multi-ítem→lote, revisión humana, y el stack
   (Next.js + Supabase + Vercel Hobby). Compara opciones (LLM de visión vs Tesseract
   vs híbrido; dónde corre; cómo manejar la key sin exponerla) y **recomienda una**.
3. **Produce un PROMPT detallado y accionable** para pasarle al chat de código que va
   a construir la feature en este mismo repo. Ese prompt debe incluir: el enfoque
   elegido y por qué, los archivos a crear/modificar (usando los puntos de
   integración del §9), el contrato de datos (§10), el manejo de moneda y categorías,
   la UX de revisión humana, y cómo probarlo. Sé específico y práctico.

> Nota: el usuario tiene las imágenes de ejemplo; recuérdale adjuntarlas antes de que
> diseñes, porque el enfoque depende de cómo se ven las facturas reales.
