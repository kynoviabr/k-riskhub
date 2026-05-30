create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'admin',
  'gp',
  'client',
  'portfolio_manager',
  'director'
);

create type public.project_status as enum (
  'planned',
  'active',
  'paused',
  'completed',
  'cancelled'
);

create type public.risk_status as enum (
  'open',
  'in_progress',
  'mitigated',
  'closed',
  'accepted'
);

create type public.plan_status as enum (
  'not_started',
  'in_progress',
  'blocked',
  'completed',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  role public.app_role not null default 'client',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  status text not null default 'active',
  internal_owner_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_number text not null,
  name text not null,
  description text,
  gp_id uuid references public.profiles(id),
  portfolio_manager_id uuid references public.profiles(id),
  phase text,
  status public.project_status not null default 'planned',
  starts_on date,
  target_ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, project_number)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.app_role not null,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.responsibles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  email text,
  role_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sequence_number integer,
  group_name text not null,
  phase text,
  description text not null,
  origin text,
  identified_on date not null default current_date,
  main_impact text,
  probability_label text,
  probability_score integer check (probability_score between 1 and 5),
  impact_label text,
  impact_score integer check (impact_score between 1 and 5),
  response_plan text,
  responsible_id uuid references public.responsibles(id),
  responsible_name text,
  status public.risk_status not null default 'open',
  closed_on date,
  asana_task_id text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  score integer generated always as (probability_score * impact_score) stored
);

create table public.risk_mitigation_plans (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks(id) on delete cascade,
  title text not null,
  action text not null,
  responsible_id uuid references public.responsibles(id),
  responsible_name text,
  due_on date,
  status public.plan_status not null default 'not_started',
  completed_on date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.risk_comments (
  id uuid primary key default gen_random_uuid(),
  risk_id uuid not null references public.risks(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  export_type text not null,
  file_name text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  report_type text not null,
  title text not null,
  file_name text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  entity_table text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index clients_internal_owner_id_idx on public.clients(internal_owner_id);
create index projects_client_id_idx on public.projects(client_id);
create index projects_gp_id_idx on public.projects(gp_id);
create index project_members_user_id_idx on public.project_members(user_id);
create index responsibles_client_id_idx on public.responsibles(client_id);
create index responsibles_project_id_idx on public.responsibles(project_id);
create index risks_project_id_idx on public.risks(project_id);
create index risks_status_idx on public.risks(status);
create index risks_score_idx on public.risks(score);
create index risk_mitigation_plans_risk_id_idx on public.risk_mitigation_plans(risk_id);
create index risk_comments_risk_id_idx on public.risk_comments(risk_id);
create index exports_project_id_idx on public.exports(project_id);
create index reports_project_id_idx on public.reports(project_id);
create index audit_log_actor_id_idx on public.audit_log(actor_id);
create index audit_log_entity_idx on public.audit_log(entity_table, entity_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_responsibles_updated_at
before update on public.responsibles
for each row execute function public.set_updated_at();

create trigger set_risks_updated_at
before update on public.risks
for each row execute function public.set_updated_at();

create trigger set_risk_mitigation_plans_updated_at
before update on public.risk_mitigation_plans
for each row execute function public.set_updated_at();

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
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

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
        and p.gp_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_members pm
      where pm.project_id = target_project_id
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
      from public.projects p
      where p.client_id = target_client_id
        and public.can_access_project(p.id)
    )
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.responsibles enable row level security;
alter table public.risks enable row level security;
alter table public.risk_mitigation_plans enable row level security;
alter table public.risk_comments enable row level security;
alter table public.exports enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;

create policy "Profiles can read own profile or admins can read all"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read accessible clients"
on public.clients for select
using (public.can_access_client(id));

create policy "Admins can manage clients"
on public.clients for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read accessible projects"
on public.projects for select
using (public.can_access_project(id));

create policy "Admins can manage projects"
on public.projects for all
using (public.is_admin())
with check (public.is_admin());

create policy "GPs and editable members can update projects"
on public.projects for update
using (public.can_edit_project(id))
with check (public.can_edit_project(id));

create policy "Users can read accessible project members"
on public.project_members for select
using (public.can_access_project(project_id));

create policy "Admins can manage project members"
on public.project_members for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read accessible responsibles"
on public.responsibles for select
using (
  public.is_admin()
  or (project_id is not null and public.can_access_project(project_id))
  or (client_id is not null and public.can_access_client(client_id))
);

create policy "Admins and project editors can manage responsibles"
on public.responsibles for all
using (
  public.is_admin()
  or (project_id is not null and public.can_edit_project(project_id))
)
with check (
  public.is_admin()
  or (project_id is not null and public.can_edit_project(project_id))
);

create policy "Users can read accessible risks"
on public.risks for select
using (public.can_access_project(project_id));

create policy "Project editors can manage risks"
on public.risks for all
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

create policy "Users can read accessible mitigation plans"
on public.risk_mitigation_plans for select
using (
  exists (
    select 1
    from public.risks r
    where r.id = risk_id
      and public.can_access_project(r.project_id)
  )
);

create policy "Project editors can manage mitigation plans"
on public.risk_mitigation_plans for all
using (
  exists (
    select 1
    from public.risks r
    where r.id = risk_id
      and public.can_edit_project(r.project_id)
  )
)
with check (
  exists (
    select 1
    from public.risks r
    where r.id = risk_id
      and public.can_edit_project(r.project_id)
  )
);

create policy "Users can read accessible comments"
on public.risk_comments for select
using (
  exists (
    select 1
    from public.risks r
    where r.id = risk_id
      and public.can_access_project(r.project_id)
  )
);

create policy "Accessible users can create comments"
on public.risk_comments for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.risks r
    where r.id = risk_id
      and public.can_access_project(r.project_id)
  )
);

create policy "Users can read accessible exports"
on public.exports for select
using (
  public.is_admin()
  or (project_id is not null and public.can_access_project(project_id))
  or (client_id is not null and public.can_access_client(client_id))
);

create policy "Project editors can create exports"
on public.exports for insert
with check (
  generated_by = auth.uid()
  and (
    public.is_admin()
    or (project_id is not null and public.can_edit_project(project_id))
    or (client_id is not null and public.can_access_client(client_id))
  )
);

create policy "Users can read accessible reports"
on public.reports for select
using (
  public.is_admin()
  or (project_id is not null and public.can_access_project(project_id))
  or (client_id is not null and public.can_access_client(client_id))
);

create policy "Project editors can create reports"
on public.reports for insert
with check (
  generated_by = auth.uid()
  and (
    public.is_admin()
    or (project_id is not null and public.can_edit_project(project_id))
    or (client_id is not null and public.can_access_client(client_id))
  )
);

create policy "Admins can read audit log"
on public.audit_log for select
using (public.is_admin());

create policy "Admins can create audit log entries"
on public.audit_log for insert
with check (public.is_admin());
