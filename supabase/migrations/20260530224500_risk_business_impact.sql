alter table public.risks
  add column if not exists business_impact text;
