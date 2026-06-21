import {
  Clock3,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserMinus,
  UsersRound,
} from "lucide-react";

import type {
  CurrentWorkspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from "@/entities/workspace";
import {
  InviteMemberForm,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/features/workspace-invitations";
import {
  removeMemberAction,
  TransferOwnershipForm,
  updateMemberRoleAction,
} from "@/features/workspace-management";
import { Avatar, AvatarFallback, Badge, Button, EmptyState } from "@/shared/ui";

type WorkspaceMembersPageProps = {
  workspace: CurrentWorkspace;
  currentUserId: string;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  transferred?: boolean;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function WorkspaceMembersPage({
  workspace,
  currentUserId,
  members,
  invitations,
  transferred = false,
}: WorkspaceMembersPageProps) {
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Workspace access</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Members
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage who can access {workspace.name} and what they can do.
          </p>
        </div>
        <Badge variant="outline">{members.length} members</Badge>
      </header>

      {transferred ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Ownership transferred successfully. You are now an Admin.
        </p>
      ) : null}

      {canManage ? (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <MailPlus className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">Invite a teammate</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invitations are one-time links and expire after seven days.
              </p>
            </div>
          </div>
          <InviteMemberForm
            workspaceId={workspace.id}
            workspaceSlug={workspace.slug}
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
          <UsersRound className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Current members</h2>
        </div>
        <div className="divide-y">
          {members.map((member) => {
            const isCurrentUser = member.id === currentUserId;
            const canEdit = canManage && member.role !== "owner";

            return (
              <article
                key={member.id}
                aria-label={`${member.displayName} ${member.email}`}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {initials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.displayName}
                      {isCurrentUser ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email} · Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>

                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <form
                      action={updateMemberRoleAction}
                      className="flex gap-2"
                    >
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspace.id}
                      />
                      <input
                        type="hidden"
                        name="workspaceSlug"
                        value={workspace.slug}
                      />
                      <input type="hidden" name="userId" value={member.id} />
                      <select
                        name="role"
                        defaultValue={member.role}
                        aria-label={`Role for ${member.displayName}`}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Update
                      </Button>
                    </form>
                    {!isCurrentUser ? (
                      <form action={removeMemberAction}>
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspace.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceSlug"
                          value={workspace.slug}
                        />
                        <input type="hidden" name="userId" value={member.id} />
                        <Button
                          type="submit"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove ${member.displayName}`}
                        >
                          <UserMinus />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : (
                  <Badge
                    variant={member.role === "owner" ? "default" : "secondary"}
                  >
                    {member.role === "owner" ? <ShieldCheck /> : null}
                    <span className="capitalize">{member.role}</span>
                  </Badge>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {canManage ? (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
            <Clock3 className="size-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Pending invitations</h2>
              <p className="text-xs text-muted-foreground">
                Resending immediately invalidates the previous link.
              </p>
            </div>
          </div>
          {invitations.length ? (
            <div className="divide-y">
              {invitations.map((invitation) => {
                const expired = new Date(invitation.expiresAt) <= new Date();

                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="capitalize">{invitation.role}</span> ·{" "}
                        {expired
                          ? "Expired"
                          : `Expires ${formatDate(invitation.expiresAt)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form action={resendInvitationAction}>
                        <input
                          type="hidden"
                          name="invitationId"
                          value={invitation.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspace.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceSlug"
                          value={workspace.slug}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          <RefreshCw /> Resend
                        </Button>
                      </form>
                      <form action={revokeInvitationAction}>
                        <input
                          type="hidden"
                          name="invitationId"
                          value={invitation.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspace.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceSlug"
                          value={workspace.slug}
                        />
                        <Button type="submit" size="sm" variant="ghost">
                          <Trash2 /> Revoke
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<MailPlus className="size-5" />}
              title="No pending invitations"
              description="New invitations will appear here until they are accepted or revoked."
              className="border-0 shadow-none"
            />
          )}
        </section>
      ) : null}

      {workspace.role === "owner" ? (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold">Transfer ownership</h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            The new Owner receives full control. You will become an Admin.
          </p>
          <TransferOwnershipForm
            workspaceId={workspace.id}
            workspaceSlug={workspace.slug}
            members={members}
            currentUserId={currentUserId}
          />
        </section>
      ) : null}
    </div>
  );
}
