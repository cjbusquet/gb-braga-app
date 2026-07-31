# CLAUDE.md — Architecture & Development Guidelines

## 1. Project Overview & Core Philosophy
This project separates **data/business logic** from **presentation components**.
- **Database & Auth:** Supabase (PostgreSQL 15 + RLS + Auth).
- **Frontend Stack:** React 19, TypeScript, Vite 8, TanStack Query.
- **Serverless/Functions:** Supabase Edge Functions (Deno runtime) for privileged backend logic; Vercel Serverless (`/api`) for webhook handlers (e.g., Stripe).
- **Integrations:** Stripe, TOConline (Invoicing), Meta WhatsApp API, Resend.

---

## 2. Common Commands

### Development
- `npm run dev` — Start Vite development server
- `npm run build` — Type-check (`tsc`) and bundle production build
- `npm run preview` — Locally preview production build

### Code Quality & Types
- `npm run lint` — Run ESLint check
- `npx tsc --noEmit` — Run TypeScript type checker without building

### Supabase / Backend (CLI)
- `npx supabase start` — Start local Supabase container stack
- `npx supabase gen types typescript --local > src/types/supabase.ts` — Regenerate database types
- `npx supabase functions serve <function-name>` — Local test for Edge Functions

---

## 3. Architecture & Folder Conventions

Maintain strict layer separation. UI components must never query Supabase directly; all data operations flow through custom hooks or API client wrappers.

src/
├── api/             # Low-level REST/Edge Function/Supabase SDK calls
├── assets/          # Static assets (images, global SVGs)
├── components/      # UI components (pure presentation)
│   ├── common/      # Reusable UI primitives (buttons, modals, inputs)
│   └── features/    # Feature-scoped components (e.g., contracts, billing)
├── context/         # React Context (Auth, Global App State ONLY)
├── hooks/           # Custom React hooks & TanStack Query wrappers
├── lib/             # Third-party SDK client setups (supabase.ts, stripe.ts)
├── pages/           # Route views / page-level layout wrappers
├── services/        # Isolated business logic, PDF generation (jsPDF), parsers
├── types/           # Global TypeScript definitions & Supabase generated types
└── utils/           # Pure, side-effect-free helper functions

---

## 4. Architectural Rules & Code Style

### Business Logic vs. UI
- **Components (`/components`, `/pages`):** Focus on markup, styling, and basic UI state (e.g., modal visibility). Never contain direct database queries or complex data transformations.
- **Data Fetching (`/hooks`):** Wrap TanStack Query (`useQuery`, `useMutation`) in dedicated custom hooks. Handle caching, invalidation keys, and optimistic updates here.
- **Services (`/services`):** Place complex domain calculations, document generation (e.g., `jsPDF`), and integration adapters here as pure TypeScript modules.

### Supabase & Row Level Security (RLS)
- Treat the client SDK as **publicly exposed**. All data security MUST be enforced at the PostgreSQL layer via **RLS policies**, not frontend filters.
- For elevated permissions or third-party webhooks (Stripe, TOConline), execute logic in **Supabase Edge Functions** or `/api/` Vercel endpoints using service role keys.

### Data Modeling & Mutability (Avoiding Desync Bugs)
1. **Single Source of Truth:**
   - NEVER duplicate identity/profile columns (e.g. `nome`, `email`, `avatar_url`) between the user/profile table (`profiles`) and domain tables (e.g. `alunos`, `professores`).
   - If a field belongs to the user, store it **exclusively** on `profiles` and JOIN or use a view to read it elsewhere.
   - If duplicating a column is strictly necessary for performance or readability:
     - Immediately add **bidirectional sync triggers** in PostgreSQL, guarded against infinite loops with `IS DISTINCT FROM`.
     - Ship a **backfill** migration to reconcile any rows that already drifted before the trigger existed.

2. **RLS Permission Audit (Security Definer vs. Invoker):**
   - When writing a trigger/function that syncs data across tables, explicitly check which roles can trigger that mutation.
   - If a role (e.g. staff/atendimento) can edit table A but is NOT covered by table B's RLS policies, the sync trigger MUST run as `SECURITY DEFINER` (or the policy gap must be closed directly) — otherwise the cascading write silently affects 0 rows and produces a "phantom" desync that looks fixed for admins but is still broken for that role.

3. **Frontend Mutation Architecture:**
   - When building a profile/personal-data edit form, NEVER assume the frontend is responsible for manually updating two tables in separate calls.
   - Centralize the mutation into a single API/RPC call or a database transaction so the write is atomic.

### TypeScript & Types
- Explicit return types are preferred on exported functions, hooks, and services.
- Never use `any`. Use `unknown` with type guards if types are unpredictable.
- Import database schema types from `src/types/supabase.ts` instead of writing manual interface duplicates for database models.

### React 19 & State
- Prefer TanStack Query for server state; avoid duplicating server state in React `useState` or `useContext`.
- Keep component props minimal and typed explicitly using `interface Props { ... }`.
- Icons: Use `Heroicons` exclusively for UI consistency.

---

## 5. Integration Handling

- **Stripe:** Webhook handling resides strictly in Vercel Serverless (`api/stripe-webhook.ts`). Verify signatures before processing events.
- **TOConline / WhatsApp / Resend:** Triggered via Supabase Edge Functions or backend endpoints to prevent exposing credentials/API keys on the client.
- **PDF Generation:** Encapsulate contract/report building inside `/services/pdf/`. Keep PDF styling functions isolated from component files.

---

## 6. Testing Strategy & Roadmaps (Planned)
- No test runner is currently installed.
- **Planned:** `Vitest` for unit testing services/utils, `Playwright` for end-to-end integration workflows.
- Write pure, decoupled functions in `/services` and `/utils` now to ensure seamless unit testing adoption later.
