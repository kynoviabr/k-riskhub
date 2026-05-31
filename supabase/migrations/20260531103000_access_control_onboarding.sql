do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_status') then
    create type public.profile_status as enum ('pending', 'active', 'blocked', 'invited');
  end if;

  if not exists (select 1 from pg_type where typname = 'access_request_status') then
    create type public.access_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
  end if;
end $$;

alter table public.profiles
  add column if not exists status public.profile_status not null default 'active';

alter table public.profiles
  alter column status set default 'pending';

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  company text not null,
  phone text,
  related_context text,
  reason text not null,
  status public.access_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists access_requests_requester_id_idx on public.access_requests(requester_id);
create index if not exists access_requests_status_idx on public.access_requests(status);

drop trigger if exists set_access_requests_updated_at on public.access_requests;
create trigger set_access_requests_updated_at
before update on public.access_requests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, status, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url',
    'pending',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
    and status = 'active'
$$;

alter table public.access_requests enable row level security;

drop policy if exists "Users can read own access requests" on public.access_requests;
create policy "Users can read own access requests"
on public.access_requests for select
using (requester_id = auth.uid() or public.is_admin());

drop policy if exists "Pending users can create own access requests" on public.access_requests;
create policy "Pending users can create own access requests"
on public.access_requests for insert
with check (
  requester_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "Admins can update access requests" on public.access_requests;
create policy "Admins can update access requests"
on public.access_requests for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete access requests" on public.access_requests;
create policy "Admins can delete access requests"
on public.access_requests for delete
using (public.is_admin());
