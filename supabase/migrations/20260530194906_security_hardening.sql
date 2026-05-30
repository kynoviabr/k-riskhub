alter table public.clients
  add column if not exists deleted_at timestamptz;

alter table public.client_contacts
  add column if not exists deleted_at timestamptz;

alter table public.projects
  add column if not exists deleted_at timestamptz;

alter table public.professionals
  add column if not exists deleted_at timestamptz;

create index if not exists clients_deleted_at_idx on public.clients(deleted_at);
create index if not exists client_contacts_deleted_at_idx on public.client_contacts(deleted_at);
create index if not exists projects_deleted_at_idx on public.projects(deleted_at);
create index if not exists professionals_deleted_at_idx on public.professionals(deleted_at);

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.is_admin(), false)
    or exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and p.deleted_at is null
        and (
          p.gp_id = auth.uid()
          or p.portfolio_manager_id = auth.uid()
          or exists (
            select 1
            from public.project_members pm
            where pm.project_id = p.id
              and pm.user_id = auth.uid()
          )
        )
    )
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.is_admin(), false)
    or exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and p.deleted_at is null
        and p.gp_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where pm.project_id = target_project_id
        and p.deleted_at is null
        and pm.user_id = auth.uid()
        and pm.can_edit = true
    )
$$;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.is_admin(), false)
    or exists (
      select 1
      from public.clients c
      where c.id = target_client_id
        and c.deleted_at is null
        and exists (
          select 1
          from public.projects p
          where p.client_id = c.id
            and p.deleted_at is null
            and public.can_access_project(p.id)
        )
    )
$$;

drop policy if exists "Users can read accessible clients"
on public.clients;

create policy "Users can read accessible clients"
on public.clients for select
using (
  deleted_at is null
  and public.can_access_client(id)
);

drop policy if exists "Users can read accessible client contacts"
on public.client_contacts;

create policy "Users can read accessible client contacts"
on public.client_contacts for select
using (
  deleted_at is null
  and public.can_access_client(client_id)
);

drop policy if exists "Users can read accessible projects"
on public.projects;

create policy "Users can read accessible projects"
on public.projects for select
using (
  deleted_at is null
  and public.can_access_project(id)
);

drop policy if exists "Authenticated users can read professionals"
on public.professionals;

create policy "Users can read accessible professionals"
on public.professionals for select
using (
  deleted_at is null
  and (
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.deleted_at is null
        and (
          p.professional_gp_id = professionals.id
          or p.professional_portfolio_manager_id = professionals.id
        )
        and public.can_access_project(p.id)
    )
  )
);

drop policy if exists "Authenticated users can create own audit log entries"
on public.audit_log;

create policy "Authenticated users can create own audit log entries"
on public.audit_log for insert
with check (actor_id = auth.uid());
