begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'workspaces', 'workspaces table exists');
select has_table('public', 'workspace_members', 'workspace_members table exists');
select has_table('public', 'workspace_invitations', 'workspace_invitations table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'board_columns', 'board_columns table exists');
select has_table('public', 'tasks', 'tasks table exists');
select has_table('public', 'labels', 'labels table exists');
select has_table('public', 'task_labels', 'task_labels table exists');
select has_table('public', 'comments', 'comments table exists');
select has_table('public', 'attachments', 'attachments table exists');

select has_type('public', 'workspace_role', 'workspace_role enum exists');
select has_type('public', 'task_priority', 'task_priority enum exists');

select is(
  (
    select count(*)
    from pg_catalog.pg_class as relation
    inner join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'profiles',
        'workspaces',
        'workspace_members',
        'workspace_invitations',
        'projects',
        'board_columns',
        'tasks',
        'labels',
        'task_labels',
        'comments',
        'attachments'
      )
      and relation.relrowsecurity
  ),
  11::bigint,
  'RLS is enabled on every exposed application table'
);

select has_index(
  'public',
  'workspace_members',
  'workspace_members_one_owner_idx',
  'each workspace has at most one owner'
);

select has_trigger(
  'auth',
  'users',
  'on_auth_user_created',
  'new auth users receive a profile'
);

select * from finish();

rollback;
