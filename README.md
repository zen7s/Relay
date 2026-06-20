# Relay

Relay is an English-language project management SaaS for small product and creative teams. The MVP is being delivered in explicit stages, with one reviewed commit per completed stage.

## Current state

Stages 1–4 are implemented: the responsive application shell and workspace-isolated database now include cookie-backed Supabase SSR authentication, email confirmation and recovery, Google OAuth integration, protected routes, generated profiles, and atomic first-workspace onboarding.

## Requirements

- Node.js 20.9 or newer (Node.js 24 recommended)
- pnpm 11.8.0
- Docker Desktop or another Docker-compatible runtime for local Supabase

Email authentication runs entirely against local Supabase. The template values keep the local stack bootable, while a real Google Cloud OAuth client is required for Google sign-in.

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm db:start
# Copy the printed Project URL and Publishable key into .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The Supabase command requires Docker and prints the local URL and development keys. The unused Edge Runtime container is excluded; Auth, REST, Realtime, Storage, and Studio remain available. Confirmation and recovery emails are captured by Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324).

Apply all migrations, seed data, and database verification gates:

```bash
pnpm db:verify
```

Supabase Studio is available at [http://127.0.0.1:54323](http://127.0.0.1:54323). See [database architecture](docs/database.md) and [authentication setup](docs/authentication.md), including the required Google callback URLs.

## Quality commands

```bash
pnpm format:check  # formatting
pnpm lint          # ESLint and architectural boundaries
pnpm typecheck     # strict TypeScript
pnpm test          # unit and component tests
pnpm build         # production build
pnpm test:e2e      # browser auth and responsive tests; requires local Supabase
pnpm check         # formatting, lint, types, and unit tests
pnpm db:verify     # reset, lint, RLS tests, and generated-type check
pnpm db:types      # regenerate TypeScript types after schema changes
```

GitHub Actions runs the same quality gates, database security suite, and a separate Playwright job.

## Design system

Relay uses a graphite neutral palette with an indigo accent, Geist typography, Lucide icons, compact radii, and restrained shadows. Light, dark, and system themes are stored through `next-themes`; semantic colors live in `src/app/globals.css` as CSS variables.

Reusable controls and content states live in `src/shared/ui`. The current set includes buttons, inputs, dialogs, dropdown menus, avatars, sheets, skeletons, badges, empty/error states, and Sonner toasts. `components.json` keeps future shadcn-compatible additions aligned with the same aliases and styling conventions.

The application shell adapts at three levels:

- Desktop: full sidebar, workspace switcher, search header, and account controls.
- Tablet: compact icon navigation with the same content hierarchy.
- Mobile: touch-friendly header, navigation drawer, and fixed quick navigation.

The dashboard content is representative UI for this stage. Project and task behavior is connected in later roadmap stages.

## Architecture

The source tree follows an FSD-inspired dependency direction adapted for the Next.js App Router:

```text
src/
├── app/       Next.js routes, layouts, providers, and global styles
├── views/     route-level compositions rendered by app routes
├── widgets/   substantial reusable page sections
├── features/  user actions and business use cases
├── entities/  domain models and entity-focused UI
└── shared/    framework-agnostic UI, configuration, utilities, and API clients
```

Dependencies point downward only: `app → views → widgets → features → entities → shared`. ESLint enforces the layer boundaries for alias imports. Each slice exposes a public API through `index.ts`; cross-slice imports should use that public API instead of internal files.

Server Components are the default. Client Components are introduced only at interactive boundaries. Server data will remain in Supabase and TanStack Query; local UI state stays in React state or the URL unless a later requirement demonstrates a need for something else.

## Environment

`.env.example` documents public application values and local OAuth placeholders. Environment parsing rejects partial or malformed Supabase configuration. Google client secrets, service-role keys, and other private values must never use the `NEXT_PUBLIC_` prefix.

The production UI is English-only. Project documentation may be written in English or Russian.
