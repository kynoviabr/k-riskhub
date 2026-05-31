alter table public.risks
  add column if not exists response_type text
  check (response_type in ('avoid', 'transfer', 'mitigate', 'accept', 'escalate'));

update public.risks
set response_type = 'mitigate'
where response_type is null;
