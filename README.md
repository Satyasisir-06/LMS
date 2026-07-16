# Athenaeum

A handcrafted, premium library management system — *"quiet luxury"* glassmorphism
aesthetic, fluid Framer Motion interactions, and a secure Supabase backend with
role-based access control.

Built on **React Router v8** (Remix's successor — same loader/action/route-module
conventions), **Tailwind CSS v4**, **Zustand**, **TanStack React Query**, and
**Supabase** (Postgres, Auth, Storage).

## Roles & RBAC

| Role        | Capabilities                                              |
| ----------- | -------------------------------------------------------- |
| Student     | Browse catalog, borrow, wishlist, view own history       |
| Faculty     | Student privileges + extended loan limits (Phase 2)      |
| Librarian   | Circulation engine: borrow/return/renew/holds (Phase 2)  |
| Admin       | Full oversight: users, roles, analytics, multi-branch    |

Access is enforced in **two layers**:

1. **Server-side route guards** (`app/lib/auth.ts`) — `requireAuth` /
   `requireRole` redirect unauthenticated or under-privileged requests before
   any UI renders.
2. **Supabase Row Level Security** (`supabase/schema.sql`) — every query is
   isolated by role at the database level, even if the client is bypassed.

## Getting started

### 1. Environment

Copy the template and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

> The anon key is safe to expose (RLS enforces access). The service-role key is
> server-only and never reaches the browser.

### 2. Database

Run `supabase/schema.sql` in the Supabase SQL editor (or `supabase db push`).
This creates the `user_role` enum, `profiles` table, the auto-profile trigger on
signup, RLS policies, and admin tooling (`set_user_role`).

### 3. Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

### 4. First admin

Sign up via the UI (creates a `student` profile), then promote yourself in the
SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@university.edu');
```

After that, use `select public.set_user_role('<uuid>', 'librarian');` to manage
roles. Sign out and back in to pick up the new role.

## Scripts

| Command             | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server with HMR                      |
| `npm run build`     | Production build (client + server)       |
| `npm run start`     | Serve the production build (Node)        |
| `npm run typecheck` | Generate route types + `tsc`             |

## Architecture (Phase 1)

```
app/
├─ root.tsx                 HTML shell, fonts, providers, ENV + theme injection
├─ routes.ts                Route config (auth + dashboard layouts)
├─ app.css                  Tailwind v4 design tokens (ink/gold/paper, glass, motion)
├─ routes/
│  ├─ _auth.tsx             Auth layout (split-screen + aurora)
│  ├─ _auth.login.tsx       Sign-in (RHF + zod + Supabase)
│  ├─ _auth.signup.tsx      Sign-up with role selection
│  ├─ _dashboard.tsx        Protected shell (loader gate + headers forwarding)
│  ├─ _dashboard._index.tsx Personalized dashboard home
│  ├─ _dashboard.catalog.tsx Catalog (visual; wired in Phase 2)
│  ├─ _dashboard.circulation.tsx  Librarian+ (Phase 2)
│  ├─ _dashboard.admin.tsx        Admin-only (Phase 3/4)
│  ├─ _dashboard.profile.tsx      Real account details
│  └─ logout.tsx            Sign-out action
├─ lib/
│  ├─ auth.ts               getAuthUser / requireAuth / requireRole
│  ├─ navigation.ts         Role-gated nav config
│  ├─ validation.ts         zod schemas
│  └─ supabase/             env, browser + server clients, cookies, types
├─ stores/                  Zustand: auth-store, ui-store (sidebar + theme)
├─ providers/               QueryProvider, ThemeProvider, AppProvider (user ctx)
└─ components/              ui/ (glass, button, field, badge, logo, aurora…)
                           layout/ (sidebar, topbar, page-header)
                           dashboard/ (stat-card)
                           motion/ (Framer Motion variants)
supabase/
└─ schema.sql               RBAC schema, profiles, RLS, triggers
```

### Design system

- **Typography** — Playfair Display (serif display) + Inter (sans) + JetBrains Mono.
- **Palette** — deep *ink* charcoal, muted *gold* accent, warm *paper* ivory
  (dark-first with a light toggle, no-FOUC).
- **Glassmorphism** — `.glass` / `.glass-strong` frosted surfaces with backdrop
  blur and hairline gold borders.
- **Motion** — shared Framer Motion presets (`fadeUp`, `staggerContainer`, …),
  animated route transitions, sidebar active-indicator (`layoutId`), aurora halo.

## Deployment

The production build (`npm run build`) outputs a server-rendered Node app served
by `@react-router/serve` (`npm run start`) and is Docker-ready (see `Dockerfile`).

**Vercel:** React Router's official Vercel adapter (`@vercel/react-router`)
currently targets v7; v8 support is pending upstream release. Until then,
deploy via the Node runtime or Docker. When the v8-compatible adapter lands,
wire it in via the `presets` option in `react-router.config.ts`.

## Status & roadmap

The project has moved well beyond its original "Phase 1" scope. The following
are **implemented and live** in the codebase (each backed by the corresponding
`supabase/migrations/2026*` files):

- **Phase 1** — Auth + RBAC shell, role-gated navigation, dashboard, profile.
- **Phase 2** — Catalog (search/filter by genre & branch, holds), Circulation
  (check-out / check-in / renew / hold queue, QR/barcode camera scan), and a
  Borrowing Transaction Card whose QR is a deep link (`/circulation?checkin=<barcode>`)
  that opens Check In pre-filled when scanned by any camera app,
  Catalog Management (branches, categories, authors, books, physical copies).
- **Phase 3** — Financials & analytics: configurable `fine_settings`, an
  `apply_overdue_fines` RPC + `apply-overdue-fines` Edge Function, admin
  charts (Recharts), fine-policy controls, and per-user fines with a payment QR.
- **Phase 4** — Multi-branch (branches + inter-branch transfers), digital
  library (eBooks via Supabase Storage), wishlists, and category-based
  recommendations.

### Backlog (genuine remaining upgrades)

These are the items still missing or only partially done — the real next steps:

- **Admin user & role management UI** — implemented: the Administration page
  lists members and promotes/demotes roles via `set_user_role`.
- **Automate fine accrual** — done: a `pg_cron` job runs `apply_overdue_fines()`
  daily at 02:00 (see `20260716000000_schedule_overdue_fines.sql`).
- **Real fine payment** — payment is a placeholder `pay.athenaeum.edu` URL +
  static QR; wire an actual provider (e.g. Stripe) or a configurable link.
- **Faculty extended loan limits** — enforced: faculty get a 28-day loan period
  (vs 14 days for students) and a 10-title borrowing cap (vs 5).
- **Richer recommendations** — current engine is simple category-based; consider
  collaborative filtering.
- **Vercel deploy** — `@vercel/react-router` targets RR v7; a v8-compatible
  adapter is still pending upstream (deploy via Node/Docker for now).
