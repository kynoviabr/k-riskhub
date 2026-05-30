create type public.professional_function as enum (
  'project_manager',
  'portfolio_manager',
  'project_coordinator',
  'project_lead',
  'project_director'
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  whatsapp text,
  function public.professional_function not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, function)
);

create index professionals_function_idx on public.professionals(function);
create index professionals_is_active_idx on public.professionals(is_active);

create trigger set_professionals_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

alter table public.professionals enable row level security;

create policy "Authenticated users can read professionals"
on public.professionals for select
using (auth.role() = 'authenticated');

create policy "Admins can manage professionals"
on public.professionals for all
using (public.is_admin())
with check (public.is_admin());

alter table public.projects
  add column professional_gp_id uuid references public.professionals(id),
  add column professional_portfolio_manager_id uuid references public.professionals(id);

create index projects_professional_gp_id_idx on public.projects(professional_gp_id);
create index projects_professional_portfolio_manager_id_idx on public.projects(professional_portfolio_manager_id);
