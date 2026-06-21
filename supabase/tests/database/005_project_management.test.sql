begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_function(
  'public',
  'create_project',
  array['uuid', 'text', 'text', 'text', 'text'],
  'atomic project creation function exists'
);

insert into auth.users (id, email)
values
  ('12000000-0000-4000-8000-000000000001', 'owner@projects.test'),
  ('12000000-0000-4000-8000-000000000002', 'admin@projects.test'),
  ('12000000-0000-4000-8000-000000000003', 'member@projects.test'),
  ('12000000-0000-4000-8000-000000000004', 'outsider@projects.test');

insert into public.workspaces (id, name, slug, created_by)
values
  (
    '22000000-0000-4000-8000-000000000001',
    'Projects Alpha',
    'projects-alpha',
    '12000000-0000-4000-8000-000000000001'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    'Projects Beta',
    'projects-beta',
    '12000000-0000-4000-8000-000000000004'
  );

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'admin'
  ),
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000003',
    'member'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000004',
    'owner'
  );

set local role authenticated;
set local request.jwt.claim.sub = '12000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       '  Product Launch  ',
       'launch',
       '#6366f1',
       '  Coordinate the public launch.  '
     ) $$,
  'Owner can create a project atomically'
);

select results_eq(
  $$ select name, key, color, description
     from public.projects
     where workspace_id = '22000000-0000-4000-8000-000000000001' $$,
  $$ values (
       'Product Launch'::text,
       'LAUNCH'::text,
       '#6366F1'::text,
       'Coordinate the public launch.'::text
     ) $$,
  'project input is normalized before storage'
);

select is(
  (
    select count(*)
    from public.board_columns
    where project_id = (
      select id from public.projects where key = 'LAUNCH'
    )
  ),
  5::bigint,
  'project creation creates exactly five board columns'
);

select results_eq(
  $$ select name, position
     from public.board_columns
     where project_id = (select id from public.projects where key = 'LAUNCH')
     order by position $$,
  $$ values
       ('Backlog'::text, 1000::bigint),
       ('To do'::text, 2000::bigint),
       ('In progress'::text, 3000::bigint),
       ('Review'::text, 4000::bigint),
       ('Done'::text, 5000::bigint) $$,
  'default columns have stable names and ordering gaps'
);

select is(
  (
    select count(*)
    from public.board_columns
    where project_id = (select id from public.projects where key = 'LAUNCH')
      and workspace_id = '22000000-0000-4000-8000-000000000001'
  ),
  5::bigint,
  'all default columns inherit the project workspace'
);

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Duplicate launch',
       'launch',
       '#0EA5E9',
       ''
     ) $$,
  '23505',
  'Project key already exists in this workspace',
  'project keys are unique within a workspace'
);

set local request.jwt.claim.sub = '12000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Design System',
       'DS',
       '#EC4899',
       ''
     ) $$,
  'Admin can create a project'
);

select is(
  (
    select count(*)
    from public.board_columns
    where project_id = (select id from public.projects where key = 'DS')
  ),
  5::bigint,
  'Admin-created project also receives the default board'
);

set local request.jwt.claim.sub = '12000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Member project',
       'MEM',
       '#22C55E',
       ''
     ) $$,
  '42501',
  'Workspace manager role required',
  'Member cannot create projects'
);

select is(
  (select count(*) from public.projects where key = 'MEM'),
  0::bigint,
  'rejected project creation leaves no partial project'
);

set local request.jwt.claim.sub = '12000000-0000-4000-8000-000000000004';

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Foreign project',
       'NOPE',
       '#F59E0B',
       ''
     ) $$,
  '42501',
  'Workspace manager role required',
  'workspace outsider cannot create projects'
);

set local request.jwt.claim.sub = '12000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       '',
       'EMPTY',
       '#F59E0B',
       ''
     ) $$,
  '22023',
  'Project name must be between 1 and 100 characters',
  'empty project name is rejected'
);

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Bad key',
       '1',
       '#F59E0B',
       ''
     ) $$,
  '22023',
  'Project key must contain 2 to 10 uppercase letters or numbers',
  'invalid project key is rejected'
);

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Bad color',
       'COLOR',
       'indigo',
       ''
     ) $$,
  '22023',
  'Project color must be a six-digit hex color',
  'invalid project color is rejected'
);

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Too long',
       'LONG',
       '#6366F1',
       repeat('x', 2001)
     ) $$,
  '22023',
  'Project description must not exceed 2000 characters',
  'oversized project description is rejected'
);

select is(
  (
    select count(*)
    from public.projects
    where workspace_id = '22000000-0000-4000-8000-000000000001'
  ),
  2::bigint,
  'validation failures leave existing projects unchanged'
);

set local role anon;
set local request.jwt.claim.sub = '';

select throws_ok(
  $$ select public.create_project(
       '22000000-0000-4000-8000-000000000001',
       'Anonymous project',
       'ANON',
       '#6366F1',
       ''
     ) $$,
  '42501',
  'permission denied for function create_project',
  'anonymous users cannot execute project creation'
);

select * from finish();

rollback;
