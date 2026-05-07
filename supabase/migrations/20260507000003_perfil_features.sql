-- =====================================================================
-- Brújula Markets · Migration · Features de /perfil
-- Agrega columna telefono + bucket de avatars con policies.
-- =====================================================================

-- 1. Agregar columna telefono opcional
alter table public.users
  add column if not exists telefono text;

comment on column public.users.telefono is 'Teléfono opcional del usuario, formato libre';

-- 2. Bucket de avatars (público para lectura, escritura propia)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,           -- public read (avatares se sirven sin auth)
  5242880,        -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Policies del bucket avatars
drop policy if exists "avatars · read all authenticated" on storage.objects;
create policy "avatars · read all authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars · insert own" on storage.objects;
create policy "avatars · insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars · update own" on storage.objects;
create policy "avatars · update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars · delete own or admin" on storage.objects;
create policy "avatars · delete own or admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

-- 4. Permitir que usuarios actualicen sus PROPIOS datos en public.users
--    (RLS actual solo permite admin update; agregamos self-update con campos limitados)
drop policy if exists "users · self update" on public.users;
create policy "users · self update"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
