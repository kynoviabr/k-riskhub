alter table public.risks
  add column if not exists root_cause text,
  add column if not exists external_tool text,
  add column if not exists external_reference_id text,
  add column if not exists external_reference_url text;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.risks'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%response_type%'
  loop
    execute format('alter table public.risks drop constraint %I', constraint_record.conname);
  end loop;
end $$;

alter table public.risks
  add constraint risks_response_type_check
  check (response_type in ('avoid', 'transfer', 'research', 'mitigate', 'accept', 'escalate'));
