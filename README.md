<div align="center">

# 🏛️ ATHENAEUM
### *Next-Generation Academic Library Platform*

[![Live Demo](https://img.shields.io/badge/Live_Demo-lms--ten--dusky.vercel.app-gold?style=for-the-badge&logo=vercel&logoColor=white)](https://lms-ten-dusky.vercel.app/)
[![React Router](https://img.shields.io/badge/React_Router-v8.1-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

<p align="center">
  <b>Athenaeum</b> is a state-of-the-art library management system crafted with a <i>"quiet luxury"</i> glassmorphic interface, fluid motion physics, multi-branch circulation engines, enterprise security, and real-time analytical dashboards.
</p>

[✨ Live Demo](https://lms-ten-dusky.vercel.app/) · [🛡️ Security Architecture](#-security-architecture) · [🚀 Quick Start](#-getting-started) · [📚 Documentation](#-system-architecture)

</div>

---

## 🌟 Key Highlights

- **🎨 Quiet Luxury Design System** — Deep ink charcoals, warm ivory paper tones, brushed gold accents, frosted glassmorphism (`.glass-strong`), and Framer Motion micro-interactions.
- **🛡️ Hardened Authentication & Zero-Enumeration** — Multi-layered defense against credential harvesting, timing attacks, brute-force attempts, and unauthorized access.
- **⚡ Modern Tech Stack** — React Router v8 (SSR & route modules), Tailwind CSS v4, Zustand state management, and TanStack React Query.
- **📖 Comprehensive Circulation Engine** — Real-time checkout, return, renewal, hold queues, and mobile camera QR/Barcode scanning for instant book check-in (`/circulation?checkin=<barcode>`).
- **💰 Financials & Automated Fine Accrual** — Configurable fine policies, automated daily cron jobs via `pg_cron`, interactive financial charts (Recharts), and fine payment QR code generation.
- **🏢 Multi-Branch & Digital Library** — Inter-branch book transfers, e-book reader support with secure Supabase Storage buckets, and recommendation engines.

---

## 🛡️ Security Architecture

Athenaeum implements a **defense-in-depth security model** protecting both the API surface and the database layer:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INCOMING HTTP REQUEST                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 1. Sliding-Window Rate Limiting & Account Lockout Guard  │
       │    (Max 5 attempts / 15-min window per IP + Email target)│
       └─────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 2. Equalized Execution Timing & Constant-Time Responses  │
       │    (Mitigates timing attacks & eliminates user enum)     │
       └─────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 3. Server Route Guards (`app/lib/auth.ts`)               │
       │    (Hierarchical role validation: Student < Admin)       │
       └─────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │ 4. Supabase Row Level Security (RLS) (`schema.sql`)      │
       │    (Database-level isolation & SECURITY DEFINER policy)  │
       └──────────────────────────────────────────────────────────┘
```

### Security Capabilities
- **User Enumeration Prevention:** All auth routes (`login`, `signup`, `forgot-password`) return uniform, generic messages (e.g., *"Invalid email or password"*) with constant-time execution delays (`equalizeTiming`).
- **Cryptographic Reset Tokens:** Password reset tokens use 256-bit entropy (`crypto.randomBytes(32)`), are stored exclusively as **SHA-256 digests**, expire strictly after **1 hour**, and enforce single-use consumption.
- **Email Verification Guard:** New registrations require confirmed email ownership before account activation.
- **Slow KDF Password Storage:** Passwords are hashed using slow, memory-hard key derivation algorithms (bcrypt / Argon2) via Supabase Auth.

---

## 👥 Role-Based Access Control (RBAC)

Athenaeum enforces hierarchical permissions across 4 distinct user tiers:

| Role | Hierarchy | Capabilities |
| :--- | :---: | :--- |
| **Student** | Tier 1 | Browse catalog, reserve books, hold items, view borrowing history & personal fines. |
| **Faculty** | Tier 2 | Extended 28-day loan limits, higher borrowing caps (10 items), digital resource access. |
| **Librarian** | Tier 3 | Circulation console: issue/return loans, manage hold queues, camera barcode scanner. |
| **Admin** | Tier 4 | Full system oversight: role management, branch creation, fine policies & financial analytics. |

---

## 🛠️ System Architecture

```
app/
├── root.tsx                  # HTML shell, fonts, theme & provider injection
├── routes.ts                 # React Router v8 configuration
├── app.css                   # Tailwind v4 design tokens (ink/gold/paper, glass)
├── routes/
│   ├── _auth.tsx             # Auth layout (split-screen with Hyperspeed canvas)
│   ├── _auth.login.tsx       # Rate-limited login with generic anti-enumeration
│   ├── _auth.signup.tsx      # Registration with email verification enforcement
│   ├── _auth.forgot-password.tsx # Secure SHA-256 reset token generator
│   ├── _auth.reset-password.tsx  # Single-use reset token validator
│   ├── _dashboard.tsx        # Protected application shell
│   ├── _dashboard._index.tsx # Personalized user portal
│   ├── _dashboard.catalog.tsx# Interactive catalog (filters, search, holds)
│   ├── _dashboard.circulation.tsx # Circulation console & barcode camera scanner
│   ├── _dashboard.admin.tsx  # Admin portal (user management & financial charts)
│   └── _dashboard.profile.tsx# User profile & borrowing settings
├── lib/
│   ├── auth.ts               # Route guards (requireAuth, requireRole)
│   ├── auth-security.ts      # Rate limiter, token hasher & timing equalizers
│   ├── validation.ts         # Zod schemas for request validation
│   └── supabase/             # Server/client clients, cookies & RLS types
└── components/
    ├── ui/                   # Glass cards, buttons, text fields, badges
    ├── layout/               # Navigation sidebar, topbar, page headers
    └── motion/               # Framer Motion animation presets
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Supabase Account**: A free or paid Supabase project

### 2. Installation & Configuration

Clone the repository and install dependencies:

```bash
git clone https://github.com/Satyasisir-06/LMS.git
cd LMS
npm install
```

Copy `.env.example` to `.env` and populate your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

### 3. Database Setup

Run the schema and migration scripts in your **Supabase SQL Editor**:

1. Execute `supabase/schema.sql` (Creates RBAC, profiles, triggers & RLS policies).
2. Execute `supabase/migrations/20260726000000_password_resets.sql` (Password reset table & functions).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💻 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Starts Vite dev server with Hot Module Replacement (HMR) |
| **Build** | `npm run build` | Compiles production client assets and server bundle |
| **Start** | `npm run start` | Launches production server via `@react-router/serve` |
| **Type Check** | `npm run typecheck` | Validates TypeScript types and route module declarations |

---

## 🌐 Deployment

The application is optimized for deployment on **Vercel** or any Node.js / Docker container host.

- **Live URL:** [https://lms-ten-dusky.vercel.app/](https://lms-ten-dusky.vercel.app/)

### Supabase Production URL Configuration
Set the following under **Authentication ➔ URL Configuration** in your Supabase Dashboard:

- **Site URL:** `https://lms-ten-dusky.vercel.app`
- **Redirect URLs:**
  ```text
  https://lms-ten-dusky.vercel.app/reset-password
  https://lms-ten-dusky.vercel.app/login
  https://lms-ten-dusky.vercel.app/**
  ```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Crafted with precision for modern academic libraries. Designed & Engineered by <a href="https://github.com/Satyasisir-06">Satyasisir</a>.</sub>
</div>
