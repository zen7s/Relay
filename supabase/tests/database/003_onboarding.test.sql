begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_function(
  'public',
  'complete_onboarding',
  array['text', 'text'],
  'atomic onboarding function exists'
);

insert into auth.users (id, email)
values
  ('70000000-0000-4000-8000-000000000001', 'first@onboarding.test'),
  ('70000000-0000-4000-8000-000000000002', 'second@onboarding.test');

set local role authenticated;
set local request.jwt.claim.sub = '70000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select public.complete_onboarding('Ada Lovelace', 'Acme Studio') $$,
  'authenticated user can complete onboarding'
);

select is(
  (
    select display_name
    from public.profiles
    where id = '70000000-0000-4000-8000-000000000001'
  ),
  'Ada Lovelace',
  'onboarding updates the generated profile'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where user_id = '70000000-0000-4000-8000-000000000001'
      and role = 'owner'
  ),
  1::bigint,
  'onboarding creates one owner membership'
);

select is(
  (
    select workspace.slug::text
    from public.workspaces as workspace
    inner join public.workspace_members as membership
      on membership.workspace_id = workspace.id
    where membership.user_id = '70000000-0000-4000-8000-000000000001'
  ),
  'acme-studio',
  'onboarding generates a readable workspace slug'
);

select lives_ok(
  $$ select public.complete_onboarding('Ada Byron', 'Ignored Duplicate') $$,
  'repeating onboarding is safe'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where user_id = '70000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'repeating onboarding does not create another workspace'
);

select is(
  (
    select display_name
    from public.profiles
    where id = '70000000-0000-4000-8000-000000000001'
  ),
  'Ada Byron',
  'repeating onboarding can update the profile name'
);

set local request.jwt.claim.sub = '70000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.complete_onboarding('Grace Hopper', 'Acme Studio') $$,
  'another user can choose an existing workspace name'
);

select matches(
  (
    select workspace.slug::text
    from public.workspaces as workspace
    inner join public.workspace_members as membership
      on membership.workspace_id = workspace.id
    where membership.user_id = '70000000-0000-4000-8000-000000000002'
  ),
  '^acme-studio-[a-z0-9]{6}$',
  'slug collisions receive a stable unique suffix'
);

select throws_ok(
  $$ select public.complete_onboarding('', 'Workspace') $$,
  '22023',
  'Display name must be between 2 and 80 characters',
  'invalid onboarding input is rejected in the database'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.complete_onboarding('Anonymous', 'Workspace') $$,
  '42501',
  null,
  'anonymous users cannot execute onboarding'
);

select * from finish();

rollback;
