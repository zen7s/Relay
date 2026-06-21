# Account settings

Account settings live at `/w/:slug/settings/profile` so the application keeps the active workspace shell while clearly separating personal and workspace controls.

## Profile and avatar

Users can update their display name while their authentication email remains visible and read-only. Avatars are stored in the public `avatars` bucket under a user-owned UUID folder. Storage RLS limits writes and deletes to the authenticated owner, accepts only JPEG, PNG, WebP, and AVIF images, and caps files at 2 MB.

## Password and recovery

Password changes require the current password and a new password of at least eight characters. The existing email recovery flow remains available from the settings form for users who no longer know their password.

## Account deletion

Permanent deletion requires the user to type their account email again. The server checks `get_account_deletion_blockers()` and refuses deletion while the user owns any workspace. A deferred database constraint also prevents an Owner membership from disappearing while its workspace still exists, closing races and protecting direct administrative operations.

The Supabase Admin API performs the final auth-user deletion. `SUPABASE_SECRET_KEY` is server-only and required in production; it must never use a `NEXT_PUBLIC_` prefix. Local development may discover the temporary secret from `supabase status`. Before the auth user is removed, the server deletes that user's avatar and task attachment objects to avoid orphaned Storage data.
