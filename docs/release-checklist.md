# Release checklist

## Before deployment

- [ ] Pull request CI is green: format, lint, types, unit/component, production build, bundle, Lighthouse, database/RLS, and E2E.
- [ ] Database migration dry run contains only reviewed changes.
- [ ] Supabase Security Advisor has no unresolved production findings.
- [ ] Preview passes desktop, tablet, 320 px mobile, keyboard, and reduced-motion review.
- [ ] Loading, failed mutation rollback, cancelled upload, and realtime reconnect behavior are verified.
- [ ] A current backup exists and the rollback owner is identified.

## Production configuration

- [ ] Final domain, Supabase Auth Site URL, callback allow-list, and Google callback agree exactly.
- [ ] Production Resend domain and `INVITATION_FROM_EMAIL` sender are verified.
- [ ] Vercel public and server-only environment variables are scoped correctly.
- [ ] Sentry receives errors with readable source maps and no unnecessary personal data.
- [ ] Vercel Analytics and Speed Insights are receiving production traffic.
- [ ] A dedicated, non-admin smoke user exists and its credentials are GitHub environment secrets.

## After deployment

- [ ] `/api/health` reports application and Supabase status `ok`.
- [ ] Production smoke workflow passes, including security headers and public accessibility.
- [ ] Smoke account can sign in and load its workspace without writes.
- [ ] Signup confirmation, password recovery, invitation, Realtime, upload, and secure download receive a manual spot check.
- [ ] Error rate, Core Web Vitals, Auth logs, and database load remain healthy during the observation window.
- [ ] Release commit and deployment URLs are recorded; the team knows the active rollback target.
