create function public.create_project(
  target_workspace_id uuid,
  project_name text,
  project_key text,
  project_color text,
  project_description text
)
returns table (
  project_id uuid,
  workspace_id uuid,
  name text,
  key text,
  color text,
  description text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_name text := trim(project_name);
  clean_key text := upper(trim(project_key));
  clean_color text := upper(trim(project_color));
  clean_description text := nullif(trim(project_description), '');
  created_project public.projects%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = actor_id
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  if char_length(clean_name) not between 1 and 100 then
    raise exception 'Project name must be between 1 and 100 characters'
      using errcode = '22023';
  end if;

  if clean_key !~ '^[A-Z][A-Z0-9]{1,9}$' then
    raise exception 'Project key must contain 2 to 10 uppercase letters or numbers'
      using errcode = '22023';
  end if;

  if clean_color !~ '^#[0-9A-F]{6}$' then
    raise exception 'Project color must be a six-digit hex color'
      using errcode = '22023';
  end if;

  if char_length(coalesce(clean_description, '')) > 2000 then
    raise exception 'Project description must not exceed 2000 characters'
      using errcode = '22023';
  end if;

  begin
    insert into public.projects (
      workspace_id,
      name,
      key,
      color,
      description,
      created_by
    ) values (
      target_workspace_id,
      clean_name,
      clean_key,
      clean_color,
      clean_description,
      actor_id
    )
    returning * into created_project;
  exception
    when unique_violation then
      raise exception 'Project key already exists in this workspace'
        using errcode = '23505';
  end;

  insert into public.board_columns (workspace_id, project_id, name, position)
  values
    (target_workspace_id, created_project.id, 'Backlog', 1000),
    (target_workspace_id, created_project.id, 'To do', 2000),
    (target_workspace_id, created_project.id, 'In progress', 3000),
    (target_workspace_id, created_project.id, 'Review', 4000),
    (target_workspace_id, created_project.id, 'Done', 5000);

  return query
  select
    created_project.id,
    created_project.workspace_id,
    created_project.name,
    created_project.key,
    created_project.color,
    created_project.description;
end;
$$;

revoke all on function public.create_project(uuid, text, text, text, text)
  from public;

grant execute on function public.create_project(uuid, text, text, text, text)
  to authenticated, service_role;
