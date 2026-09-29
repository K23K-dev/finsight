# FinSight

FinSight is a full-stack personal finance dashboard for understanding accounts, transactions, cash flow, and budgets in one place.

## What it does

- Connects financial accounts through SimpleFin and keeps balances and transactions in sync, on demand and on a daily schedule.
- Categorizes new expenses with Amazon Bedrock after every sync. The model can decline when it isn't sure, and every category can be edited.
- Visualizes net worth and cash-flow history.
- Supports transaction search, review, and custom labels.
- Tracks budgets against real transaction activity.
- Authenticates users with Google through Better Auth.

## Architecture

```text
apps/
  nextjs/       Next.js dashboard, authentication routes, and tRPC endpoint
  pipeline/     AWS CDK stack and Lambda handlers for scheduled sync and categorization
packages/
  api/          Shared tRPC routers, SimpleFin sync, and Bedrock categorization
  auth/         Better Auth configuration
  db/           Drizzle schema and Neon client
  ui/           Shared web UI components
  validators/   Shared Zod schemas
tooling/        Shared lint, formatting, Tailwind, and TypeScript configuration
```

The browser talks to the tRPC API hosted by the Next.js application. Core financial data lives in Postgres through Drizzle.

### Background pipeline

Scheduled syncing and categorization run on AWS:

```text
EventBridge Scheduler (daily, 11:00 UTC)
  → Lambda schedule-syncs    queues one sync job per connected user
  → SQS sync queue           FIFO, one job per user at a time
  → Lambda sync-user         fetches from SimpleFin and writes to Postgres
  → SQS categorize queue     also fed by "Sync now" and account linking in the web app
  → Lambda categorize-user   categorizes new expenses with Amazon Bedrock
```

A job that fails three times moves to a dead-letter queue, and a CloudWatch alarm sends an email. Retrying is safe: imports use deterministic IDs and upserts, and the classifier only writes to rows that are still uncategorized.

## Stack

- Next.js 16 and React 19
- TypeScript, tRPC, TanStack Query, and Zod
- Tailwind CSS and shared shadcn-style components
- Better Auth with Google OAuth
- Drizzle ORM and Neon Postgres
- AWS CDK, EventBridge Scheduler, SQS, Lambda, and Amazon Bedrock
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

Without `CATEGORIZE_QUEUE_URL`, the web app works normally and skips queueing categorization.

### AWS pipeline

Requires the AWS CLI, configured for the target account.

1. Make sure the account can use Claude Haiku 4.5 in Amazon Bedrock in `us-east-1`.
2. Store the database URL as a Secrets Manager secret named `finsight/postgres-url`.
3. Set `vercelTeamSlug` and `vercelProjectName` in `apps/pipeline/cdk.json`. If the account already has an IAM OIDC provider for the Vercel team, also set `vercelOidcProviderArn`.
4. Bootstrap the CDK once, then deploy:

   ```bash
   pnpm --filter @finsight/pipeline exec cdk bootstrap aws://<account-id>/us-east-1
   pnpm --filter @finsight/pipeline deploy
   ```

5. Subscribe to failure alerts with the `AlertsTopicArn` output:

   ```bash
   aws sns subscribe --topic-arn <AlertsTopicArn> --protocol email --notification-endpoint you@example.com
   ```

6. In Vercel, turn on OIDC Federation for the project and set `CATEGORIZE_QUEUE_URL` and `AWS_ROLE_ARN` from the stack outputs.

## Useful commands

| Command                                   | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `pnpm dev:next`                           | Run the Next.js app and its workspace dependencies |
| `pnpm db:push`                            | Apply the Drizzle schema to Postgres               |
| `pnpm typecheck`                          | Type-check the workspace                           |
| `pnpm lint`                               | Run ESLint across the workspace                    |
| `pnpm format`                             | Check formatting                                   |
| `pnpm build`                              | Build production workspace targets                 |
| `pnpm --filter @finsight/pipeline synth`  | Generate the pipeline's CloudFormation template    |
| `pnpm --filter @finsight/pipeline deploy` | Deploy the AWS pipeline                            |
