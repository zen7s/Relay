# Relay

Relay is an English-language project management SaaS for small product and creative teams. The MVP is being delivered in explicit stages, with one reviewed commit per completed stage.

## Current state

Stages 1–12 are implemented. Relay now includes the complete workspace-isolated product, production hardening, monitoring hooks, analytics, encrypted backups, isolated preview data, release automation, and production smoke coverage.

Production: [relay-vert-seven.vercel.app](https://relay-vert-seven.vercel.app)

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

The Supabase command requires Docker and prints the local URL and development keys. The unused Edge Runtime container is excluded; Auth, REST, Realtime, Storage, and Studio remain available. Confirmation, recovery, and workspace invitation emails are captured by Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324). Production invitations switch to Resend when its server-only API key and verified sender are configured. Production account deletion requires the server-only Supabase secret key; local development discovers the temporary key from the running CLI stack.

Apply all migrations, seed data, and database verification gates:

```bash
pnpm db:verify
```

Supabase Studio is available at [http://127.0.0.1:54323](http://127.0.0.1:54323). See [database architecture](docs/database.md), [authentication setup](docs/authentication.md), [workspace/member operations](docs/workspaces.md), [project/board operations](docs/projects.md), [task/Kanban operations](docs/tasks.md), [comments/attachment operations](docs/collaboration.md), [account settings](docs/account-settings.md), [motion/accessibility/performance checks](docs/quality.md), [deployment operations](docs/deployment.md), and the [release checklist](docs/release-checklist.md).

## Quality commands

```bash
pnpm format:check  # formatting
pnpm lint          # ESLint and architectural boundaries
pnpm typecheck     # strict TypeScript
pnpm test          # unit and component tests
pnpm build         # production build
pnpm bundle:check  # gzip client-bundle budgets; requires a build
pnpm performance:check # Lighthouse Performance and Accessibility >= 90
pnpm test:e2e      # browser auth and responsive tests; requires local Supabase
PRODUCTION_URL=https://relay.example.com pnpm test:smoke:production
pnpm check         # formatting, lint, types, and unit tests
pnpm db:verify     # reset, lint, RLS tests, and generated-type check
pnpm db:types      # regenerate TypeScript types after schema changes
```

GitHub Actions runs the same quality gates, bundle and Lighthouse budgets, database security suite, and a separate Playwright job with WCAG and browser performance checks.

## Design system

Relay uses a graphite neutral palette with an indigo accent, Geist typography, Lucide icons, compact radii, and restrained shadows. Light, dark, and system themes are stored through `next-themes`; semantic colors live in `src/app/globals.css` as CSS variables.

Reusable controls and content states live in `src/shared/ui`. The current set includes buttons, inputs, dialogs, dropdown menus, avatars, sheets, skeletons, badges, empty/error states, motion wrappers, and Sonner toasts. `components.json` keeps future shadcn-compatible additions aligned with the same aliases and styling conventions.

Product motion uses a shared 180 ms timing curve, transform/opacity-first animations, and automatic reduced-motion behavior. Workspace routes expose skeleton loading and retryable error states, while the task details panel is loaded as a separate client chunk only when opened.

The application shell adapts at three levels:

- Desktop: full sidebar, workspace switcher, search header, and account controls.
- Tablet: compact icon navigation with the same content hierarchy.
- Mobile: touch-friendly header, navigation drawer, and fixed quick navigation.

The dashboard reports live project and task totals. Project boards support mouse, touch, and keyboard drag and drop, with an explicit move menu available as a fallback. Moves appear optimistically, roll back on failure, and reconcile with the server through Supabase Realtime.

Task titles open a responsive details panel whose `task` query parameter preserves direct links and active board filters. The panel provides Realtime comments and private attachments with progress-aware uploads and short-lived signed downloads.

Personal settings include display name and avatar management, device theme selection, verified password changes, local logout, and permanent account deletion. Deletion is blocked until ownership of every workspace has been transferred or the owned workspaces have been removed; this invariant is enforced in both the UI and database.

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
