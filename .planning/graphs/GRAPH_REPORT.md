# Graph Report - library  (2026-07-18)

## Corpus Check
- 88 files · ~385,203 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 476 nodes · 1009 edges · 48 communities (22 shown, 26 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d425593`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index-CU5cXRnL.js
- n
- .has
- _dashboard.manage.tsx
- cn
- _dashboard.wishlist.tsx
- compilerOptions
- dependencies
- eu
- Je
- auth.ts
- _dashboard.profile.tsx
- qn
- Vt
- Lt
- _dashboard.admin.tsx
- Communities
- devDependencies
- cl
- xv
- zc
- Athenaeum
- _dashboard.circulation.tsx
- ku
- seed.js
- xs
- framer-motion
- @react-router/serve
- recharts
- zod
- check_profiles.js
- get_admin_user.js
- _diag.mjs
- isbot
- react
- react-dom
- react-qr-code
- react-router
- @react-router/node
- @supabase/ssr
- @supabase/supabase-js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 40 edges
2. `getSupabaseBrowserClient()` - 22 edges
3. `useUser()` - 21 edges
4. `resolveBookCover()` - 16 edges
5. `OverdueManagement()` - 16 edges
6. `GlassCard()` - 15 edges
7. `compilerOptions` - 15 edges
8. `Catalog()` - 14 edges
9. `Button` - 13 edges
10. `Circulation()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `QRScanner()` --references--> `html5-qrcode`  [EXTRACTED]
  app/components/ui/qr-scanner.tsx → package.json
- `OverdueManagement()` --references--> `jspdf`  [EXTRACTED]
  app/routes/_dashboard.overdue.tsx → package.json
- `OverdueManagement()` --references--> `xlsx`  [EXTRACTED]
  app/routes/_dashboard.overdue.tsx → package.json
- `loader()` --calls--> `requireRole()`  [EXTRACTED]
  app/routes/_dashboard.overdue.tsx → app/lib/auth.ts
- `testAll()` --calls--> `getAdminStats()`  [EXTRACTED]
  scratch/test_queries.js → app/lib/supabase/analytics.ts

## Import Cycles
- None detected.

## Communities (48 total, 26 thin omitted)

### Community 3 - "_dashboard.manage.tsx"
Cohesion: 0.13
Nodes (25): createAuthor(), createBook(), CreateBookInput, createBranch(), createCategory(), createCopy(), getAuthors(), getBooks() (+17 more)

### Community 4 - "cn"
Cohesion: 0.07
Nodes (35): StatCard(), MobileDock(), LUX_EASE, MobileNav(), Sidebar(), Topbar(), AuroraBackground(), Badge() (+27 more)

### Community 5 - "_dashboard.wishlist.tsx"
Cohesion: 0.07
Nodes (31): fadeIn, fadeUp, luxEase, scaleIn, slideInLeft, staggerContainer, viewportOnce, TextField (+23 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (31): **/*, ./app/*, build, **/.client/**/*, DOM, DOM.Iterable, ES2022, node (+23 more)

### Community 10 - "auth.ts"
Cohesion: 0.15
Nodes (17): requireAuth(), requireRole(), AuthUser, hasRole(), Profile, ROLE_HIERARCHY, UserRole, AppContext (+9 more)

### Community 11 - "_dashboard.profile.tsx"
Cohesion: 0.11
Nodes (37): Notification, NotificationsBell(), toneClass, toneIcon, PageHeader(), getUserFines(), Book, getUserHolds() (+29 more)

### Community 15 - "_dashboard.admin.tsx"
Cohesion: 0.16
Nodes (19): checkInCopy(), collectFine(), getCategories(), getDepartments(), getOverdueReport(), getOverdueSummary(), getReminderHistory(), OverdueFilters (+11 more)

### Community 17 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, @react-router/dev, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+17 more)

### Community 24 - "Athenaeum"
Cohesion: 0.14
Nodes (13): 1. Environment, 2. Database, 3. Develop, 4. First admin, Architecture (Phase 1), Athenaeum, Backlog (genuine remaining upgrades), Deployment (+5 more)

### Community 25 - "_dashboard.circulation.tsx"
Cohesion: 0.08
Nodes (40): Button, ButtonProps, ButtonSize, ButtonVariant, sizes, variants, ErrorState(), GlassCard() (+32 more)

### Community 27 - "seed.js"
Cohesion: 0.20
Nodes (8): AUTHORS, BOOKS, BRANCHES, CATEGORIES, env, envContent, envPath, supabase

### Community 33 - "xs"
Cohesion: 0.33
Nodes (9): dotenvContent, getActiveLoans(), getAdminStats(), getAllHolds(), getFineSettings(), getLoansByBranch(), getPopularBooks(), runTests() (+1 more)

### Community 36 - "framer-motion"
Cohesion: 0.27
Nodes (7): accent, icons, Toaster(), Toast, ToastState, ToastVariant, useToastStore

### Community 39 - "recharts"
Cohesion: 0.29
Nodes (7): clsx, jspdf-autotable, dependencies, clsx, jspdf-autotable, recharts, recharts

### Community 47 - "_diag.mjs"
Cohesion: 0.67
Nodes (3): log(), main(), sb

## Knowledge Gaps
- **144 isolated node(s):** `LUX_EASE`, `Notification`, `toneIcon`, `toneClass`, `luxEase` (+139 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `recharts` to `n`, `.has`, `dependencies`, `eu`, `Je`, `qn`, `Vt`, `Lt`, `Communities`, `devDependencies`, `cl`, `xv`, `zc`, `ku`, `@react-router/serve`, `isbot`, `react`, `react-dom`, `react-qr-code`, `react-router`, `@react-router/node`, `@supabase/ssr`, `@supabase/supabase-js`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `OverdueManagement()` connect `_dashboard.admin.tsx` to `cl`, `.has`, `_dashboard.profile.tsx`, `cn`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `framer-motion`, `_dashboard.wishlist.tsx`, `_dashboard.profile.tsx`, `_dashboard.admin.tsx`, `_dashboard.circulation.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `LUX_EASE`, `Notification`, `toneIcon` to the rest of the system?**
  _144 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `_dashboard.manage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0726775956284153 - nodes in this community are weakly interconnected._
- **Should `_dashboard.wishlist.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0653061224489796 - nodes in this community are weakly interconnected._