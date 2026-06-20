# Authentication and onboarding

Relay uses Supabase Auth with PKCE and cookie-backed SSR sessions. The browser and server clients are intentionally separate, and `src/proxy.ts` refreshes tokens with `getClaims()` before private routes render. Private layouts repeat the claims check on the server; database access remains protected by RLS.

## Routes

- `/login` — Google OAuth and email/password sign-in.
- `/signup` — Google OAuth and email/password registration.
- `/forgot-password` — requests a recovery email without exposing whether an account exists.
- `/reset-password` — accepts a recovery session and updates the password.
- `/auth/callback` — exchanges PKCE codes and only accepts relative `next` paths.
- `/onboarding` — updates the generated profile and atomically creates the first workspace and Owner membership.

## Local email flow

1. Copy the environment template and start Supabase:

   ```bash
   cp .env.example .env
   pnpm db:start
   ```

2. Copy the printed Project URL and Publishable key into `.env`.
3. Start the app with `pnpm dev`.
4. Open Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324) to follow confirmation and recovery links.

Local confirmation is required in `supabase/config.toml`, matching the hosted production behavior.

## Google OAuth

Google credentials are external secrets and are not committed. To enable the provider locally:

1. Create a Web application OAuth client in Google Auth Platform.
2. Add `http://127.0.0.1:3000` as an Authorized JavaScript origin.
3. Add `http://127.0.0.1:54321/auth/v1/callback` as an Authorized redirect URI.
4. Put the credentials in the root `.env` file:

   ```dotenv
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-client-secret
   ```

5. Restart the local stack with `pnpm db:stop && pnpm db:start`.

The CLI automatically substitutes root `.env` values referenced through `env(...)`. Never add the client secret to a `NEXT_PUBLIC_` variable.

For a hosted Supabase project, configure the Google Client ID and secret in Auth Providers, add the hosted Supabase callback shown there to Google, and add the application callback URL (`https://your-domain.example/auth/callback`) to the Supabase redirect allow list.

## Verification

`pnpm test:e2e` requires the local Supabase stack. Its global setup creates an isolated confirmed user, and the auth lifecycle test covers signup, Mailpit confirmation, PKCE exchange, onboarding, private-route access, password recovery, and login with the updated password.

The database suite verifies automatic profile creation, atomic onboarding, Owner membership, idempotency, slug collisions, input validation, and anonymous denial.
