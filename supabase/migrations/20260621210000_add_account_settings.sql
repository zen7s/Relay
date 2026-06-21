insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "avatars_select_own_objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
);

create policy "avatars_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and owner_id = (select auth.uid()::text)
);

create policy "avatars_delete_own_objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid()::text)
);

create function public.get_account_deletion_blockers()
returns table (
  workspace_id uuid,
  workspace_name text,
  workspace_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select workspace.id, workspace.name, workspace.slug::text
  from public.workspace_members as membership
  inner join public.workspaces as workspace
    on workspace.id = membership.workspace_id
  where membership.user_id = auth.uid()
    and membership.role = 'owner'
  order by workspace.created_at, workspace.id;
$$;

create function private.ensure_workspace_keeps_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.workspaces
    where id = old.workspace_id
  ) and not exists (
    select 1
    from public.workspace_members
    where workspace_id = old.workspace_id
      and role = 'owner'
  ) then
    raise exception 'Transfer ownership before removing the Owner'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create constraint trigger workspace_members_keep_owner
after delete or update of role on public.workspace_members
deferrable initially deferred
for each row
when (old.role = 'owner')
execute function private.ensure_workspace_keeps_owner();

revoke all on function public.get_account_deletion_blockers() from public;
grant execute on function public.get_account_deletion_blockers()
to authenticated;
