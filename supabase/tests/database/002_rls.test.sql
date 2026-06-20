begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'owner@alpha.test'),
  ('10000000-0000-4000-8000-000000000002', 'admin@alpha.test'),
  ('10000000-0000-4000-8000-000000000003', 'member@alpha.test'),
  ('10000000-0000-4000-8000-000000000004', 'outsider@beta.test');

insert into public.workspaces (id, name, slug, created_by)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Alpha',
    'alpha',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Beta',
    'beta',
    '10000000-0000-4000-8000-000000000004'
  );

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'admin'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'member'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000004',
    'owner'
  );

insert into public.projects (id, workspace_id, name, key, created_by)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Alpha project',
    'ALPHA',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'Beta project',
    'BETA',
    '10000000-0000-4000-8000-000000000004'
  );

insert into public.board_columns (id, workspace_id, project_id, name, position)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Backlog',
    1024
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'Backlog',
    1024
  );

insert into public.tasks (
  id,
  workspace_id,
  project_id,
  column_id,
  title,
  position,
  created_by
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Alpha task',
    1024,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Beta task',
    1024,
    '10000000-0000-4000-8000-000000000004'
  );

insert into public.comments (
  id,
  workspace_id,
  project_id,
  task_id,
  author_id,
  body
)
values (
  '60000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'Admin comment'
);

insert into public.labels (id, workspace_id, project_id, name, color, created_by)
values (
  '80000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'Design',
  '#6366F1',
  '10000000-0000-4000-8000-000000000001'
);

insert into public.task_labels (workspace_id, project_id, task_id, label_id)
values (
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000001'
);

insert into public.attachments (
  id,
  workspace_id,
  project_id,
  task_id,
  uploader_id,
  storage_path,
  file_name,
  content_type,
  size_bytes
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'alpha/project/task/attachment-one',
    'brief.pdf',
    'application/pdf',
    1024
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'alpha/project/task/attachment-two',
    'notes.txt',
    'text/plain',
    256
  );

select is(
  (select count(*) from public.profiles),
  4::bigint,
  'auth user trigger creates all profiles'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select results_eq(
  $$ select id from public.workspaces order by id $$,
  $$ values ('20000000-0000-4000-8000-000000000001'::uuid) $$,
  'owner sees only their workspace'
);

select is(
  (select count(*) from public.profiles),
  3::bigint,
  'owner sees profiles that share a workspace'
);

select lives_ok(
  $$ update public.workspaces
     set name = 'Alpha renamed'
     where id = '20000000-0000-4000-8000-000000000001' $$,
  'owner can update workspace settings'
);

select results_eq(
  $$ with deleted as (
       delete from public.attachments
       where id = '70000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from deleted $$,
  $$ values (1::bigint) $$,
  'owner can remove a member attachment'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ insert into public.workspace_invitations (
       workspace_id,
       email,
       role,
       token_hash,
       invited_by,
       expires_at
     ) values (
       '20000000-0000-4000-8000-000000000001',
       'invitee@alpha.test',
       'member',
       'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
       '10000000-0000-4000-8000-000000000002',
       now() + interval '7 days'
     ) $$,
  'admin can create invitations'
);

select lives_ok(
  $$ insert into public.projects (
       workspace_id,
       name,
       key,
       created_by
     ) values (
       '20000000-0000-4000-8000-000000000001',
       'Admin project',
       'ADMIN',
       '10000000-0000-4000-8000-000000000002'
     ) $$,
  'admin can create projects'
);

select results_eq(
  $$ with changed as (
       update public.workspace_members
       set role = 'member'
       where workspace_id = '20000000-0000-4000-8000-000000000001'
         and user_id = '10000000-0000-4000-8000-000000000003'
       returning 1
     )
     select count(*) from changed $$,
  $$ values (1::bigint) $$,
  'admin can manage non-owner roles'
);

select results_eq(
  $$ with changed as (
       update public.workspace_members
       set role = 'admin'
       where workspace_id = '20000000-0000-4000-8000-000000000001'
         and user_id = '10000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from changed $$,
  $$ values (0::bigint) $$,
  'admin cannot change the owner role'
);

select results_eq(
  $$ with deleted as (
       delete from public.workspaces
       where id = '20000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from deleted $$,
  $$ values (0::bigint) $$,
  'admin cannot delete a workspace'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';

select results_eq(
  $$ select id from public.workspaces order by id $$,
  $$ values ('20000000-0000-4000-8000-000000000001'::uuid) $$,
  'member sees only their workspace'
);

select results_eq(
  $$ select id from public.tasks order by id $$,
  $$ values ('50000000-0000-4000-8000-000000000001'::uuid) $$,
  'member sees tasks only inside their workspace'
);

select lives_ok(
  $$ insert into public.tasks (
       workspace_id,
       project_id,
       column_id,
       title,
       position,
       created_by
     ) values (
       '20000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000001',
       '40000000-0000-4000-8000-000000000001',
       'Member task',
       2048,
       '10000000-0000-4000-8000-000000000003'
     ) $$,
  'member can create tasks'
);

select lives_ok(
  $$ update public.tasks
     set title = 'Member updated task'
     where id = '50000000-0000-4000-8000-000000000001' $$,
  'member can update tasks'
);

select throws_ok(
  $$ insert into public.projects (
       workspace_id,
       name,
       key,
       created_by
     ) values (
       '20000000-0000-4000-8000-000000000001',
       'Forbidden project',
       'NOPE',
       '10000000-0000-4000-8000-000000000003'
     ) $$,
  '42501',
  null,
  'member cannot create projects'
);

select throws_ok(
  $$ insert into public.workspace_invitations (
       workspace_id,
       email,
       token_hash,
       invited_by,
       expires_at
     ) values (
       '20000000-0000-4000-8000-000000000001',
       'forbidden@alpha.test',
       'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
       '10000000-0000-4000-8000-000000000003',
       now() + interval '7 days'
     ) $$,
  '42501',
  null,
  'member cannot create invitations'
);

select lives_ok(
  $$ insert into public.comments (
       workspace_id,
       project_id,
       task_id,
       author_id,
       body
     ) values (
       '20000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000001',
       '50000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000003',
       'Member comment'
     ) $$,
  'member can add their own comment'
);

select results_eq(
  $$ with changed as (
       update public.comments
       set body = 'Tampered'
       where id = '60000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from changed $$,
  $$ values (0::bigint) $$,
  'member cannot edit another user comment'
);

select throws_ok(
  $$ update public.tasks
     set assignee_id = '10000000-0000-4000-8000-000000000004'
     where id = '50000000-0000-4000-8000-000000000001' $$,
  '23503',
  null,
  'task assignee must belong to the workspace'
);

select lives_ok(
  $$ insert into public.workspaces (id, name, slug, created_by)
     values (
       '20000000-0000-4000-8000-000000000003',
       'Gamma',
       'gamma',
       '10000000-0000-4000-8000-000000000003'
     ) $$,
  'authenticated user can create a workspace'
);

select lives_ok(
  $$ insert into public.workspace_members (workspace_id, user_id, role)
     values (
       '20000000-0000-4000-8000-000000000003',
       '10000000-0000-4000-8000-000000000003',
       'owner'
     ) $$,
  'workspace creator can claim initial ownership'
);

select is(
  (
    select role
    from public.workspace_members
    where workspace_id = '20000000-0000-4000-8000-000000000003'
      and user_id = '10000000-0000-4000-8000-000000000003'
  ),
  'owner'::public.workspace_role,
  'new workspace has the creator as owner'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000004';

select results_eq(
  $$ select id from public.workspaces order by id $$,
  $$ values ('20000000-0000-4000-8000-000000000002'::uuid) $$,
  'outsider sees only their own workspace'
);

select results_eq(
  $$ select id from public.tasks order by id $$,
  $$ values ('50000000-0000-4000-8000-000000000002'::uuid) $$,
  'outsider cannot read tasks from another workspace'
);

select results_eq(
  $$ select
       (select count(*) from public.workspace_members
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.workspace_invitations
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.projects
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.board_columns
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.tasks
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.labels
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.task_labels
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.comments
         where workspace_id = '20000000-0000-4000-8000-000000000001'),
       (select count(*) from public.attachments
         where workspace_id = '20000000-0000-4000-8000-000000000001') $$,
  $$ values (
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint,
       0::bigint
     ) $$,
  'outsider sees no rows from another workspace across all scoped tables'
);

select throws_ok(
  $$ insert into public.tasks (
       workspace_id,
       project_id,
       column_id,
       title,
       position,
       created_by
     ) values (
       '20000000-0000-4000-8000-000000000001',
       '30000000-0000-4000-8000-000000000001',
       '40000000-0000-4000-8000-000000000001',
       'Cross-workspace task',
       3072,
       '10000000-0000-4000-8000-000000000004'
     ) $$,
  '42501',
  null,
  'outsider cannot create tasks in another workspace'
);

set local role anon;

select throws_ok(
  $$ select * from public.workspaces $$,
  '42501',
  null,
  'anonymous requests have no table access'
);

reset role;

select * from finish();

rollback;
