-- =====================================================================
-- Brújula Markets · Migration · Features avanzadas
-- - tabla reembolsos
-- - tabla notificaciones_push_subs (suscripciones a push)
-- =====================================================================

-- =====================================================================
-- REEMBOLSOS
-- =====================================================================
-- Cuando alguien paga un gasto con dinero personal, se crea un reembolso
-- pendiente. Cuando la oficina le paga, se marca como saldado.

create table if not exists public.reembolsos (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid not null references public.gastos(id) on delete cascade,
  beneficiario_id uuid not null references public.users(id) on delete restrict,
  monto_usd numeric(12, 2) not null check (monto_usd > 0),
  monto_bs numeric(16, 2) not null check (monto_bs >= 0),
  notas text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  fecha_pago date,
  pagado_por uuid references public.users(id) on delete set null,
  metodo_pago_reembolso metodo_pago,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reembolsos_beneficiario
  on public.reembolsos(beneficiario_id);
create index if not exists idx_reembolsos_estado
  on public.reembolsos(estado);
create index if not exists idx_reembolsos_gasto
  on public.reembolsos(gasto_id);

drop trigger if exists set_reembolsos_updated_at on public.reembolsos;
create trigger set_reembolsos_updated_at
  before update on public.reembolsos
  for each row execute function public.set_updated_at();

alter table public.reembolsos enable row level security;

-- Policies: empleados ven los suyos; admin ve y gestiona todos
drop policy if exists "reembolsos · read own or admin" on public.reembolsos;
create policy "reembolsos · read own or admin"
  on public.reembolsos for select to authenticated
  using (public.is_admin() or beneficiario_id = auth.uid());

drop policy if exists "reembolsos · insert own or admin" on public.reembolsos;
create policy "reembolsos · insert own or admin"
  on public.reembolsos for insert to authenticated
  with check (public.is_admin() or beneficiario_id = auth.uid());

drop policy if exists "reembolsos · admin update" on public.reembolsos;
create policy "reembolsos · admin update"
  on public.reembolsos for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reembolsos · admin delete" on public.reembolsos;
create policy "reembolsos · admin delete"
  on public.reembolsos for delete to authenticated
  using (public.is_admin());

-- Audit trigger para reembolsos
drop trigger if exists audit_reembolsos on public.reembolsos;
create trigger audit_reembolsos
  after insert or update or delete on public.reembolsos
  for each row execute function public.audit_trigger_func();

-- =====================================================================
-- NOTIFICACIONES PUSH · suscripciones por dispositivo
-- =====================================================================

create table if not exists public.notificaciones_push_subs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists idx_push_subs_usuario
  on public.notificaciones_push_subs(usuario_id);

alter table public.notificaciones_push_subs enable row level security;

drop policy if exists "push_subs · own read" on public.notificaciones_push_subs;
create policy "push_subs · own read"
  on public.notificaciones_push_subs for select to authenticated
  using (usuario_id = auth.uid() or public.is_admin());

drop policy if exists "push_subs · own insert" on public.notificaciones_push_subs;
create policy "push_subs · own insert"
  on public.notificaciones_push_subs for insert to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "push_subs · own delete" on public.notificaciones_push_subs;
create policy "push_subs · own delete"
  on public.notificaciones_push_subs for delete to authenticated
  using (usuario_id = auth.uid() or public.is_admin());
