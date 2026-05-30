alter table public.risks
  add column if not exists deleted_at timestamptz;

create index if not exists risks_deleted_at_idx on public.risks(deleted_at);

drop policy if exists "Users can read accessible risks"
on public.risks;

create policy "Users can read accessible risks"
on public.risks for select
using (
  deleted_at is null
  and public.can_access_project(project_id)
);
