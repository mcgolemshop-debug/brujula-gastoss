-- =====================================================================
-- Brújula Markets · Sistema de Control de Gastos
-- Migration inicial: schema completo + RLS + triggers + storage
-- =====================================================================

-- Extensiones requeridas
create extension if not exists pgcrypto;

-- =====================================================================
-- ENUMS
-- =====================================================================
create type rol_usuario as enum ('admin', 'empleado');
create type categoria_tipo as enum ('variable', 'fijo', 'activo_fijo');
create type metodo_pago as enum (
  'Efectivo $', 'Efectivo Bs', 'Transferencia', 'Pago Móvil',
  'Zelle', 'Tarjeta', 'Binance', 'Otro'
);
create type estado_mobiliario as enum (
  'nuevo', 'buen_estado', 'regular', 'necesita_reparacion', 'dado_de_baja'
);
create type tipo_mobiliario as enum (
  'mobiliario', 'dispositivo', 'equipo', 'vehiculo', 'otro'
);
create type accion_auditoria as enum ('crear', 'editar', 'eliminar');

-- =====================================================================
-- TABLAS
-- =====================================================================

-- public.users · extiende auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  email text unique not null,
  rol rol_usuario not null default 'empleado',
  cargo text,
  avatar_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.users is 'Perfil extendido de cada usuario; se sincroniza con auth.users.';

-- public.categorias
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  icono text not null default 'MoreHorizontal',
  color text not null default '#6B7280',
  tipo categoria_tipo not null default 'variable',
  presupuesto_mensual_usd numeric(12,2),
  notas text,
  activa boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.categorias is 'Categorías de gasto (Comida, Ferretería, Tecnología, etc.)';

-- public.tasa_cambio · histórico
create table public.tasa_cambio (
  id uuid primary key default gen_random_uuid(),
  valor_bs_por_usd numeric(12,4) not null check (valor_bs_por_usd > 0),
  fuente text not null default 'manual',
  actualizado_por uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_tasa_cambio_fecha on public.tasa_cambio(created_at desc);
comment on table public.tasa_cambio is 'Histórico de tasas Bs por 1 USD; siempre se inserta, nunca se actualiza.';

-- public.mobiliario
create table public.mobiliario (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  tipo tipo_mobiliario not null default 'mobiliario',
  descripcion text not null,
  marca_modelo text,
  serial text,
  cantidad int not null default 1 check (cantidad > 0),
  estado estado_mobiliario not null default 'buen_estado',
  ubicacion text,
  asignado_a uuid references public.users(id) on delete set null,
  precio_compra_usd numeric(12,2) not null default 0 check (precio_compra_usd >= 0),
  fecha_ingreso date not null default current_date,
  fecha_ultimo_mantenimiento date,
  notas text,
  foto_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_mobiliario_estado on public.mobiliario(estado);
create index idx_mobiliario_ubicacion on public.mobiliario(ubicacion);

-- public.gastos · tabla principal con generated columns
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  fecha date not null default current_date,
  hora time not null default current_time::time,
  usuario_id uuid not null references public.users(id) on delete restrict,
  categoria_id uuid not null references public.categorias(id) on delete restrict,
  descripcion text not null,
  cantidad numeric(12,3) not null default 1 check (cantidad >= 0),
  unidad text not null default 'Unidad',
  items int not null default 1 check (items > 0),
  precio_unitario_usd numeric(12,2) not null check (precio_unitario_usd >= 0),
  total_usd numeric(14,2) generated always as (items * precio_unitario_usd) stored,
  tasa_cambio numeric(12,4) not null check (tasa_cambio > 0),
  total_bs numeric(16,2) generated always as (items * precio_unitario_usd * tasa_cambio) stored,
  metodo_pago metodo_pago not null,
  lugar_compra text,
  numero_factura text,
  va_a_inventario boolean not null default false,
  mobiliario_id uuid references public.mobiliario(id) on delete set null,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_gastos_fecha on public.gastos(fecha desc);
create index idx_gastos_usuario on public.gastos(usuario_id);
create index idx_gastos_categoria on public.gastos(categoria_id);
-- Para queries de "mes actual" usamos rango sobre fecha (idx_gastos_fecha lo cubre)

-- public.facturas · fotos en storage
create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid not null references public.gastos(id) on delete cascade,
  url_storage text not null,
  nombre_archivo text not null,
  tamano_bytes int,
  mime_type text,
  subida_por uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_facturas_gasto on public.facturas(gasto_id);

-- public.presupuestos
create table public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  mes int not null check (mes between 1 and 12),
  anio int not null check (anio between 2024 and 2050),
  monto_usd numeric(12,2) not null check (monto_usd >= 0),
  created_at timestamptz not null default now(),
  unique (categoria_id, mes, anio)
);

-- public.auditoria
create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  accion accion_auditoria not null,
  usuario_id uuid references public.users(id) on delete set null,
  cambios jsonb,
  created_at timestamptz not null default now()
);
create index idx_auditoria_tabla_registro on public.auditoria(tabla, registro_id);
create index idx_auditoria_usuario on public.auditoria(usuario_id);
create index idx_auditoria_fecha on public.auditoria(created_at desc);

-- =====================================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================================

-- Helper: detectar si current user es admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and rol = 'admin' and activo = true
  );
end;
$$;
comment on function public.is_admin is 'Helper para policies RLS — true si current user es admin activo.';

-- Trigger: actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_gastos_updated_at before update on public.gastos
  for each row execute function public.set_updated_at();
create trigger set_mobiliario_updated_at before update on public.mobiliario
  for each row execute function public.set_updated_at();

-- Trigger: auto-crear public.users cuando se crea auth.users
-- IMPORTANTE: `set search_path = public` es necesario en Supabase para que
-- la función encuentre los enums (rol_usuario) en modo security definer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nombre_completo, rol, cargo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'rol')::public.rol_usuario, 'empleado'),
    new.raw_user_meta_data->>'cargo'
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Loguear pero no abortar la creación del auth user
  raise warning 'handle_new_user error: %', sqlerrm;
  return new;
end;
$$;

-- Permisos para que supabase_auth_admin pueda insertar via el trigger
grant insert, update, select on public.users to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: auto-generar código G-0001, G-0002 para gastos
-- IMPORTANTE: security definer + search_path = public para que la función
-- pueda leer TODA la tabla gastos al calcular el máximo. Sin esto, RLS
-- limitaría la lectura a los gastos del usuario actual y empleados con
-- 0 gastos generarían códigos duplicados.
create or replace function public.generate_gasto_codigo()
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
    from public.gastos
    where codigo ~ '^G-[0-9]+$';
    new.codigo := 'G-' || lpad(next_n::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger set_gasto_codigo
  before insert on public.gastos
  for each row execute function public.generate_gasto_codigo();

-- Trigger: auto-generar código M-001, M-002 para mobiliario
-- (Mismo patrón security definer que el de gastos.)
create or replace function public.generate_mobiliario_codigo()
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
    from public.mobiliario
    where codigo ~ '^M-[0-9]+$';
    new.codigo := 'M-' || lpad(next_n::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger set_mobiliario_codigo
  before insert on public.mobiliario
  for each row execute function public.generate_mobiliario_codigo();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.users enable row level security;
alter table public.categorias enable row level security;
alter table public.gastos enable row level security;
alter table public.facturas enable row level security;
alter table public.mobiliario enable row level security;
alter table public.tasa_cambio enable row level security;
alter table public.presupuestos enable row level security;
alter table public.auditoria enable row level security;

-- USERS
create policy "users · authenticated read all" on public.users
  for select to authenticated using (true);
create policy "users · admin update" on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "users · admin delete" on public.users
  for delete to authenticated using (public.is_admin());

-- CATEGORIAS
create policy "categorias · authenticated read" on public.categorias
  for select to authenticated using (true);
create policy "categorias · admin manage" on public.categorias
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- GASTOS
create policy "gastos · read own or admin" on public.gastos
  for select to authenticated
  using (public.is_admin() or usuario_id = auth.uid());
create policy "gastos · insert own" on public.gastos
  for insert to authenticated
  with check (usuario_id = auth.uid() or public.is_admin());
create policy "gastos · update own or admin" on public.gastos
  for update to authenticated
  using (public.is_admin() or usuario_id = auth.uid())
  with check (public.is_admin() or usuario_id = auth.uid());
create policy "gastos · admin delete" on public.gastos
  for delete to authenticated using (public.is_admin());

-- FACTURAS
create policy "facturas · read by gasto access" on public.facturas
  for select to authenticated using (
    public.is_admin() or
    exists (
      select 1 from public.gastos g
      where g.id = facturas.gasto_id and g.usuario_id = auth.uid()
    )
  );
create policy "facturas · insert if owner" on public.facturas
  for insert to authenticated
  with check (subida_por = auth.uid() or public.is_admin());
create policy "facturas · admin delete" on public.facturas
  for delete to authenticated using (public.is_admin());

-- MOBILIARIO
create policy "mobiliario · authenticated read" on public.mobiliario
  for select to authenticated using (true);
create policy "mobiliario · admin manage" on public.mobiliario
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- TASA_CAMBIO (solo insert nuevo, nunca update)
create policy "tasa · authenticated read" on public.tasa_cambio
  for select to authenticated using (true);
create policy "tasa · admin insert" on public.tasa_cambio
  for insert to authenticated
  with check (public.is_admin());

-- PRESUPUESTOS
create policy "presupuestos · authenticated read" on public.presupuestos
  for select to authenticated using (true);
create policy "presupuestos · admin manage" on public.presupuestos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- AUDITORIA
create policy "auditoria · admin read" on public.auditoria
  for select to authenticated using (public.is_admin());
create policy "auditoria · system insert" on public.auditoria
  for insert to authenticated with check (true);

-- =====================================================================
-- VIEWS DE CONVENIENCIA
-- =====================================================================

-- Tasa de cambio actual (la última)
create or replace view public.tasa_actual as
  select valor_bs_por_usd, fuente, actualizado_por, created_at
  from public.tasa_cambio
  order by created_at desc
  limit 1;

-- Resumen mensual por usuario
create or replace view public.resumen_mensual_usuario as
  select
    u.id as usuario_id,
    u.nombre_completo,
    date_trunc('month', g.fecha)::date as mes,
    count(*)::int as compras,
    sum(g.total_usd)::numeric(14,2) as total_usd,
    sum(g.total_bs)::numeric(16,2) as total_bs
  from public.gastos g
  join public.users u on u.id = g.usuario_id
  group by u.id, u.nombre_completo, date_trunc('month', g.fecha);

-- =====================================================================
-- STORAGE · bucket "facturas"
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturas',
  'facturas',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "storage · facturas read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'facturas' and (
      public.is_admin() or
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy "storage · facturas insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'facturas' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage · facturas update own or admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'facturas' and (
      public.is_admin() or
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy "storage · facturas delete admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'facturas' and public.is_admin());
