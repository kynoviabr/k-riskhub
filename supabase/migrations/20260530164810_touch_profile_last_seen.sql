create or replace function public.touch_current_profile_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid()
    and is_active = true;
$$;

grant execute on function public.touch_current_profile_last_seen() to authenticated;
