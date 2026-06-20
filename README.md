# Relay

Relay is an English-language project management SaaS for small product and creative teams. The MVP is being delivered in explicit stages, with one reviewed commit per completed stage.

## Current state

Stages 1–2 are complete: the application foundation is paired with a migration-driven Supabase schema, generated TypeScript types, explicit grants, workspace-isolated RLS, and pgTAP security tests.

## Requirements

- Node.js 20.9 or newer (Node.js 24 recommended)
- pnpm 11.8.0
- Docker Desktop or another Docker-compatible runtime for local Supabase

No hosted service accounts are required for the initialization stage.

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Start the local Supabase stack when database work begins:

```bash
pnpm db:start
```

The command requires Docker and prints the local URL and development keys. Copy the public values into `.env.local`. The unused Edge Runtime container is excluded; Auth, REST, Realtime, Storage, and Studio remain available.

Apply all migrations, seed data, and database verification gates:

```bash
pnpm db:verify
```

Supabase Studio is available at [http://localhost:54323](http://localhost:54323). The schema and role matrix are documented in [docs/database.md](docs/database.md).

## Quality commands

```bash
pnpm format:check  # formatting
pnpm lint          # ESLint and architectural boundaries
pnpm typecheck     # strict TypeScript
pnpm test          # unit and component tests
pnpm build         # production build
pnpm test:e2e      # browser smoke tests
pnpm check         # formatting, lint, types, and unit tests
pnpm db:verify     # reset, lint, RLS tests, and generated-type check
pnpm db:types      # regenerate TypeScript types after schema changes
```

GitHub Actions runs the same quality gates, database security suite, and a separate Playwright job.

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

`.env.example` documents public variables. Environment parsing accepts a completely unconfigured local app, but rejects partial or malformed Supabase configuration. Service-role and other private keys must never use the `NEXT_PUBLIC_` prefix.

The production UI is English-only. Project documentation may be written in English or Russian.
