# Child Reward System

A family-scale reward and behavior-tracking app with two independent tracks:

1. **Weekly Screen Time Track** — resets every Monday
2. **Christmas Fund Track** — cumulative savings toward a yearly goal

Multi-family, multi-child, Row-Level-Security isolated. Built on Next.js 16 (App Router) and Supabase (Postgres + Auth).

## Features

- **Dual-track points** — screen-time points reset weekly; Christmas-fund points accumulate. Both can go negative for real consequences.
- **Daily tracking** — five configurable categories per family (Health, Screen Discipline, Self-Study, Household, Behavior & Respect) with bonus/deduction presets.
- **Weekly review** — finalize a week, log screen-time used, set next week's goal.
- **Dashboard** — multi-child switcher, charts, behavior trends, Christmas-fund progress.
- **RLS-enforced multi-tenancy** — one parent account seeds a family; children optionally get read-only login.
- **Configurable conversion rates** — points → minutes and points → dollars per family.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Turbopack dev)
- **Language**: TypeScript (strict)
- **Database**: Supabase Postgres with Row Level Security
- **Auth**: Supabase Auth (email/password)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Charts**: Recharts
- **Migrations**: Supabase CLI (`supabase/migrations/*.sql`)

## Getting Started

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) 2.84+
- A Supabase project (free tier is fine)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in values from your Supabase project's **Project Settings → API** and **Project Settings → Database**:

```bash
cp .env.example .env
```

Required keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_ACCESS_TOKEN=<personal-access-token>
```

### 3. Link the CLI to your Supabase project

```bash
supabase link --project-ref <project-ref>
```

### 4. Apply migrations

```bash
supabase db push
```

This runs every file in [supabase/migrations/](supabase/migrations/) against the linked project.

### 5. Load seed data (optional, recommended for first run)

```bash
supabase db push --include-seed
```

The seed creates a **Demo Family** with two children, default categories / bonus / deduction presets, and a week of sample daily tracking — enough to light up the dashboard before a real user signs up. See [supabase/seed.sql](supabase/seed.sql).

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up. The `handle_new_user` trigger creates your profile automatically; call `initialize_family()` (from the app's onboarding screen) to bootstrap default categories and presets for your family.

## Resetting a new instance

For a greenfield Supabase project:

```bash
supabase link --project-ref <project-ref>
supabase db push                  # apply schema migrations
supabase db push --include-seed   # load demo data
```

For a fresh local database (requires Docker):

```bash
supabase start
supabase db reset                 # applies migrations + seed automatically
```

## Database Layout

Ten tables, all in `public`, all RLS-protected:

| Table                 | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `families`            | Tenant root                                            |
| `profiles`            | Extends `auth.users` with family + role                |
| `children`            | Trackable children in a family                         |
| `configurations`      | Per-family conversion rates and goals                  |
| `categories`          | Per-family point categories                            |
| `bonus_presets`       | Per-family quick-add bonuses                           |
| `deduction_presets`   | Per-family quick-add deductions                        |
| `daily_tracking`      | One row per child per day                              |
| `bonus_events`        | Individual bonus/deduction events on a tracking row    |
| `weekly_summaries`    | Aggregated weekly totals per child                     |

Key functions:

- `initialize_family(name, user_id)` — creates a family and seeds default categories / presets.
- `get_weekly_summary(child_id, week_start, week_end)` — aggregates tracking for a week.
- `upsert_weekly_summary(...)` — persists weekly totals.
- `update_daily_tracking_total` trigger — keeps `daily_tracking.total_points` in sync.
- `auto_update_weekly_summary` trigger — rolls forward weekly summaries when tracking changes.

See [docs/DATABASE.md](docs/DATABASE.md) for the full ER diagram and policy reference.

## Project Structure

```
├── app/                        # Next.js App Router pages + API routes
│   ├── api/                    # Route handlers
│   ├── config/                 # Settings page
│   ├── tracking/               # Daily tracking page
│   ├── weekly/                 # Weekly review page
│   └── page.tsx                # Dashboard
├── components/                 # UI + shared components
├── contexts/                   # Client-side React contexts
├── docs/                       # Architecture, API, DB, deployment docs
├── lib/                        # Supabase client, utils
├── middleware.ts               # Supabase auth middleware
├── scripts/                    # Dev / maintenance scripts
├── supabase/
│   ├── config.toml             # Supabase CLI config
│   ├── migrations/             # Versioned SQL migrations
│   └── seed.sql                # Demo data loaded by `db reset` / `db push --include-seed`
└── types/                      # TypeScript types (incl. generated Supabase types)
```

## Point System

**Base categories (0–12 points/day):**

- 🥗 Health & Nutrition (0–3)
- 📱 Screen Discipline (0–2)
- 📚 Self-Study (0–2)
- 🏠 Household (0–3)
- ⭐ Behavior & Respect (0–2)

**Bonuses:** perfect day (+2), extra help (+3), etc.
**Deductions:** disrespect (−2), refused chore (−3), etc.

All presets are per-family and fully editable.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system diagrams, data flow, auth flow
- [Features](docs/FEATURES.md) — feature inventory and business logic
- [Database](docs/DATABASE.md) — schema, ER diagrams, RLS policies, functions
- [API](docs/API.md) — endpoints, request/response shapes
- [Deployment](docs/DEPLOYMENT.md) — Supabase + Vercel production setup
- [Future Roadmap](docs/FUTURE_ROADMAP.md) — planned work

## Troubleshooting

**`supabase db push` fails on a fresh project with "role already exists":** you're pushing against a database that already has some of the objects. Reset with `supabase db reset` (local) or drop and recreate the project (remote).

**Dashboard is empty after signup:** make sure you've loaded the seed (`--include-seed`) or completed the onboarding flow that calls `initialize_family()`.

**Local dev can't reach Supabase:** check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env`, then restart `npm run dev`.

---

**Built for effective, transparent behavior management with real-world consequences.**
