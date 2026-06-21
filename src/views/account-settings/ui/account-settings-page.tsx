import Link from "next/link";
import { LogOut, Palette } from "lucide-react";

import type { AccountDeletionBlocker, CurrentUser } from "@/entities/user";
import type { CurrentWorkspace } from "@/entities/workspace";
import {
  AccountSettingsForms,
  ThemeSettings,
} from "@/features/account-settings";
import { signOutAction } from "@/features/auth";
import { Badge, Button } from "@/shared/ui";

type AccountSettingsPageProps = {
  user: CurrentUser;
  workspace: CurrentWorkspace;
  blockers: AccountDeletionBlocker[];
};

export function AccountSettingsPage({
  user,
  workspace,
  blockers,
}: AccountSettingsPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">Personal account</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Profile & preferences
          </h1>
          <Badge variant="outline">Private</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your identity, appearance, sign-in security, and account.
        </p>
        <nav
          aria-label="Settings sections"
          className="mt-5 flex flex-wrap gap-2"
        >
          <Button asChild size="sm">
            <Link href={`/w/${workspace.slug}/settings/profile`}>
              Personal settings
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/w/${workspace.slug}/settings`}>
              Workspace settings
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/w/${workspace.slug}/members`}>Members & roles</Link>
          </Button>
        </nav>
      </header>

      <AccountSettingsForms user={user} blockers={blockers}>
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Palette className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your theme preference is stored on this device.
              </p>
            </div>
          </div>
          <ThemeSettings />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
              <LogOut className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">Session</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign out of Relay on this device.
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </section>
      </AccountSettingsForms>
    </div>
  );
}
