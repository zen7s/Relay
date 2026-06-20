create function public.complete_onboarding(
  profile_display_name text,
  requested_workspace_name text
)
returns table (workspace_id uuid, workspace_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_display_name text := trim(profile_display_name);
  clean_workspace_name text := trim(requested_workspace_name);
  slug_base text;
  slug_candidate text;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if char_length(clean_display_name) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters'
      using errcode = '22023';
  end if;

  if char_length(clean_workspace_name) not between 2 and 80 then
    raise exception 'Workspace name must be between 2 and 80 characters'
      using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name)
  values (actor_id, clean_display_name)
  on conflict (id) do update
  set display_name = excluded.display_name;

  select membership.workspace_id, workspace.slug::text
  into workspace_id, workspace_slug
  from public.workspace_members as membership
  inner join public.workspaces as workspace
    on workspace.id = membership.workspace_id
  where membership.user_id = actor_id
  order by membership.joined_at, membership.workspace_id
  limit 1;

  if workspace_id is not null then
    return next;
    return;
  end if;

  slug_base := trim(
    both '-' from regexp_replace(
      lower(clean_workspace_name),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );

  if char_length(slug_base) < 2 then
    slug_base := 'workspace';
  end if;

  slug_base := left(slug_base, 40);
  slug_candidate := slug_base;

  loop
    insert into public.workspaces (name, slug, created_by)
    values (clean_workspace_name, slug_candidate, actor_id)
    on conflict (slug) do nothing
    returning id, slug::text into workspace_id, workspace_slug;

    exit when workspace_id is not null;

    slug_candidate := left(slug_base, 40)
      || '-'
      || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end loop;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, actor_id, 'owner');

  return next;
end;
$$;

revoke all on function public.complete_onboarding(text, text) from public;
revoke all on function public.complete_onboarding(text, text) from anon;
revoke all on function public.complete_onboarding(text, text) from authenticated;

grant execute on function public.complete_onboarding(text, text)
  to authenticated, service_role;
