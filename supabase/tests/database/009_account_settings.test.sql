begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select is(
  (select public from storage.buckets where id = 'avatars'),
  true,
  'avatar bucket is public'
);

select is(
  (select file_size_limit from storage.buckets where id = 'avatars'),
  2097152::bigint,
  'avatar bucket enforces the 2 MB limit'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'avatars'),
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[],
  'avatar bucket only accepts supported image types'
);

select policies_are(
  'storage',
  'objects',
  array[
    'avatars_delete_own_objects',
    'avatars_insert_own_folder',
    'avatars_select_own_objects',
    'avatars_update_own_folder',
    'task_attachments_delete_uploader_or_manager',
    'task_attachments_insert_members',
    'task_attachments_select_members'
  ],
  'storage object policies include isolated avatars'
);

insert into auth.users (id, email)
values
  ('16000000-0000-4000-8000-000000000001', 'owner@account.test'),
  ('16000000-0000-4000-8000-000000000002', 'member@account.test'),
  ('16000000-0000-4000-8000-000000000003', 'outsider@account.test');

insert into public.workspaces (id, name, slug, created_by)
values (
  '26000000-0000-4000-8000-000000000001',
  'Account workspace',
  'account-workspace',
  '16000000-0000-4000-8000-000000000001'
);

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '26000000-0000-4000-8000-000000000001',
    '16000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '26000000-0000-4000-8000-000000000001',
    '16000000-0000-4000-8000-000000000002',
    'member'
  );

set local role authenticated;
set local request.jwt.claim.sub = '16000000-0000-4000-8000-000000000001';
set local "storage.allow_delete_query" = 'true';

select results_eq(
  $$ select workspace_name from public.get_account_deletion_blockers() $$,
  $$ values ('Account workspace'::text) $$,
  'an Owner sees the workspace blocking account deletion'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values (
       'avatars',
       '16000000-0000-4000-8000-000000000001/avatar.webp',
       '16000000-0000-4000-8000-000000000001'
     ) $$,
  'a user can upload an avatar to their own folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values (
       'avatars',
       '16000000-0000-4000-8000-000000000002/avatar.webp',
       '16000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'a user cannot upload into another profile folder'
);

select results_eq(
  $$ with removed as (
       delete from storage.objects
       where bucket_id = 'avatars'
         and name = '16000000-0000-4000-8000-000000000001/avatar.webp'
       returning 1
     ) select count(*) from removed $$,
  $$ values (1::bigint) $$,
  'a user can delete their own avatar'
);

set local role postgres;

select throws_ok(
  $test$ do $$
     begin
       delete from public.profiles
       where id = '16000000-0000-4000-8000-000000000001';
       set constraints workspace_members_keep_owner immediate;
     end;
     $$ $test$,
  '23514',
  'Transfer ownership before removing the Owner',
  'database prevents deletion of a workspace Owner'
);

set constraints workspace_members_keep_owner deferred;

update public.workspace_members
set role = 'admin'
where workspace_id = '26000000-0000-4000-8000-000000000001'
  and user_id = '16000000-0000-4000-8000-000000000001';

update public.workspace_members
set role = 'owner'
where workspace_id = '26000000-0000-4000-8000-000000000001'
  and user_id = '16000000-0000-4000-8000-000000000002';

set constraints workspace_members_keep_owner immediate;

select lives_ok(
  $$ delete from public.profiles
     where id = '16000000-0000-4000-8000-000000000001' $$,
  'a former Owner can be deleted after ownership transfer'
);

set local role authenticated;
set local request.jwt.claim.sub = '16000000-0000-4000-8000-000000000002';

select results_eq(
  $$ select workspace_slug from public.get_account_deletion_blockers() $$,
  $$ values ('account-workspace'::text) $$,
  'the new Owner becomes the deletion blocker'
);

set local request.jwt.claim.sub = '16000000-0000-4000-8000-000000000003';

select is_empty(
  $$ select * from public.get_account_deletion_blockers() $$,
  'a user without owned workspaces has no deletion blockers'
);

select results_eq(
  $$ with removed as (
       delete from storage.objects
       where bucket_id = 'avatars'
       returning 1
     ) select count(*) from removed $$,
  $$ values (0::bigint) $$,
  'an outsider cannot delete another profile avatar'
);

select has_function(
  'public',
  'get_account_deletion_blockers',
  array[]::text[],
  'account deletion blocker function exists'
);

select function_privs_are(
  'public',
  'get_account_deletion_blockers',
  array[]::text[],
  'authenticated',
  array['EXECUTE'],
  'authenticated users can call the blocker function'
);

select function_privs_are(
  'public',
  'get_account_deletion_blockers',
  array[]::text[],
  'anon',
  array[]::text[],
  'anonymous users cannot call the blocker function'
);

select * from finish();

rollback;
