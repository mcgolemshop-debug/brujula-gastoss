-- =====================================================================
-- Brújula Markets · Fix: triggers de códigos respetan visibilidad global
-- =====================================================================
-- Bug: cuando un empleado (no admin) creaba un gasto, el trigger
-- generate_gasto_codigo calculaba MAX(codigo) leyendo public.gastos
-- pero RLS limitaba la vista a SUS propios gastos. Empleados con 0 gastos
-- generaban G-0001 que ya existía → unique constraint violation.
--
-- Fix: agregar `security definer` + `set search_path = public` a las
-- funciones generadoras de código (gastos y mobiliario).

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
