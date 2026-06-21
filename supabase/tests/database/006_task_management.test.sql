begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

create temporary table test_task_ids (id uuid primary key);
grant select, insert on test_task_ids to authenticated;

select has_function(
  'public',
  'create_task',
  array[
    'uuid', 'uuid', 'uuid', 'text', 'text', 'task_priority',
    'uuid', 'date', 'uuid[]'
  ],
  'atomic task creation function exists'
);

select has_function(
  'public',
  'update_task',
  array['uuid', 'text', 'text', 'task_priority', 'uuid', 'date', 'uuid[]'],
  'atomic task update function exists'
);

select has_function(
  'public',
  'move_task',
  array['uuid', 'uuid'],
  'transactional task movement function exists'
);

select has_function(
  'public',
  'set_task_archived',
  array['uuid', 'boolean'],
  'task archive and restore function exists'
);

insert into auth.users (id, email)
values
  ('13000000-0000-4000-8000-000000000001', 'owner@tasks.test'),
  ('13000000-0000-4000-8000-000000000002', 'admin@tasks.test'),
  ('13000000-0000-4000-8000-000000000003', 'member@tasks.test'),
  ('13000000-0000-4000-8000-000000000004', 'outsider@tasks.test');

insert into public.workspaces (id, name, slug, created_by)
values
  (
    '23000000-0000-4000-8000-000000000001',
    'Tasks Alpha',
    'tasks-alpha',
    '13000000-0000-4000-8000-000000000001'
  ),
  (
    '23000000-0000-4000-8000-000000000002',
    'Tasks Beta',
    'tasks-beta',
    '13000000-0000-4000-8000-000000000004'
  );

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '23000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '23000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    'admin'
  ),
  (
    '23000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000003',
    'member'
  ),
  (
    '23000000-0000-4000-8000-000000000002',
    '13000000-0000-4000-8000-000000000004',
    'owner'
  );

insert into public.projects (id, workspace_id, name, key, created_by)
values
  (
    '33000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    'Alpha delivery',
    'ALPHA',
    '13000000-0000-4000-8000-000000000001'
  ),
  (
    '33000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000001',
    'Another project',
    'OTHER',
    '13000000-0000-4000-8000-000000000001'
  );

insert into public.board_columns (id, workspace_id, project_id, name, position)
values
  (
    '43000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    'Backlog',
    1000
  ),
  (
    '43000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    'Done',
    2000
  ),
  (
    '43000000-0000-4000-8000-000000000003',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000002',
    'Backlog',
    1000
  );

insert into public.labels (id, workspace_id, project_id, name, color, created_by)
values
  (
    '73000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    'Feature',
    '#6366F1',
    '13000000-0000-4000-8000-000000000001'
  ),
  (
    '73000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    'Urgent',
    '#F43F5E',
    '13000000-0000-4000-8000-000000000001'
  ),
  (
    '73000000-0000-4000-8000-000000000003',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000002',
    'Foreign',
    '#F59E0B',
    '13000000-0000-4000-8000-000000000001'
  );

set local role authenticated;
set local request.jwt.claim.sub = '13000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ insert into public.labels (
       workspace_id, project_id, name, color, created_by
     ) values (
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       'Owner label',
       '#0EA5E9',
       '13000000-0000-4000-8000-000000000001'
     ) $$,
  'Owner can create project labels'
);

set local request.jwt.claim.sub = '13000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ insert into public.labels (
       workspace_id, project_id, name, color, created_by
     ) values (
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       'Admin label',
       '#10B981',
       '13000000-0000-4000-8000-000000000002'
     ) $$,
  'Admin can create project labels'
);

set local request.jwt.claim.sub = '13000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ insert into public.labels (
       workspace_id, project_id, name, color, created_by
     ) values (
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       'Member label',
       '#D946EF',
       '13000000-0000-4000-8000-000000000003'
     ) $$,
  '42501',
  null,
  'Member cannot create project labels'
);

select results_eq(
  $$ with changed as (
       update public.labels
       set name = 'Tampered'
       where id = '73000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from changed $$,
  $$ values (0::bigint) $$,
  'Member cannot update project labels'
);

select results_eq(
  $$ with deleted as (
       delete from public.labels
       where id = '73000000-0000-4000-8000-000000000001'
       returning 1
     )
     select count(*) from deleted $$,
  $$ values (0::bigint) $$,
  'Member cannot delete project labels'
);

select lives_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       '  Prepare launch brief  ',
       '  Define the release story.  ',
       'high',
       '13000000-0000-4000-8000-000000000003',
       '2026-07-01',
       array[
         '73000000-0000-4000-8000-000000000001',
         '73000000-0000-4000-8000-000000000002'
       ]::uuid[]
     ) $$,
  'Member can create a fully populated task'
);

select results_eq(
  $$ select title, description, assignee_id, priority::text, due_date
     from public.tasks
     where title = 'Prepare launch brief' $$,
  $$ values (
       'Prepare launch brief'::text,
       'Define the release story.'::text,
       '13000000-0000-4000-8000-000000000003'::uuid,
       'high'::text,
       '2026-07-01'::date
     ) $$,
  'task input and metadata are stored correctly'
);

select is(
  (select position from public.tasks where title = 'Prepare launch brief'),
  1024::bigint,
  'first task receives the initial stable position'
);

select results_eq(
  $$ select label_id
     from public.task_labels
     where task_id = (select id from public.tasks where title = 'Prepare launch brief')
     order by label_id $$,
  $$ values
       ('73000000-0000-4000-8000-000000000001'::uuid),
       ('73000000-0000-4000-8000-000000000002'::uuid) $$,
  'task labels are assigned atomically'
);

select lives_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       'Second task',
       '',
       'no_priority',
       null,
       null,
       '{}'::uuid[]
     ) $$,
  'Member can create an unassigned task'
);

select is(
  (select position from public.tasks where title = 'Second task'),
  2048::bigint,
  'new tasks append with a stable ordering gap'
);

insert into test_task_ids (id)
select id from public.tasks where title = 'Second task';

select throws_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       'Foreign label task', '', 'low', null, null,
       array['73000000-0000-4000-8000-000000000003']::uuid[]
     ) $$,
  '22023',
  'Every label must belong to the task project',
  'task creation rejects a label from another project'
);

select throws_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       'Bad assignee', '',
       'low', '13000000-0000-4000-8000-000000000004',
       null, '{}'::uuid[]
     ) $$,
  '22023',
  'Assignee must be a workspace member',
  'task creation rejects an assignee outside the workspace'
);

select throws_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       '', '', 'low', null, null, '{}'::uuid[]
     ) $$,
  '22023',
  'Task title must be between 1 and 240 characters',
  'task creation rejects an empty title'
);

select lives_ok(
  $$ select public.update_task(
       (select id from public.tasks where title = 'Prepare launch brief'),
       'Publish launch brief',
       'Ready for review.',
       'urgent',
       '13000000-0000-4000-8000-000000000002',
       '2026-07-02',
       array['73000000-0000-4000-8000-000000000002']::uuid[]
     ) $$,
  'Member can update task fields and labels'
);

select results_eq(
  $$ select description, assignee_id, priority::text, due_date
     from public.tasks
     where title = 'Publish launch brief' $$,
  $$ values (
       'Ready for review.'::text,
       '13000000-0000-4000-8000-000000000002'::uuid,
       'urgent'::text,
       '2026-07-02'::date
     ) $$,
  'task update persists metadata'
);

select results_eq(
  $$ select label_id
     from public.task_labels
     where task_id = (select id from public.tasks where title = 'Publish launch brief') $$,
  $$ values ('73000000-0000-4000-8000-000000000002'::uuid) $$,
  'task update synchronizes labels'
);

select lives_ok(
  $$ select public.move_task(
       (select id from public.tasks where title = 'Publish launch brief'),
       '43000000-0000-4000-8000-000000000002'
     ) $$,
  'Member can move a task to another project column'
);

select results_eq(
  $$ select column_id, position
     from public.tasks
     where title = 'Publish launch brief' $$,
  $$ values (
       '43000000-0000-4000-8000-000000000002'::uuid,
       1024::bigint
     ) $$,
  'first moved task appends to the empty target column'
);

select lives_ok(
  $$ select public.move_task(
       (select id from public.tasks where title = 'Second task'),
       '43000000-0000-4000-8000-000000000002'
     ) $$,
  'another task can move to the same target column'
);

select is(
  (select position from public.tasks where title = 'Second task'),
  2048::bigint,
  'subsequent movement appends with a stable ordering gap'
);

select throws_ok(
  $$ select public.move_task(
       (select id from public.tasks where title = 'Second task'),
       '43000000-0000-4000-8000-000000000003'
     ) $$,
  '22023',
  'Target column must belong to the task project',
  'task cannot move to another project column'
);

select lives_ok(
  $$ select public.set_task_archived(
       (select id from public.tasks where title = 'Publish launch brief'),
       true
     ) $$,
  'Member can archive a task'
);

select ok(
  (select archived_at is not null from public.tasks where title = 'Publish launch brief'),
  'archived task receives a timestamp'
);

select throws_ok(
  $$ select public.move_task(
       (select id from public.tasks where title = 'Publish launch brief'),
       '43000000-0000-4000-8000-000000000001'
     ) $$,
  'P0002',
  'Active task not found',
  'archived task cannot be moved'
);

select lives_ok(
  $$ select public.set_task_archived(
       (select id from public.tasks where title = 'Publish launch brief'),
       false
     ) $$,
  'Member can restore an archived task'
);

select is(
  (select position from public.tasks where title = 'Publish launch brief'),
  3072::bigint,
  'restored task appends without colliding with active positions'
);

reset role;
update public.projects
set archived_at = now()
where id = '33000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '13000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select public.update_task(
       (select id from public.tasks where title = 'Publish launch brief'),
       'Blocked update', '', 'low', null, null, '{}'::uuid[]
     ) $$,
  'P0002',
  'Active task not found',
  'tasks cannot change while their project is archived'
);

reset role;
update public.projects
set archived_at = null
where id = '33000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '13000000-0000-4000-8000-000000000004';

select throws_ok(
  $$ select public.create_task(
       '23000000-0000-4000-8000-000000000001',
       '33000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001',
       'Outsider task', '', 'low', null, null, '{}'::uuid[]
     ) $$,
  '42501',
  'Workspace membership required',
  'workspace outsider cannot create tasks'
);

select throws_ok(
  $$ select public.move_task(
       (select id from test_task_ids limit 1),
       '43000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  'Workspace membership required',
  'workspace outsider cannot move tasks'
);

select is(
  (
    select count(*)
    from public.tasks
    where workspace_id = '23000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'workspace outsider cannot read tasks from another workspace'
);

set local role anon;
set local request.jwt.claim.sub = '';

select throws_ok(
  $$ select public.move_task(
       '53000000-0000-4000-8000-000000000001',
       '43000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  'permission denied for function move_task',
  'anonymous visitors cannot execute task movement'
);

select * from finish();

rollback;
