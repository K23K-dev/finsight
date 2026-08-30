# FinSight

FinSight is a full-stack personal finance dashboard for understanding accounts, transactions, cash flow, and budgets in one place.

## What it does

- Connects financial accounts through SimpleFin and keeps balances and transactions synchronized.
- Visualizes net worth and cash-flow history.
- Supports transaction review, categorization, search, and custom labels.
- Tracks budgets against real transaction activity.
- Authenticates users with Google through Better Auth.

## Architecture

```text
apps/
  nextjs/       Next.js dashboard, authentication routes, and tRPC endpoint
packages/
  api/          Shared tRPC routers and server logic
  auth/         Better Auth configuration
  db/           Drizzle schema and Neon client
  ui/           Shared web UI components
  validators/   Shared Zod schemas
tooling/        Shared lint, formatting, Tailwind, and TypeScript configuration
```

The browser talks to the tRPC API hosted by the Next.js application. Core financial data lives in Postgres through Drizzle.

## Stack

- Next.js 16 and React 19
- TypeScript, tRPC, TanStack Query, and Zod
- Tailwind CSS and shared shadcn-style components
- Better Auth with Google OAuth
- Drizzle ORM and Neon Postgres
- Turborepo and pnpm workspaces

## Local setup

### Prerequisites

- Node.js 22.18 or newer
- pnpm 10.19 or newer
- A Postgres database

### Web application

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and configure the database and authentication credentials.

3. Apply the Drizzle schema:

   ```bash
   pnpm db:push
   ```

4. Start the web application:

   ```bash
   pnpm dev:next
   ```

## Useful commands

| Command          | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `pnpm dev:next`  | Run the Next.js app and its workspace dependencies |
| `pnpm db:push`   | Apply the Drizzle schema to Postgres               |
| `pnpm typecheck` | Type-check the workspace                           |
| `pnpm lint`      | Run ESLint across the workspace                    |
| `pnpm format`    | Check formatting                                   |
| `pnpm build`     | Build production workspace targets                 |
