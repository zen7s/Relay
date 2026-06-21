"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertTriangle, Camera, KeyRound, UserRound } from "lucide-react";

import type { AccountDeletionBlocker } from "@/entities/user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Label,
} from "@/shared/ui";

import {
  changePasswordAction,
  deleteAccountAction,
  removeAvatarAction,
  updateAvatarAction,
  updateProfileAction,
} from "../api/actions";
import {
  initialAccountSettingsActionState,
  type AccountSettingsActionState,
} from "../model/action-state";

type AccountSettingsFormsProps = {
  user: { displayName: string; email: string; avatarUrl: string | null };
  blockers: AccountDeletionBlocker[];
  children: React.ReactNode;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R"
  );
}

function FormStatus({ state }: { state: AccountSettingsActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "text-sm text-destructive"
          : "text-sm text-emerald-700 dark:text-emerald-400"
      }
    >
      {state.message}
    </p>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  destructive = false,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  destructive?: boolean;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span
        className={
          destructive
            ? "grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive"
            : "grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"
        }
      >
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function AccountSettingsForms({
  user,
  blockers,
  children,
}: AccountSettingsFormsProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialAccountSettingsActionState,
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    updateAvatarAction,
    initialAccountSettingsActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeAvatarAction,
    initialAccountSettingsActionState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialAccountSettingsActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountAction,
    initialAccountSettingsActionState,
  );

  return (
    <>
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={UserRound}
          title="Profile"
          description="Choose how your name and avatar appear to teammates."
        />
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <form action={profileAction} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="profile-display-name">Display name</Label>
              <Input
                id="profile-display-name"
                name="displayName"
                defaultValue={
                  profileState.values?.displayName ?? user.displayName
                }
                autoComplete="name"
                maxLength={80}
                aria-invalid={Boolean(profileState.fieldErrors?.displayName)}
              />
              {profileState.fieldErrors?.displayName?.[0] ? (
                <p className="text-xs text-destructive">
                  {profileState.fieldErrors.displayName[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user.email} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                Your sign-in email is managed by your authentication provider.
              </p>
            </div>
            <FormStatus state={profileState} />
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving…" : "Save profile"}
            </Button>
          </form>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="size-16 border bg-background">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt="Your avatar" />
                ) : null}
                <AvatarFallback className="text-base">
                  {initials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Profile picture</p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, or AVIF. Up to 2 MB.
                </p>
              </div>
            </div>
            <form action={avatarAction} className="space-y-3" noValidate>
              <Label
                htmlFor="profile-avatar"
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                <Camera className="size-4" />
                Choose image
              </Label>
              <input
                id="profile-avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                aria-invalid={Boolean(avatarState.fieldErrors?.avatar)}
              />
              {avatarState.fieldErrors?.avatar?.[0] ? (
                <p className="text-xs text-destructive">
                  {avatarState.fieldErrors.avatar[0]}
                </p>
              ) : null}
              <FormStatus state={avatarState} />
              <Button type="submit" size="sm" disabled={avatarPending}>
                {avatarPending ? "Uploading…" : "Upload avatar"}
              </Button>
            </form>
            {user.avatarUrl ? (
              <form action={removeAction} className="mt-2">
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  disabled={removePending}
                >
                  {removePending ? "Removing…" : "Remove avatar"}
                </Button>
                <FormStatus state={removeState} />
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={KeyRound}
          title="Password"
          description="Use your current password to set a new one."
        />
        <form action={passwordAction} className="max-w-md space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(passwordState.fieldErrors?.currentPassword)}
            />
            {passwordState.fieldErrors?.currentPassword?.[0] ? (
              <p className="text-xs text-destructive">
                {passwordState.fieldErrors.currentPassword[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordState.fieldErrors?.password)}
            />
            {passwordState.fieldErrors?.password?.[0] ? (
              <p className="text-xs text-destructive">
                {passwordState.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordState.fieldErrors?.confirmPassword)}
            />
            {passwordState.fieldErrors?.confirmPassword?.[0] ? (
              <p className="text-xs text-destructive">
                {passwordState.fieldErrors.confirmPassword[0]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Updating…" : "Update password"}
            </Button>
            <Button asChild type="button" variant="link" className="px-0">
              <Link href="/forgot-password">Forgot your password?</Link>
            </Button>
          </div>
          <FormStatus state={passwordState} />
        </form>
      </section>

      {children}

      <section className="rounded-2xl border border-destructive/30 bg-card p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={AlertTriangle}
          title="Delete account"
          description="Permanently remove your profile, memberships, comments, and uploaded files."
          destructive
        />
        {blockers.length ? (
          <div className="mb-5 max-w-2xl rounded-xl border bg-muted/50 p-4">
            <p className="text-sm font-medium">
              Transfer ownership or delete these workspaces first:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {blockers.map((workspace) => (
                <li key={workspace.workspaceId}>
                  <Link
                    href={`/w/${workspace.workspaceSlug}/members`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {workspace.workspaceName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <form action={deleteAction} className="max-w-md space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirmation">
              Type <strong>{user.email}</strong> to confirm
            </Label>
            <Input
              id="delete-account-confirmation"
              name="confirmation"
              type="email"
              autoComplete="off"
              defaultValue={deleteState.values?.confirmation}
              disabled={blockers.length > 0}
              aria-invalid={Boolean(deleteState.fieldErrors?.confirmation)}
            />
            {deleteState.fieldErrors?.confirmation?.[0] ? (
              <p className="text-xs text-destructive">
                {deleteState.fieldErrors.confirmation[0]}
              </p>
            ) : null}
          </div>
          <FormStatus state={deleteState} />
          <Button
            type="submit"
            variant="destructive"
            disabled={blockers.length > 0 || deletePending}
          >
            {deletePending ? "Deleting…" : "Delete account permanently"}
          </Button>
        </form>
      </section>
    </>
  );
}
