drop policy "labels_insert_members" on public.labels;
drop policy "labels_update_members" on public.labels;
drop policy "labels_delete_members" on public.labels;

create policy "labels_insert_managers"
on public.labels for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "labels_update_managers"
on public.labels for update
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
)
with check (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "labels_delete_managers"
on public.labels for delete
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create function public.create_task(
  target_workspace_id uuid,
  target_project_id uuid,
  target_column_id uuid,
  task_title text,
  task_description text,
  task_priority public.task_priority,
  task_assignee_id uuid default null,
  task_due_date date default null,
  task_label_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_title text := trim(task_title);
  clean_description text := nullif(trim(task_description), '');
  clean_label_ids uuid[];
  next_position bigint;
  created_task_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = actor_id
  ) then
    raise exception 'Workspace membership required' using errcode = '42501';
  end if;

  if char_length(clean_title) not between 1 and 240 then
    raise exception 'Task title must be between 1 and 240 characters'
      using errcode = '22023';
  end if;

  if char_length(coalesce(clean_description, '')) > 50000 then
    raise exception 'Task description must not exceed 50000 characters'
      using errcode = '22023';
  end if;

  if task_priority is null then
    raise exception 'Task priority is required' using errcode = '22023';
  end if;

  perform 1
  from public.board_columns as board_column
  inner join public.projects as project
    on project.id = board_column.project_id
   and project.workspace_id = board_column.workspace_id
  where board_column.id = target_column_id
    and board_column.project_id = target_project_id
    and board_column.workspace_id = target_workspace_id
    and project.archived_at is null
  for update of board_column;

  if not found then
    raise exception 'Active project column not found' using errcode = 'P0002';
  end if;

  if task_assignee_id is not null and not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = task_assignee_id
  ) then
    raise exception 'Assignee must be a workspace member' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct requested_label_id), '{}'::uuid[])
  into clean_label_ids
  from unnest(coalesce(task_label_ids, '{}'::uuid[])) as requested_label_id;

  if exists (
    select 1
    from unnest(clean_label_ids) as requested_label_id
    left join public.labels as label
      on label.id = requested_label_id
     and label.workspace_id = target_workspace_id
     and label.project_id = target_project_id
    where label.id is null
  ) then
    raise exception 'Every label must belong to the task project'
      using errcode = '22023';
  end if;

  select coalesce(max(task.position), 0) + 1024
  into next_position
  from public.tasks as task
  where task.column_id = target_column_id
    and task.archived_at is null;

  insert into public.tasks (
    workspace_id,
    project_id,
    column_id,
    title,
    description,
    assignee_id,
    priority,
    due_date,
    position,
    created_by
  ) values (
    target_workspace_id,
    target_project_id,
    target_column_id,
    clean_title,
    clean_description,
    task_assignee_id,
    task_priority,
    task_due_date,
    next_position,
    actor_id
  )
  returning id into created_task_id;

  insert into public.task_labels (workspace_id, project_id, task_id, label_id)
  select target_workspace_id, target_project_id, created_task_id, label_id
  from unnest(clean_label_ids) as label_id;

  return created_task_id;
end;
$$;

create function public.update_task(
  target_task_id uuid,
  task_title text,
  task_description text,
  task_priority public.task_priority,
  task_assignee_id uuid default null,
  task_due_date date default null,
  task_label_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_title text := trim(task_title);
  clean_description text := nullif(trim(task_description), '');
  clean_label_ids uuid[];
  task_record public.tasks%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select task.*
  into task_record
  from public.tasks as task
  inner join public.projects as project
    on project.id = task.project_id
   and project.workspace_id = task.workspace_id
  where task.id = target_task_id
    and task.archived_at is null
    and project.archived_at is null
  for update of task;

  if task_record.id is null then
    raise exception 'Active task not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = task_record.workspace_id
      and membership.user_id = actor_id
  ) then
    raise exception 'Workspace membership required' using errcode = '42501';
  end if;

  if char_length(clean_title) not between 1 and 240 then
    raise exception 'Task title must be between 1 and 240 characters'
      using errcode = '22023';
  end if;

  if char_length(coalesce(clean_description, '')) > 50000 then
    raise exception 'Task description must not exceed 50000 characters'
      using errcode = '22023';
  end if;

  if task_priority is null then
    raise exception 'Task priority is required' using errcode = '22023';
  end if;

  if task_assignee_id is not null and not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = task_record.workspace_id
      and membership.user_id = task_assignee_id
  ) then
    raise exception 'Assignee must be a workspace member' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct requested_label_id), '{}'::uuid[])
  into clean_label_ids
  from unnest(coalesce(task_label_ids, '{}'::uuid[])) as requested_label_id;

  if exists (
    select 1
    from unnest(clean_label_ids) as requested_label_id
    left join public.labels as label
      on label.id = requested_label_id
     and label.workspace_id = task_record.workspace_id
     and label.project_id = task_record.project_id
    where label.id is null
  ) then
    raise exception 'Every label must belong to the task project'
      using errcode = '22023';
  end if;

  update public.tasks
  set title = clean_title,
      description = clean_description,
      assignee_id = task_assignee_id,
      priority = task_priority,
      due_date = task_due_date
  where id = task_record.id;

  delete from public.task_labels
  where task_id = task_record.id;

  insert into public.task_labels (workspace_id, project_id, task_id, label_id)
  select
    task_record.workspace_id,
    task_record.project_id,
    task_record.id,
    label_id
  from unnest(clean_label_ids) as label_id;
end;
$$;

create function public.move_task(target_task_id uuid, target_column_id uuid)
returns table (new_column_id uuid, new_position bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  task_record public.tasks%rowtype;
  next_position bigint;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select task.*
  into task_record
  from public.tasks as task
  inner join public.projects as project
    on project.id = task.project_id
   and project.workspace_id = task.workspace_id
  where task.id = target_task_id
    and task.archived_at is null
    and project.archived_at is null
  for update of task;

  if task_record.id is null then
    raise exception 'Active task not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = task_record.workspace_id
      and membership.user_id = actor_id
  ) then
    raise exception 'Workspace membership required' using errcode = '42501';
  end if;

  perform 1
  from public.board_columns as board_column
  where board_column.id = target_column_id
    and board_column.workspace_id = task_record.workspace_id
    and board_column.project_id = task_record.project_id
  for update;

  if not found then
    raise exception 'Target column must belong to the task project'
      using errcode = '22023';
  end if;

  select coalesce(max(task.position), 0) + 1024
  into next_position
  from public.tasks as task
  where task.column_id = target_column_id
    and task.id <> task_record.id
    and task.archived_at is null;

  update public.tasks
  set column_id = target_column_id,
      position = next_position
  where id = task_record.id;

  return query select target_column_id, next_position;
end;
$$;

create function public.set_task_archived(
  target_task_id uuid,
  should_archive boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  task_record public.tasks%rowtype;
  next_position bigint;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select task.*
  into task_record
  from public.tasks as task
  inner join public.projects as project
    on project.id = task.project_id
   and project.workspace_id = task.workspace_id
  where task.id = target_task_id
    and project.archived_at is null
  for update of task;

  if task_record.id is null then
    raise exception 'Task not found in an active project' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = task_record.workspace_id
      and membership.user_id = actor_id
  ) then
    raise exception 'Workspace membership required' using errcode = '42501';
  end if;

  if should_archive then
    update public.tasks
    set archived_at = coalesce(archived_at, now())
    where id = task_record.id;
    return;
  end if;

  if task_record.archived_at is null then
    return;
  end if;

  perform 1
  from public.board_columns as board_column
  where board_column.id = task_record.column_id
  for update;

  select coalesce(max(task.position), 0) + 1024
  into next_position
  from public.tasks as task
  where task.column_id = task_record.column_id
    and task.archived_at is null;

  update public.tasks
  set archived_at = null,
      position = next_position
  where id = task_record.id;
end;
$$;

revoke all on function public.create_task(
  uuid,
  uuid,
  uuid,
  text,
  text,
  public.task_priority,
  uuid,
  date,
  uuid[]
) from public;
revoke all on function public.update_task(
  uuid,
  text,
  text,
  public.task_priority,
  uuid,
  date,
  uuid[]
) from public;
revoke all on function public.move_task(uuid, uuid) from public;
revoke all on function public.set_task_archived(uuid, boolean) from public;

grant execute on function public.create_task(
  uuid,
  uuid,
  uuid,
  text,
  text,
  public.task_priority,
  uuid,
  date,
  uuid[]
) to authenticated, service_role;
grant execute on function public.update_task(
  uuid,
  text,
  text,
  public.task_priority,
  uuid,
  date,
  uuid[]
) to authenticated, service_role;
grant execute on function public.move_task(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.set_task_archived(uuid, boolean)
  to authenticated, service_role;
