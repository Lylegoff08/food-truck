# Food Truck POS MVP

Production-minded multi-tenant food truck POS and admin prototype built with Next.js 15 App Router, TypeScript, Prisma, and PostgreSQL for Vercel Hobby/free tier deployment. The app now includes auth, tenant-scoped CRUD, POS checkout, employee time tracking, pay rate history, GPS polling, staged nightly config rollout, audit logging, Stripe-connect-style account linking, payment transaction tracking, weekly revenue summaries, 3% billing logic, and super-admin controls.

## Stack

- Next.js 15 App Router
- TypeScript
- PostgreSQL (Neon or Supabase-compatible)
- Prisma ORM
- JWT session cookie auth
- Leaflet + OpenStreetMap for GPS display
- Stripe Connect-ready mock abstraction for tenant card payments
- Vitest for service and route-level tests

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed demo data:

```bash
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

## Run tests

```bash
npm test
```

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: session signing secret
- `APP_URL`: app base URL
- `STRIPE_CLIENT_ID`: reserved for future real Stripe Connect onboarding
- `STRIPE_SECRET_KEY`: reserved for future real Stripe API usage
- `CRON_SECRET`: optional secret for future cron-triggered config/billing jobs

## Demo credentials

- Tenant owner: `owner@demo.com` / `password123`
- Tenant manager: `manager@demo.com` / `password123`
- Second tenant owner: `second@demo.com` / `password123`
- Super admin: `super@demo.com` / `password123`

## Manual nightly config generation

From the UI:
- Open `/dashboard/config`
- Click `Generate nightly config now`

From the API while logged in:

```bash
curl -X POST http://localhost:3000/api/config/generate
```

This creates a new `ConfigVersion` even when there are no queued product changes.

## Stripe linking structure

- Billing UI lives at `/dashboard/billing`
- `POST /api/billing/connect/start` starts a clean mock Connect onboarding flow and returns a placeholder onboarding URL
- `POST /api/billing/connect/save` stores linked Stripe account metadata on the company
- `GET /api/billing/status` returns connection state plus weekly revenue summary
- `POST /api/billing/disconnect` disconnects only when the prototype safety rule allows it
- Card checkout uses the tenant company’s `stripeAccountId` through a payment service abstraction rather than calling Stripe directly from UI code

## Weekly fee threshold

- Weekly gross sales are calculated from paid orders only
- Unpaid or failed card orders do not count
- If weekly gross sales are `<= 499.00`, platform fee due is `0`
- If weekly gross sales are `> 499.00`, platform fee due is `grossSales * 0.03`
- Billing history is stored in `CompanyWeeklyRevenue`

## GPS polling

- Truck or POS clients post location updates to `/api/gps/locations`
- The latest point is upserted into `TruckLocation`
- Periodic history snapshots are appended to `TruckLocationHistory`
- The GPS dashboard polls `/api/gps/locations` every 15 seconds
- No WebSockets or always-on server are required

## Staged config rollout

- Product edits update the intended admin-side product record immediately
- Product changes are also written to `ProductChangeQueue`
- Nightly config generation creates a versioned bundle in `ConfigVersion`
- Each active truck gets a `ConfigVersionTruck` record with `pending`, `applied`, or `failed`
- Trucks fetch the latest assigned config from `/api/config/latest?truckId=...`
- Trucks acknowledge success or failure through `/api/config/ack`
- Historical orders remain correct because `OrderItem` stores product name and price snapshots at sale time

## Auth and tenant isolation

- Login and registration issue an HTTP-only JWT cookie
- Protected pages require a valid session
- Suspended companies are blocked from normal app access via session resolution
- Route handlers never trust `companyId` from the client
- Services scope all queries by `user.companyId`
- Cross-tenant access is blocked by tenant-filtered lookups before updates or reads
- Owner/manager-only features include time entry editing, pay rate management, GPS admin reads, billing pages, and config generation
- Super admin features live at `/dashboard/super-admin`

## Notes on Python

This prototype keeps nightly config generation and weekly revenue calculation in TypeScript route/service code because the current business rules are lightweight and directly compatible with Vercel serverless execution. A targeted Python function can be added later if revenue reconciliation or invoice generation becomes significantly more computation-heavy.

## Deploy to Vercel

1. Create a Postgres database in Neon or Supabase
2. Set the environment variables from `.env.example` in Vercel
3. Run Prisma migrations against the hosted database
4. Deploy the Next.js app to Vercel
5. Point future cron jobs at route handlers such as `/api/config/generate`

## Production-hardening placeholders

- Stripe account linking and card charges currently go through a clean mock gateway in `lib/payments`
- A real production rollout still needs actual Stripe OAuth/account-link creation, server-side webhook verification, and live PaymentIntent/Transfer handling
- Disconnect safety rules are prototype-only and should be revisited with real ledger requirements
- Billing summaries are intentionally lightweight and are not a full accounting or tax system

## Useful scripts

- `npm run dev`
- `npm run build`
- `npm test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
