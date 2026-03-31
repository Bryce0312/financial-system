# Financial System

Monorepo for the intelligent reimbursement platform V1.

## Apps

- `apps/web`: Next.js employee/admin web app
- `apps/api`: NestJS API

## Packages

- `packages/types`: shared contracts, enums, and Zod schemas
- `packages/ui`: reusable UI helpers/components
- `packages/config`: shared tsconfig presets

## Local development

1. Copy `.env.example` to `.env`.
2. Start dependencies with `docker compose up -d`.
3. Install dependencies.
4. Run `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`.
5. Start web and api with workspace scripts.

