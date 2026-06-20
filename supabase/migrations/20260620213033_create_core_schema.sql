create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.task_priority as enum (
  'no_priority',
  'low',
  'medium',
  'high',
  'urgent'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_length_check
    check (char_length(trim(display_name)) between 1 and 80),
  avatar_path text
    constraint profiles_avatar_path_length_check
    check (avatar_path is null or char_length(avatar_path) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint workspaces_name_length_check
    check (char_length(trim(name)) between 1 and 80),
  slug extensions.citext not null unique
    constraint workspaces_slug_format_check
    check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug::text) between 2 and 48),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_id_key unique (id)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create unique index workspace_members_one_owner_idx
  on public.workspace_members (workspace_id)
  where role = 'owner';

create index workspace_members_user_id_idx
  on public.workspace_members (user_id, workspace_id);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email extensions.citext not null
    constraint workspace_invitations_email_length_check
    check (char_length(email::text) between 3 and 320),
  role public.workspace_role not null default 'member'
    constraint workspace_invitations_role_check
    check (role <> 'owner'),
  token_hash text not null unique
    constraint workspace_invitations_token_hash_length_check
    check (char_length(token_hash) between 32 and 256),
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint workspace_invitations_expiry_check check (expires_at > created_at),
  constraint workspace_invitations_terminal_state_check check (
    accepted_at is null or revoked_at is null
  )
);

create unique index workspace_invitations_pending_email_idx
  on public.workspace_invitations (workspace_id, lower(email::text))
  where accepted_at is null and revoked_at is null;

create index workspace_invitations_expires_at_idx
  on public.workspace_invitations (expires_at)
  where accepted_at is null and revoked_at is null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null
    constraint projects_name_length_check
    check (char_length(trim(name)) between 1 and 100),
  key text not null
    constraint projects_key_format_check
    check (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  color text not null default '#6366F1'
    constraint projects_color_format_check
    check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text
    constraint projects_description_length_check
    check (description is null or char_length(description) <= 2000),
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_workspace_key_key unique (workspace_id, key),
  constraint projects_id_workspace_id_key unique (id, workspace_id)
);

create index projects_workspace_active_idx
  on public.projects (workspace_id, created_at desc)
  where archived_at is null;

create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  name text not null
    constraint board_columns_name_length_check
    check (char_length(trim(name)) between 1 and 60),
  position bigint not null
    constraint board_columns_position_check
    check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_columns_project_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade,
  constraint board_columns_project_position_key unique (project_id, position),
  constraint board_columns_id_workspace_project_key unique (id, workspace_id, project_id)
);

create index board_columns_workspace_id_idx
  on public.board_columns (workspace_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  column_id uuid not null,
  title text not null
    constraint tasks_title_length_check
    check (char_length(trim(title)) between 1 and 240),
  description text
    constraint tasks_description_length_check
    check (description is null or char_length(description) <= 50000),
  assignee_id uuid,
  priority public.task_priority not null default 'no_priority',
  due_date date,
  position bigint not null
    constraint tasks_position_check
    check (position >= 0),
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_project_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade,
  constraint tasks_column_fkey
    foreign key (column_id, workspace_id, project_id)
    references public.board_columns (id, workspace_id, project_id),
  constraint tasks_assignee_membership_fkey
    foreign key (workspace_id, assignee_id)
    references public.workspace_members (workspace_id, user_id)
    on delete set null (assignee_id),
  constraint tasks_id_workspace_project_key unique (id, workspace_id, project_id)
);

create unique index tasks_column_position_active_idx
  on public.tasks (column_id, position)
  where archived_at is null;

create index tasks_project_active_idx
  on public.tasks (project_id, column_id, position)
  where archived_at is null;

create index tasks_workspace_assignee_idx
  on public.tasks (workspace_id, assignee_id)
  where assignee_id is not null and archived_at is null;

create index tasks_due_date_idx
  on public.tasks (workspace_id, due_date)
  where due_date is not null and archived_at is null;

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  name text not null
    constraint labels_name_length_check
    check (char_length(trim(name)) between 1 and 50),
  color text not null
    constraint labels_color_format_check
    check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint labels_project_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade,
  constraint labels_project_name_key unique (project_id, name),
  constraint labels_id_workspace_project_key unique (id, workspace_id, project_id)
);

create index labels_workspace_id_idx on public.labels (workspace_id);

create table public.task_labels (
  workspace_id uuid not null,
  project_id uuid not null,
  task_id uuid not null,
  label_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (task_id, label_id),
  constraint task_labels_task_fkey
    foreign key (task_id, workspace_id, project_id)
    references public.tasks (id, workspace_id, project_id)
    on delete cascade,
  constraint task_labels_label_fkey
    foreign key (label_id, workspace_id, project_id)
    references public.labels (id, workspace_id, project_id)
    on delete cascade
);

create index task_labels_label_id_idx on public.task_labels (label_id);
create index task_labels_workspace_id_idx on public.task_labels (workspace_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  task_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    constraint comments_body_length_check
    check (char_length(trim(body)) between 1 and 10000),
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_task_fkey
    foreign key (task_id, workspace_id, project_id)
    references public.tasks (id, workspace_id, project_id)
    on delete cascade
);

create index comments_task_created_at_idx
  on public.comments (task_id, created_at);
create index comments_workspace_id_idx on public.comments (workspace_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  task_id uuid not null,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique
    constraint attachments_storage_path_length_check
    check (char_length(storage_path) between 1 and 1000),
  file_name text not null
    constraint attachments_file_name_length_check
    check (char_length(trim(file_name)) between 1 and 255),
  content_type text not null
    constraint attachments_content_type_length_check
    check (char_length(content_type) between 1 and 255),
  size_bytes bigint not null
    constraint attachments_size_check
    check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  constraint attachments_task_fkey
    foreign key (task_id, workspace_id, project_id)
    references public.tasks (id, workspace_id, project_id)
    on delete cascade
);

create index attachments_task_created_at_idx
  on public.attachments (task_id, created_at);
create index attachments_workspace_id_idx on public.attachments (workspace_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger board_columns_set_updated_at
before update on public.board_columns
for each row execute function private.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

create trigger labels_set_updated_at
before update on public.labels
for each row execute function private.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'User'
      ),
      80
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

insert into public.profiles (id, display_name)
select
  users.id,
  left(
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
      'User'
    ),
    80
  )
from auth.users as users
on conflict (id) do nothing;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
  );
$$;

create function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
      and membership.role = any (allowed_roles)
  );
$$;

create function private.can_claim_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces as workspace
    where workspace.id = target_workspace_id
      and workspace.created_by = auth.uid()
      and not exists (
        select 1
        from public.workspace_members as membership
        where membership.workspace_id = target_workspace_id
      )
  );
$$;

create function private.shares_workspace(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as own_membership
    inner join public.workspace_members as target_membership
      on target_membership.workspace_id = own_membership.workspace_id
    where own_membership.user_id = auth.uid()
      and target_membership.user_id = target_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects enable row level security;
alter table public.board_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

create policy "profiles_select_shared_workspace"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.shares_workspace(id))
);

create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "workspaces_select_member_or_creator"
on public.workspaces for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.is_workspace_member(id))
);

create policy "workspaces_insert_creator"
on public.workspaces for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "workspaces_update_managers"
on public.workspaces for update
to authenticated
using (
  (select private.has_workspace_role(
    id,
    array['owner', 'admin']::public.workspace_role[]
  ))
)
with check (
  (select private.has_workspace_role(
    id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "workspaces_delete_owner"
on public.workspaces for delete
to authenticated
using (
  (select private.has_workspace_role(
    id,
    array['owner']::public.workspace_role[]
  ))
);

create policy "workspace_members_select_members"
on public.workspace_members for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "workspace_members_insert_managers_or_initial_owner"
on public.workspace_members for insert
to authenticated
with check (
  (
    role <> 'owner'
    and (select private.has_workspace_role(
      workspace_id,
      array['owner', 'admin']::public.workspace_role[]
    ))
  )
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and (select private.can_claim_workspace(workspace_id))
  )
);

create policy "workspace_members_update_non_owners"
on public.workspace_members for update
to authenticated
using (
  role <> 'owner'
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
)
with check (
  role <> 'owner'
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "workspace_members_delete_non_owners"
on public.workspace_members for delete
to authenticated
using (
  role <> 'owner'
  and (
    user_id = (select auth.uid())
    or (select private.has_workspace_role(
      workspace_id,
      array['owner', 'admin']::public.workspace_role[]
    ))
  )
);

create policy "workspace_invitations_select_managers"
on public.workspace_invitations for select
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "workspace_invitations_insert_managers"
on public.workspace_invitations for insert
to authenticated
with check (
  role <> 'owner'
  and invited_by = (select auth.uid())
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "workspace_invitations_update_managers"
on public.workspace_invitations for update
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
)
with check (
  role <> 'owner'
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "workspace_invitations_delete_managers"
on public.workspace_invitations for delete
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "projects_select_members"
on public.projects for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "projects_insert_managers"
on public.projects for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "projects_update_managers"
on public.projects for update
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

create policy "board_columns_select_members"
on public.board_columns for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "board_columns_insert_managers"
on public.board_columns for insert
to authenticated
with check (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "board_columns_update_managers"
on public.board_columns for update
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

create policy "board_columns_delete_managers"
on public.board_columns for delete
to authenticated
using (
  (select private.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ))
);

create policy "tasks_select_members"
on public.tasks for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "tasks_insert_members"
on public.tasks for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "tasks_update_members"
on public.tasks for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "labels_select_members"
on public.labels for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "labels_insert_members"
on public.labels for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "labels_update_members"
on public.labels for update
to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "labels_delete_members"
on public.labels for delete
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "task_labels_select_members"
on public.task_labels for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "task_labels_insert_members"
on public.task_labels for insert
to authenticated
with check ((select private.is_workspace_member(workspace_id)));

create policy "task_labels_delete_members"
on public.task_labels for delete
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "comments_select_members"
on public.comments for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "comments_insert_author"
on public.comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "comments_update_author"
on public.comments for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "comments_delete_author"
on public.comments for delete
to authenticated
using (
  author_id = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "attachments_select_members"
on public.attachments for select
to authenticated
using ((select private.is_workspace_member(workspace_id)));

create policy "attachments_insert_uploader"
on public.attachments for insert
to authenticated
with check (
  uploader_id = (select auth.uid())
  and (select private.is_workspace_member(workspace_id))
);

create policy "attachments_delete_uploader_or_manager"
on public.attachments for delete
to authenticated
using (
  (select private.is_workspace_member(workspace_id))
  and (
    uploader_id = (select auth.uid())
    or (select private.has_workspace_role(
      workspace_id,
      array['owner', 'admin']::public.workspace_role[]
    ))
  )
);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.workspace_invitations from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.board_columns from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.labels from anon, authenticated;
revoke all on table public.task_labels from anon, authenticated;
revoke all on table public.comments from anon, authenticated;
revoke all on table public.attachments from anon, authenticated;

grant select, insert on table public.profiles to authenticated;
grant update (display_name, avatar_path) on table public.profiles to authenticated;

grant select, insert, delete on table public.workspaces to authenticated;
grant update (name, slug) on table public.workspaces to authenticated;

grant select, insert, delete on table public.workspace_members to authenticated;
grant update (role) on table public.workspace_members to authenticated;

grant select, insert, delete on table public.workspace_invitations to authenticated;
grant update (email, role, expires_at, accepted_at, revoked_at)
  on table public.workspace_invitations to authenticated;

grant select, insert on table public.projects to authenticated;
grant update (name, key, color, description, archived_at)
  on table public.projects to authenticated;

grant select, insert, delete on table public.board_columns to authenticated;
grant update (name, position) on table public.board_columns to authenticated;

grant select, insert on table public.tasks to authenticated;
grant update (
  title,
  description,
  column_id,
  assignee_id,
  priority,
  due_date,
  position,
  archived_at
) on table public.tasks to authenticated;

grant select, insert, delete on table public.labels to authenticated;
grant update (name, color) on table public.labels to authenticated;

grant select, insert, delete on table public.task_labels to authenticated;

grant select, insert, delete on table public.comments to authenticated;
grant update (body, edited_at) on table public.comments to authenticated;

grant select, insert, delete on table public.attachments to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.workspaces to service_role;
grant all on table public.workspace_members to service_role;
grant all on table public.workspace_invitations to service_role;
grant all on table public.projects to service_role;
grant all on table public.board_columns to service_role;
grant all on table public.tasks to service_role;
grant all on table public.labels to service_role;
grant all on table public.task_labels to service_role;
grant all on table public.comments to service_role;
grant all on table public.attachments to service_role;

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_role(uuid, public.workspace_role[]) from public;
revoke all on function private.can_claim_workspace(uuid) from public;
revoke all on function private.shares_workspace(uuid) from public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[])
  to authenticated, service_role;
grant execute on function private.can_claim_workspace(uuid) to authenticated, service_role;
grant execute on function private.shares_workspace(uuid) to authenticated, service_role;

grant usage on type public.workspace_role to authenticated, service_role;
grant usage on type public.task_priority to authenticated, service_role;
