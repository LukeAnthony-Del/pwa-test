-- Run this in the Supabase SQL editor.
-- Also enable Anonymous Sign-Ins in Authentication > Providers.
-- Create the Hub user in Authentication > Users, then mark it as an admin:
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data || '{"export_admin": true}'::jsonb
-- where email = 'YOUR_HUB_EMAIL';

create or replace function public.is_export_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'export_admin')::boolean, false);
$$;

create table if not exists public.export_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  device_name text not null check (char_length(device_name) between 1 and 80),
  avatar_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.export_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.export_profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (
    mime_type like 'image/%' or mime_type like 'video/%'
  ),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  created_at timestamptz not null default now()
);

alter table public.export_profiles enable row level security;
alter table public.export_media enable row level security;

drop policy if exists "owners insert profiles" on public.export_profiles;
create policy "owners insert profiles"
on public.export_profiles for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "owners and admins read profiles" on public.export_profiles;
create policy "owners and admins read profiles"
on public.export_profiles for select
to authenticated
using (owner_id = auth.uid() or public.is_export_admin());

drop policy if exists "owners insert media" on public.export_media;
create policy "owners insert media"
on public.export_media for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.export_profiles p
    where p.id = profile_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "owners and admins read media" on public.export_media;
create policy "owners and admins read media"
on public.export_media for select
to authenticated
using (owner_id = auth.uid() or public.is_export_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'export-media',
  'export-media',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners upload export files" on storage.objects;
create policy "owners upload export files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'export-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owners and admins read export files" on storage.objects;
create policy "owners and admins read export files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'export-media'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_export_admin()
  )
);
