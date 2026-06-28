# Production deployment

Relay uses Vercel for the Next.js application and a separate hosted Supabase project for production data. Never connect a preview deployment or local test suite to the production database.

## 1. Supabase production

1. Create a hosted project in the intended production region and keep its database password in a password manager.
2. Add the GitHub `production` environment secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, and `SUPABASE_DB_PASSWORD`.
3. Run **Deploy production database** from GitHub Actions. It executes the complete local RLS suite, prints a dry-run migration plan, and then applies committed migrations.
4. In Authentication, set the Site URL to the final HTTPS domain and allow `https://<domain>/auth/callback`. Add the Supabase OAuth callback URL to the production Google client.
5. Configure production SMTP, `RESEND_API_KEY`, and a verified `INVITATION_FROM_EMAIL`. Confirm that confirmation, recovery, and invitation messages arrive outside the development mailbox.
6. Run Supabase Security Advisor and resolve every RLS or exposed-function finding before launch.

The CI database job remains the authoritative Owner/Admin/Member/outsider policy gate. Production migrations must not be edited in the dashboard after deployment; create a new migration instead.

## 2. Vercel application

Import the GitHub repository into Vercel and use pnpm. Configure these production variables:

```text
NEXT_PUBLIC_SITE_URL=https://relay.example.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
RESEND_API_KEY=<resend-key>
INVITATION_FROM_EMAIL=Relay <hello@relay.example.com>
NEXT_PUBLIC_SENTRY_DSN=<public-dsn>
SENTRY_ORG=<organization-slug>
SENTRY_PROJECT=<project-slug>
SENTRY_AUTH_TOKEN=<source-map-upload-token>
```

Google OAuth credentials belong in Supabase, not Vercel. `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, and `SENTRY_AUTH_TOKEN` are server-only. Never prefix them with `NEXT_PUBLIC_`. When `RESEND_API_KEY` is set, Relay requires `INVITATION_FROM_EMAIL` to be an explicit verified Resend sender instead of falling back to the local development sender. Vercel Analytics and Speed Insights activate automatically after deployment.

Connect the final domain, redeploy after environment changes, and verify `/api/health`. Relay applies CSP, clickjacking, MIME-sniffing, referrer, permissions, opener, and production HSTS headers through Next.js.

## 3. Preview isolation

Use Supabase Branching with the GitHub integration for isolated preview databases and preview environment variables. If Branching is unavailable, use one dedicated staging project with disposable data. Never expose production secrets to pull-request deployments from forks.

Each preview must pass the public login smoke, mobile reflow, and accessibility checks. Stateful collaboration E2E continues to run against the disposable local Supabase stack in CI.

## 4. Monitoring and backups

- Create a Sentry Next.js project, add the public DSN plus server-only source-map credentials, trigger one controlled test error, and confirm the stack trace names application source files.
- Keep Vercel Web Analytics and Speed Insights enabled. Review Web Vitals and error rates after every release.
- Enable Supabase daily backups on a plan that supports them; enable point-in-time recovery when the recovery objective requires it. The current free-tier fallback is `.github/workflows/backup-database.yml`: it creates a daily logical dump, encrypts it with the production environment key before upload, and retains the private artifact for 30 days.
- Quarterly, restore the newest backup into a temporary project and record the recovery time. A backup that has never been restored is only a theory.

## 5. Release and rollback

Run `pnpm release:check`, deploy the database migration, deploy Vercel, and then run `pnpm test:smoke:production` with `PRODUCTION_URL`. GitHub also starts the smoke suite for successful Vercel Production deployment events.

For an application regression, promote the last healthy Vercel deployment. For a database regression, prefer a forward-fix migration. Restore a backup only for destructive data loss, after disabling writes and recording the incident timeline.
