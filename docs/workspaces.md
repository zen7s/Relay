# Workspaces, members, and invitations

Relay keeps the selected workspace in the URL. The workspace overview lives at `/w/[slug]`, with member management at `/w/[slug]/members` and workspace settings at `/w/[slug]/settings`. Renaming a workspace does not change its slug, so saved links remain stable.

## Roles

| Capability                             | Owner | Admin | Member |
| -------------------------------------- | ----- | ----- | ------ |
| View workspace and members             | Yes   | Yes   | Yes    |
| Rename workspace                       | Yes   | Yes   | No     |
| Invite, resend, and revoke invitations | Yes   | Yes   | No     |
| Change Admin/Member roles              | Yes   | Yes   | No     |
| Remove non-owner members               | Yes   | Yes   | No     |
| Transfer ownership                     | Yes   | No    | No     |
| Delete workspace                       | Yes   | No    | No     |

Every workspace has exactly one Owner. Ownership transfer is atomic: the selected member becomes Owner and the previous Owner becomes Admin. An Owner cannot leave until ownership has been transferred.

## Invitation security

- The application generates 256-bit random one-time tokens.
- PostgreSQL stores only the SHA-256 token hash.
- Links expire after seven days; resending invalidates the previous token.
- Acceptance locks the invitation row and records a terminal `accepted_at` value.
- The signed-in Supabase Auth email must exactly match the invited email, case-insensitively.
- Public previews expose only a masked email hint; membership creation happens in an authenticated atomic RPC.
- RLS remains the authorization boundary for workspace data and management lists.

## Email delivery

Local development sends invitation mail through Mailpit SMTP. The UI is available at [http://127.0.0.1:54324](http://127.0.0.1:54324), and `supabase/config.toml` exposes SMTP on port `54325`.

Production uses Resend when `RESEND_API_KEY` is configured:

```dotenv
RESEND_API_KEY=re_...
INVITATION_FROM_EMAIL=Relay <invites@your-domain.example>
```

Before deployment, create a Resend account, verify the sending domain, create an API key, and add both values only to the server-side production environment. Never use a `NEXT_PUBLIC_` prefix for the API key.

Relay intentionally fails server environment validation when `RESEND_API_KEY` is present without `INVITATION_FROM_EMAIL`. This prevents production from silently sending invitations through the local development sender identity.

## Verification

`pnpm db:verify` covers workspace isolation, role enforcement, one-time acceptance, email matching, resend/revoke behavior, membership changes, and Owner transfer. `pnpm test:e2e` additionally covers the complete browser flow from creating a second workspace through Mailpit delivery, invited-user signup, acceptance, role change, ownership transfer, and the previous Owner leaving.
