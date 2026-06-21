import Link from "next/link";
import { Building2, Clock3, ShieldCheck } from "lucide-react";

import type { CurrentUser } from "@/entities/user";
import type { InvitationPreview } from "@/entities/workspace";
import { signOutAction } from "@/features/auth";
import { acceptInvitationAction } from "@/features/workspace-invitations";
import { Badge, Button } from "@/shared/ui";
import { AuthShell } from "@/widgets/auth-shell";

type InvitationPageProps = {
  token: string;
  invitation: InvitationPreview | null;
  user: CurrentUser | null;
  accountError?: boolean;
};

export function InvitationPage({
  token,
  invitation,
  user,
  accountError = false,
}: InvitationPageProps) {
  const invitePath = `/invite/${encodeURIComponent(token)}`;
  const pending = invitation?.status === "pending";

  return (
    <AuthShell
      eyebrow="Workspace invitation"
      title={
        invitation ? `Join ${invitation.workspaceName}` : "Invalid invitation"
      }
      description={
        invitation
          ? "Review the invitation details before joining this workspace."
          : "This invitation link does not exist or is malformed."
      }
      footer={
        user ? (
          <form action={signOutAction}>
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>.{" "}
            <button
              type="submit"
              className="font-medium text-primary hover:underline"
            >
              Use another account
            </button>
          </form>
        ) : (
          <span>
            Relay invitations can only be accepted by the invited email account.
          </span>
        )
      }
    >
      {invitation ? (
        <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {invitation.workspaceName}
              </p>
              <p className="text-xs text-muted-foreground">
                Invitation for {invitation.emailHint}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              <ShieldCheck /> {invitation.role}
            </Badge>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {pending
              ? `Expires ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}`
              : `Invitation status: ${invitation.status}`}
          </div>

          {accountError ? (
            <p role="alert" className="text-sm text-destructive">
              Sign in with the email address shown on this invitation.
            </p>
          ) : null}

          {pending && user ? (
            <form action={acceptInvitationAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" className="w-full">
                Accept invitation
              </Button>
            </form>
          ) : null}

          {pending && !user ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <Link href={`/login?next=${encodeURIComponent(invitePath)}`}>
                  Sign in to accept
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/signup?next=${encodeURIComponent(invitePath)}`}>
                  Create account
                </Link>
              </Button>
            </div>
          ) : null}

          {!pending ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={user ? "/" : "/login"}>Continue to Relay</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <Button asChild variant="outline" className="w-full">
          <Link href={user ? "/" : "/login"}>Continue to Relay</Link>
        </Button>
      )}
    </AuthShell>
  );
}
