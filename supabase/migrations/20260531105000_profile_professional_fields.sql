alter table public.profiles
  add column if not exists company_name text,
  add column if not exists phone text,
  add column if not exists job_title text;

create index if not exists profiles_company_name_idx on public.profiles(company_name);

update public.profiles p
set
  company_name = coalesce(p.company_name, latest_request.company),
  phone = coalesce(p.phone, latest_request.phone)
from (
  select distinct on (requester_id)
    requester_id,
    company,
    phone
  from public.access_requests
  order by requester_id, created_at desc
) latest_request
where p.id = latest_request.requester_id;
