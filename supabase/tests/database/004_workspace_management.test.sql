begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

insert into auth.users (id, email)
values
  ('11000000-0000-4000-8000-000000000001', 'owner@workspace.test'),
  ('11000000-0000-4000-8000-000000000002', 'admin@workspace.test'),
  ('11000000-0000-4000-8000-000000000003', 'member@workspace.test'),
  ('11000000-0000-4000-8000-000000000004', 'outsider@workspace.test'),
  ('11000000-0000-4000-8000-000000000005', 'invitee@workspace.test'),
  ('11000000-0000-4000-8000-000000000006', 'wrong@workspace.test');

insert into public.workspaces (id, name, slug, created_by)
values
  (
    '21000000-0000-4000-8000-000000000001',
    'Workspace Alpha',
    'workspace-alpha',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    'Workspace Beta',
    'workspace-beta',
    '11000000-0000-4000-8000-000000000004'
  );

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    'admin'
  ),
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000003',
    'member'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000004',
    'owner'
  );

set local role authenticated;
set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select public.create_workspace('Product Lab') $$,
  'an authenticated user can create another workspace atomically'
);

select is(
  (
    select role::text
    from public.workspace_members
    where user_id = '11000000-0000-4000-8000-000000000001'
      and workspace_id <> '21000000-0000-4000-8000-000000000001'
    order by joined_at
    limit 1
  ),
  'owner',
  'workspace creator becomes Owner'
);

select lives_ok(
  $$ select public.create_workspace('Product Lab') $$,
  'workspace creation resolves slug collisions'
);

select is(
  (
    select count(distinct slug)
    from public.workspaces
    where name = 'Product Lab'
  ),
  2::bigint,
  'colliding workspace names receive distinct slugs'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.create_workspace_invitation(
       '21000000-0000-4000-8000-000000000001',
       'INVITEE@workspace.test',
       'member',
       encode(extensions.digest('owner-invite-token', 'sha256'), 'hex'),
       now() + interval '7 days'
     ) $$,
  'Admin can create a member invitation'
);

select results_eq(
  $$ select email::text, role::text
     from public.workspace_invitations
     where workspace_id = '21000000-0000-4000-8000-000000000001' $$,
  $$ values ('invitee@workspace.test'::text, 'member'::text) $$,
  'invitation email is normalized and role is stored'
);

select throws_ok(
  $$ select public.create_workspace_invitation(
       '21000000-0000-4000-8000-000000000001',
       'invitee@workspace.test',
       'member',
       encode(extensions.digest('duplicate-token', 'sha256'), 'hex'),
       now() + interval '7 days'
     ) $$,
  '23505',
  'An invitation is already pending for this email',
  'duplicate pending invitations are rejected'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select public.create_workspace_invitation(
       '21000000-0000-4000-8000-000000000001',
       'wrong@workspace.test',
       'member',
       encode(extensions.digest('member-token', 'sha256'), 'hex'),
       now() + interval '7 days'
     ) $$,
  '42501',
  'Workspace manager role required',
  'Member cannot create invitations'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000004';

select is(
  (select count(*) from public.workspace_invitations),
  0::bigint,
  'workspace outsider cannot list invitations'
);

set local role anon;
set local request.jwt.claim.sub = '';

select results_eq(
  $$ select workspace_name, email_hint, invitation_role::text, invitation_status
     from public.get_workspace_invitation('owner-invite-token') $$,
  $$ values (
       'Workspace Alpha'::text,
       'i***@workspace.test'::text,
       'member'::text,
       'pending'::text
     ) $$,
  'token bearer sees a masked pending invitation preview'
);

select throws_ok(
  $$ select public.accept_workspace_invitation('owner-invite-token') $$,
  '42501',
  'permission denied for function accept_workspace_invitation',
  'anonymous visitor cannot accept an invitation'
);

set local role authenticated;
set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000006';

select throws_ok(
  $$ select public.accept_workspace_invitation('owner-invite-token') $$,
  '42501',
  'Sign in with the email address that was invited',
  'invitation can only be accepted by the matching email account'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where user_id = '11000000-0000-4000-8000-000000000006'
  ),
  0::bigint,
  'email mismatch creates no membership'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000005';

select results_eq(
  $$ select workspace_slug
     from public.accept_workspace_invitation('owner-invite-token') $$,
  $$ values ('workspace-alpha'::text) $$,
  'matching account accepts the invitation and receives its workspace slug'
);

select is(
  (
    select role::text
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and user_id = '11000000-0000-4000-8000-000000000005'
  ),
  'member',
  'accepted invitation creates the requested membership role'
);

select is(
  (
    select invitation_status
    from public.get_workspace_invitation('owner-invite-token')
  ),
  'accepted',
  'accepted invitation is marked terminal'
);

select is(
  (
    select count(*)
    from public.get_workspace_members(
      '21000000-0000-4000-8000-000000000001'
    )
  ),
  4::bigint,
  'workspace member can list member identities and roles'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000004';

select is_empty(
  $$ select *
     from public.get_workspace_members(
       '21000000-0000-4000-8000-000000000001'
     ) $$,
  'workspace outsider receives no member identities'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000005';

select throws_ok(
  $$ select public.accept_workspace_invitation('owner-invite-token') $$,
  '22023',
  'Invitation is no longer valid',
  'one-time invitation cannot be accepted twice'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.create_workspace_invitation(
       '21000000-0000-4000-8000-000000000001',
       'wrong@workspace.test',
       'admin',
       encode(extensions.digest('admin-invite-old-token', 'sha256'), 'hex'),
       now() + interval '7 days'
     ) $$,
  'Admin can create an Admin invitation'
);

select lives_ok(
  $$ select public.resend_workspace_invitation(
       (
         select id
         from public.workspace_invitations
         where email = 'wrong@workspace.test'
       ),
       encode(extensions.digest('admin-invite-new-token', 'sha256'), 'hex'),
       now() + interval '7 days'
     ) $$,
  'manager can resend a pending invitation with a fresh token'
);

select is_empty(
  $$ select *
     from public.get_workspace_invitation('admin-invite-old-token') $$,
  'resend invalidates the previous token'
);

select is(
  (
    select invitation_status
    from public.get_workspace_invitation('admin-invite-new-token')
  ),
  'pending',
  'resent invitation has a valid pending token'
);

select lives_ok(
  $$ select public.revoke_workspace_invitation(
       (
         select id
         from public.workspace_invitations
         where email = 'wrong@workspace.test'
       )
     ) $$,
  'manager can revoke a pending invitation'
);

select is(
  (
    select invitation_status
    from public.get_workspace_invitation('admin-invite-new-token')
  ),
  'revoked',
  'revoked invitation preview reports its terminal state'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000006';

select throws_ok(
  $$ select public.accept_workspace_invitation('admin-invite-new-token') $$,
  '22023',
  'Invitation is no longer valid',
  'revoked invitation cannot be accepted'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.update_workspace_member_role(
       '21000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000003',
       'admin'
     ) $$,
  'Admin can promote a non-owner Member'
);

select is(
  (
    select role::text
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and user_id = '11000000-0000-4000-8000-000000000003'
  ),
  'admin',
  'role update is persisted'
);

select throws_ok(
  $$ select public.update_workspace_member_role(
       '21000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000001',
       'admin'
     ) $$,
  '42501',
  'Owner role can only change through ownership transfer',
  'Admin cannot alter the Owner role'
);

select lives_ok(
  $$ select public.remove_workspace_member(
       '21000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000003'
     ) $$,
  'Admin can remove a non-owner member'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and user_id = '11000000-0000-4000-8000-000000000003'
  ),
  0::bigint,
  'removed membership no longer exists'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select public.transfer_workspace_ownership(
       '21000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000005'
     ) $$,
  'Owner can transfer ownership to another member'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and role = 'owner'
  ),
  1::bigint,
  'ownership transfer preserves exactly one Owner'
);

select is(
  (
    select role::text
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and user_id = '11000000-0000-4000-8000-000000000001'
  ),
  'admin',
  'previous Owner becomes Admin after transfer'
);

select lives_ok(
  $$ select public.leave_workspace('21000000-0000-4000-8000-000000000001') $$,
  'previous Owner can leave after ownership transfer'
);

select is(
  (
    select count(*)
    from public.workspace_members
    where workspace_id = '21000000-0000-4000-8000-000000000001'
      and user_id = '11000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'leaving removes the previous Owner membership'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000005';

select throws_ok(
  $$ select public.leave_workspace('21000000-0000-4000-8000-000000000001') $$,
  '42501',
  'Transfer ownership before leaving the workspace',
  'current Owner cannot leave without another transfer'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select throws_ok(
  $$ select public.transfer_workspace_ownership(
       '21000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000006'
     ) $$,
  '42501',
  'Only the Owner can transfer ownership',
  'Admin cannot transfer workspace ownership'
);

select * from finish();

rollback;
