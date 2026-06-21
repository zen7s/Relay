create function public.create_workspace(requested_name text)
returns table (workspace_id uuid, workspace_name text, workspace_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_name text := trim(requested_name);
  slug_base text;
  slug_candidate text;
  created_workspace_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if char_length(clean_name) not between 2 and 80 then
    raise exception 'Workspace name must be between 2 and 80 characters'
      using errcode = '22023';
  end if;

  slug_base := trim(
    both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g')
  );

  if char_length(slug_base) < 2 then
    slug_base := 'workspace';
  end if;

  slug_base := left(slug_base, 40);
  slug_candidate := slug_base;

  loop
    insert into public.workspaces (name, slug, created_by)
    values (clean_name, slug_candidate, actor_id)
    on conflict (slug) do nothing
    returning id into created_workspace_id;

    exit when created_workspace_id is not null;

    slug_candidate := left(slug_base, 40)
      || '-'
      || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end loop;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace_id, actor_id, 'owner');

  return query
  select created_workspace_id, clean_name, slug_candidate;
end;
$$;

create function public.create_workspace_invitation(
  target_workspace_id uuid,
  invited_email text,
  invited_role public.workspace_role,
  invitation_token_hash text,
  invitation_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_email text := lower(trim(invited_email));
  existing_invitation public.workspace_invitations%rowtype;
  invitation_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  if clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or char_length(clean_email) > 320 then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;

  if invited_role is null or invited_role = 'owner' then
    raise exception 'Invitations can only grant Admin or Member'
      using errcode = '22023';
  end if;

  if invitation_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation token hash' using errcode = '22023';
  end if;

  if invitation_expires_at <= now()
    or invitation_expires_at > now() + interval '30 days' then
    raise exception 'Invitation expiration must be within 30 days'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.workspace_members as membership
    inner join auth.users as users on users.id = membership.user_id
    where membership.workspace_id = target_workspace_id
      and lower(users.email) = clean_email
  ) then
    raise exception 'This person is already a workspace member'
      using errcode = '23505';
  end if;

  select invitation.*
  into existing_invitation
  from public.workspace_invitations as invitation
  where invitation.workspace_id = target_workspace_id
    and lower(invitation.email::text) = clean_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null
  for update;

  if existing_invitation.id is not null then
    if existing_invitation.expires_at > now() then
      raise exception 'An invitation is already pending for this email'
        using errcode = '23505';
    end if;

    update public.workspace_invitations
    set role = invited_role,
        token_hash = invitation_token_hash,
        invited_by = actor_id,
        expires_at = invitation_expires_at,
        created_at = now()
    where id = existing_invitation.id
    returning id into invitation_id;
  else
    insert into public.workspace_invitations (
      workspace_id,
      email,
      role,
      token_hash,
      invited_by,
      expires_at
    ) values (
      target_workspace_id,
      clean_email,
      invited_role,
      invitation_token_hash,
      actor_id,
      invitation_expires_at
    )
    returning id into invitation_id;
  end if;

  return invitation_id;
end;
$$;

create function public.resend_workspace_invitation(
  target_invitation_id uuid,
  invitation_token_hash text,
  invitation_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  invitation public.workspace_invitations%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if invitation_token_hash !~ '^[0-9a-f]{64}$'
    or invitation_expires_at <= now()
    or invitation_expires_at > now() + interval '30 days' then
    raise exception 'Invalid invitation refresh values' using errcode = '22023';
  end if;

  select candidate.*
  into invitation
  from public.workspace_invitations as candidate
  where candidate.id = target_invitation_id
  for update;

  if invitation.id is null
    or invitation.accepted_at is not null
    or invitation.revoked_at is not null then
    raise exception 'Pending invitation not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = invitation.workspace_id
      and user_id = actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  update public.workspace_invitations
  set token_hash = invitation_token_hash,
      expires_at = invitation_expires_at,
      invited_by = actor_id,
      created_at = now()
  where id = invitation.id;
end;
$$;

create function public.revoke_workspace_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  invitation public.workspace_invitations%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select candidate.*
  into invitation
  from public.workspace_invitations as candidate
  where candidate.id = target_invitation_id
  for update;

  if invitation.id is null
    or invitation.accepted_at is not null
    or invitation.revoked_at is not null then
    raise exception 'Pending invitation not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = invitation.workspace_id
      and user_id = actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  update public.workspace_invitations
  set revoked_at = now()
  where id = invitation.id;
end;
$$;

create function public.get_workspace_invitation(invitation_token text)
returns table (
  workspace_name text,
  workspace_slug text,
  email_hint text,
  invitation_role public.workspace_role,
  invitation_status text,
  invitation_expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    workspace.name,
    workspace.slug::text,
    left(split_part(invitation.email::text, '@', 1), 1)
      || '***@'
      || split_part(invitation.email::text, '@', 2),
    invitation.role,
    case
      when invitation.accepted_at is not null then 'accepted'
      when invitation.revoked_at is not null then 'revoked'
      when invitation.expires_at <= now() then 'expired'
      else 'pending'
    end,
    invitation.expires_at
  from public.workspace_invitations as invitation
  inner join public.workspaces as workspace on workspace.id = invitation.workspace_id
  where invitation.token_hash = encode(
    extensions.digest(invitation_token, 'sha256'),
    'hex'
  )
  limit 1;
$$;

create function public.accept_workspace_invitation(invitation_token text)
returns table (workspace_id uuid, workspace_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text;
  invitation public.workspace_invitations%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select lower(users.email)
  into actor_email
  from auth.users as users
  where users.id = actor_id;

  select candidate.*
  into invitation
  from public.workspace_invitations as candidate
  where candidate.token_hash = encode(
    extensions.digest(invitation_token, 'sha256'),
    'hex'
  )
  for update;

  if invitation.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if invitation.accepted_at is not null
    or invitation.revoked_at is not null
    or invitation.expires_at <= now() then
    raise exception 'Invitation is no longer valid' using errcode = '22023';
  end if;

  if actor_email is null or actor_email <> lower(invitation.email::text) then
    raise exception 'Sign in with the email address that was invited'
      using errcode = '42501';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, actor_id, invitation.role)
  on conflict on constraint workspace_members_pkey do nothing;

  update public.workspace_invitations
  set accepted_at = now()
  where id = invitation.id;

  return query
  select workspace.id, workspace.slug::text
  from public.workspaces as workspace
  where workspace.id = invitation.workspace_id;
end;
$$;

create function public.update_workspace_member_role(
  target_workspace_id uuid,
  target_user_id uuid,
  requested_role public.workspace_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_role public.workspace_role;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if requested_role is null or requested_role = 'owner' then
    raise exception 'Use ownership transfer to assign Owner'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  select role
  into target_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id
  for update;

  if target_role is null then
    raise exception 'Workspace member not found' using errcode = 'P0002';
  end if;

  if target_role = 'owner' then
    raise exception 'Owner role can only change through ownership transfer'
      using errcode = '42501';
  end if;

  update public.workspace_members
  set role = requested_role
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end;
$$;

create function public.remove_workspace_member(
  target_workspace_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_role public.workspace_role;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select role
  into target_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id
  for update;

  if target_role is null then
    raise exception 'Workspace member not found' using errcode = 'P0002';
  end if;

  if target_role = 'owner' then
    raise exception 'Transfer ownership before removing the Owner'
      using errcode = '42501';
  end if;

  if actor_id <> target_user_id and not exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = actor_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Workspace manager role required' using errcode = '42501';
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end;
$$;

create function public.transfer_workspace_ownership(
  target_workspace_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_role public.workspace_role;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform 1
  from public.workspace_members
  where workspace_id = target_workspace_id
  for update;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = actor_id
      and role = 'owner'
  ) then
    raise exception 'Only the Owner can transfer ownership'
      using errcode = '42501';
  end if;

  if target_user_id = actor_id then
    raise exception 'Choose another workspace member' using errcode = '22023';
  end if;

  select role
  into target_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = target_user_id;

  if target_role is null then
    raise exception 'Workspace member not found' using errcode = 'P0002';
  end if;

  update public.workspace_members
  set role = 'admin'
  where workspace_id = target_workspace_id
    and user_id = actor_id;

  update public.workspace_members
  set role = 'owner'
  where workspace_id = target_workspace_id
    and user_id = target_user_id;
end;
$$;

create function public.leave_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.workspace_role;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select role
  into actor_role
  from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = actor_id
  for update;

  if actor_role is null then
    raise exception 'Workspace membership not found' using errcode = 'P0002';
  end if;

  if actor_role = 'owner' then
    raise exception 'Transfer ownership before leaving the workspace'
      using errcode = '42501';
  end if;

  delete from public.workspace_members
  where workspace_id = target_workspace_id
    and user_id = actor_id;
end;
$$;

create function public.get_workspace_members(target_workspace_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  member_role public.workspace_role,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    membership.user_id,
    profile.display_name,
    users.email::text,
    membership.role,
    membership.joined_at
  from public.workspace_members as membership
  inner join public.profiles as profile on profile.id = membership.user_id
  inner join auth.users as users on users.id = membership.user_id
  where membership.workspace_id = target_workspace_id
    and exists (
      select 1
      from public.workspace_members as own_membership
      where own_membership.workspace_id = target_workspace_id
        and own_membership.user_id = auth.uid()
    )
  order by
    case membership.role
      when 'owner' then 1
      when 'admin' then 2
      else 3
    end,
    lower(profile.display_name),
    membership.joined_at;
$$;

revoke update (email, role, expires_at, accepted_at, revoked_at)
  on table public.workspace_invitations from authenticated;

revoke all on function public.create_workspace(text) from public;
revoke all on function public.create_workspace_invitation(
  uuid,
  text,
  public.workspace_role,
  text,
  timestamptz
) from public;
revoke all on function public.resend_workspace_invitation(uuid, text, timestamptz)
  from public;
revoke all on function public.revoke_workspace_invitation(uuid) from public;
revoke all on function public.get_workspace_invitation(text) from public;
revoke all on function public.accept_workspace_invitation(text) from public;
revoke all on function public.update_workspace_member_role(
  uuid,
  uuid,
  public.workspace_role
) from public;
revoke all on function public.remove_workspace_member(uuid, uuid) from public;
revoke all on function public.transfer_workspace_ownership(uuid, uuid) from public;
revoke all on function public.leave_workspace(uuid) from public;
revoke all on function public.get_workspace_members(uuid) from public;

grant execute on function public.create_workspace(text) to authenticated, service_role;
grant execute on function public.create_workspace_invitation(
  uuid,
  text,
  public.workspace_role,
  text,
  timestamptz
) to authenticated, service_role;
grant execute on function public.resend_workspace_invitation(uuid, text, timestamptz)
  to authenticated, service_role;
grant execute on function public.revoke_workspace_invitation(uuid)
  to authenticated, service_role;
grant execute on function public.get_workspace_invitation(text)
  to anon, authenticated, service_role;
grant execute on function public.accept_workspace_invitation(text)
  to authenticated, service_role;
grant execute on function public.update_workspace_member_role(
  uuid,
  uuid,
  public.workspace_role
) to authenticated, service_role;
grant execute on function public.remove_workspace_member(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.transfer_workspace_ownership(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.leave_workspace(uuid)
  to authenticated, service_role;
grant execute on function public.get_workspace_members(uuid)
  to authenticated, service_role;
