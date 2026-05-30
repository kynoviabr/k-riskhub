drop policy if exists "Users can read accessible clients"
on public.clients;

create policy "Users can read accessible clients"
on public.clients for select
using (
  public.is_admin()
  or (
    deleted_at is null
    and public.can_access_client(id)
  )
);
