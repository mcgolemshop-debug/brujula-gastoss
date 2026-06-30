-- =====================================================================
-- Brújula Markets · Migration · Nómina semanal
-- - columna users.salario_mensual_usd (sueldo mensual de referencia, en USD)
-- - tabla pagos_nomina (cada pago semanal a un empleado)
-- - categoría "Nómina" (para que cada pago cuente como gasto en reportes)
-- =====================================================================

-- Salario mensual de referencia por trabajador (USD). El pago semanal es
-- mensual / 4. Nullable: si está sin definir, no se puede pagar nómina.
alter table public.users
  add column if not exists salario_mensual_usd numeric(12, 2);

-- =====================================================================
-- PAGOS DE NÓMINA
-- =====================================================================
-- Cada fila = un pago semanal a un empleado. Snapshot del salario_base_usd
-- (= salario_mensual/4 al momento del pago) para preservar el histórico
-- aunque luego cambie el sueldo. total_usd y total_bs son GENERATED.

create table if not exists public.pagos_nomina (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  empleado_id uuid not null references public.users(id) on delete restrict,
  gasto_id uuid references public.gastos(id) on delete set null,
  semana_inicio date not null,
  semana_fin date not null,
  salario_base_usd numeric(12, 2) not null check (salario_base_usd >= 0),
  bonos_usd numeric(12, 2) not null default 0 check (bonos_usd >= 0),
  deducciones_usd numeric(12, 2) not null default 0 check (deducciones_usd >= 0),
  total_usd numeric(12, 2)
    generated always as (salario_base_usd + bonos_usd - deducciones_usd) stored,
  tasa_cambio numeric(16, 4) not null check (tasa_cambio > 0),
  total_bs numeric(16, 2)
    generated always as ((salario_base_usd + bonos_usd - deducciones_usd) * tasa_cambio) stored,
  metodo_pago metodo_pago,
  notas text,
  registrado_por uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- No permitir que las deducciones dejen el pago en negativo
  check (salario_base_usd + bonos_usd >= deducciones_usd)
);

create index if not exists idx_pagos_nomina_empleado
  on public.pagos_nomina(empleado_id);
create index if not exists idx_pagos_nomina_semana
  on public.pagos_nomina(semana_inicio);
create index if not exists idx_pagos_nomina_gasto
  on public.pagos_nomina(gasto_id);

-- Generador de código N-XXXX (security definer: ve todas las filas pese a RLS)
create or replace function public.generate_pago_nomina_codigo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_n int;
begin
  if new.codigo is null or new.codigo = '' then
    select coalesce(max(substring(codigo from 3)::int), 0) + 1
    into next_n
    from public.pagos_nomina
    where codigo ~ '^N-[0-9]+$';
    new.codigo := 'N-' || lpad(next_n::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_pago_nomina_codigo on public.pagos_nomina;
create trigger set_pago_nomina_codigo
  before insert on public.pagos_nomina
  for each row execute function public.generate_pago_nomina_codigo();

drop trigger if exists set_pagos_nomina_updated_at on public.pagos_nomina;
create trigger set_pagos_nomina_updated_at
  before update on public.pagos_nomina
  for each row execute function public.set_updated_at();

alter table public.pagos_nomina enable row level security;

-- Policies: empleado ve los suyos; admin ve y gestiona todos
drop policy if exists "pagos_nomina · read own or admin" on public.pagos_nomina;
create policy "pagos_nomina · read own or admin"
  on public.pagos_nomina for select to authenticated
  using (public.is_admin() or empleado_id = auth.uid());

drop policy if exists "pagos_nomina · admin insert" on public.pagos_nomina;
create policy "pagos_nomina · admin insert"
  on public.pagos_nomina for insert to authenticated
  with check (public.is_admin());

drop policy if exists "pagos_nomina · admin update" on public.pagos_nomina;
create policy "pagos_nomina · admin update"
  on public.pagos_nomina for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pagos_nomina · admin delete" on public.pagos_nomina;
create policy "pagos_nomina · admin delete"
  on public.pagos_nomina for delete to authenticated
  using (public.is_admin());

-- Audit trigger
drop trigger if exists audit_pagos_nomina on public.pagos_nomina;
create trigger audit_pagos_nomina
  after insert or update or delete on public.pagos_nomina
  for each row execute function public.audit_trigger_func();

-- =====================================================================
-- Categoría "Nómina" (idempotente) — cada pago crea un gasto en ella
-- =====================================================================
insert into public.categorias (nombre, icono, color, tipo, notas, activa, orden)
select
  'Nómina',
  'Wallet',
  '#0EA5E9',
  'fijo',
  'Pago de sueldos al equipo',
  true,
  coalesce((select max(orden) from public.categorias), 0) + 1
where not exists (
  select 1 from public.categorias where nombre = 'Nómina'
);
