create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role_title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_contacts_client_id_idx on public.client_contacts(client_id);

create trigger set_client_contacts_updated_at
before update on public.client_contacts
for each row execute function public.set_updated_at();

alter table public.client_contacts enable row level security;

create policy "Users can read accessible client contacts"
on public.client_contacts for select
using (public.can_access_client(client_id));

create policy "Admins can manage client contacts"
on public.client_contacts for all
using (public.is_admin())
with check (public.is_admin());
