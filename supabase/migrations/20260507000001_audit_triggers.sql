-- =====================================================================
-- Brújula Markets · Migration · Triggers de auditoría
-- Registra automáticamente create/update/delete en tablas críticas.
-- =====================================================================

create or replace function public.audit_trigger_func()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_action accion_auditoria;
  v_old jsonb;
  v_new jsonb;
  v_record_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'crear';
    v_new := to_jsonb(new);
    v_record_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := 'editar';
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_record_id := new.id;
  elsif tg_op = 'DELETE' then
    v_action := 'eliminar';
    v_old := to_jsonb(old);
    v_record_id := old.id;
  end if;

  insert into public.auditoria (tabla, registro_id, accion, usuario_id, cambios)
  values (
    tg_table_name,
    v_record_id,
    v_action,
    v_user,
    jsonb_build_object('old', v_old, 'new', v_new)
  );

  return coalesce(new, old);
exception when others then
  -- No abortar la operación principal si la auditoría falla
  raise warning 'audit trigger error: %', sqlerrm;
  return coalesce(new, old);
end;
$$;

-- Permitir insert via service_role o trigger
grant insert on public.auditoria to authenticated, supabase_auth_admin;

-- Aplicar a tablas críticas
drop trigger if exists audit_gastos on public.gastos;
create trigger audit_gastos
  after insert or update or delete on public.gastos
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_mobiliario on public.mobiliario;
create trigger audit_mobiliario
  after insert or update or delete on public.mobiliario
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_categorias on public.categorias;
create trigger audit_categorias
  after insert or update or delete on public.categorias
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_presupuestos on public.presupuestos;
create trigger audit_presupuestos
  after insert or update or delete on public.presupuestos
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_tasa_cambio on public.tasa_cambio;
create trigger audit_tasa_cambio
  after insert on public.tasa_cambio
  for each row execute function public.audit_trigger_func();
