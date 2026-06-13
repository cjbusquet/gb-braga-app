# 19 — Developer Manual

**Gracie Barra Braga — Complete Technical Reference**  
For full developer onboarding, see also `08-Developer-Guide.md`.

---

## 1. Quick Reference

### Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root router, role guards, history API |
| `src/lib/auth.tsx` | Authentication context |
| `src/lib/useData.ts` | All data fetching hooks |
| `src/lib/useModulos.tsx` | Module enable/disable system |
| `src/lib/gbBrand.ts` | Belt colors, brand constants |
| `src/lib/supabaseClient.ts` | Supabase singleton + demo mode flag |
| `src/types/index.ts` | All TypeScript types |
| `supabase/schema.sql` | Complete database schema |

### Key Patterns

#### Adding a feature that needs DB data
```typescript
// 1. Add to useData.ts
function useNewTable() {
  const [items, setItems] = useState([]);
  const load = async () => {
    const { data } = await supabase.from('new_table').select('*');
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);
  return { items, loading, refetch: load };
}

// 2. Use in page component
const { items } = useNewTable();
```

#### Adding a write operation
```typescript
// In useData.ts db object:
db.createItem = async (data: ItemInput) => {
  const { data: result, error } = await supabase
    .from('new_table')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
};
```

#### RLS-safe policy template
```sql
-- Read: own data or staff
CREATE POLICY "User reads own" ON table_name FOR SELECT
  USING (user_id = auth.uid() OR auth_role() IN ('admin','superadmin'));

-- Write: staff only
CREATE POLICY "Staff writes" ON table_name FOR ALL
  USING (auth_role() IN ('admin','superadmin'));
```

---

## 2. Supabase Project Details

| Property | Value |
|---|---|
| Project ID | `yrfdxocwhztokadzxtto` |
| Region | eu-west-1 (Ireland) |
| REST API | `https://yrfdxocwhztokadzxtto.supabase.co/rest/v1` |
| Auth | `https://yrfdxocwhztokadzxtto.supabase.co/auth/v1` |
| Storage | `https://yrfdxocwhztokadzxtto.supabase.co/storage/v1` |
| Edge Functions | `https://yrfdxocwhztokadzxtto.supabase.co/functions/v1` |

---

## 3. Database Schema Quick Reference

```sql
-- Key tables
profiles        -- Auth.users extension (role, nome, avatar_url)
alunos          -- Student records (faixa, grau, plano, status)
turmas          -- Class schedule (horario, dias_semana, cor)
pagamentos      -- Payment records (status, metodo, stripe_payment_id)
presencas       -- Attendance (gps_lat, gps_lng, gps_dist_m)
contratos       -- Enrollment contracts (assinatura_img, aceita_rgpd)
graduacoes      -- Belt promotion history
mensagens       -- Email/WhatsApp records
configuracoes   -- Key-value config (modulos, academia, email)
templates_mensagem -- Message templates
planos          -- Subscription plans

-- Key functions
auth_role()           -- Current user's role (SECURITY DEFINER)
my_aluno_id()         -- Current user's aluno.id (SECURITY DEFINER)
calcular_frequencia() -- Attendance % calculation
```

---

## 4. Environment Setup

```bash
# .env.local (development)
VITE_SUPABASE_URL=https://yrfdxocwhztokadzxtto.supabase.co
VITE_SUPABASE_ANON=<anon-key>
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Vercel (production only)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_KEY=<service-role-key>
```

---

## 5. Known Issues / Gotchas

### GPS Check-in Silently Fails
The `presencas` INSERT RLS policy doesn't include alunos. Apply BLOCK-3 fix before testing check-in as aluno.

### Kids Belts Fail at DB Level
`belt_type` enum only has 9 values; TypeScript type has 21. Apply BLOCK-4 fix before graduating kids.

### `supabase.ts` vs `supabaseClient.ts`
Only import from `supabaseClient.ts`. The `supabase.ts` file is legacy and should be removed.

### Demo Mode
If `VITE_SUPABASE_URL` is empty or not a valid Supabase URL, `isConfigured = false` and the app uses `mockData.ts`. This happens automatically — no code changes needed.

### Rules of Hooks
All `useEffect` calls must be declared before any early `return` in a component. The back-button effect in `App.tsx` was a recent fix for this (see `// Must be declared before any conditional returns`).

### Enrollment Race Condition (App.tsx)
The `registering` state flag prevents `FluxoMatricula` from unmounting mid-enrollment when `onAuthStateChange` fires. Do not move the `if (!user)` check before this guard.

---

## 6. Deployment

```bash
# TypeScript check
npm run typecheck

# Build
npm run build

# Push to main → Vercel auto-deploys
git push origin main

# Edge Functions
supabase functions deploy send-email
supabase functions deploy invite-staff
```

---

## 7. Supabase CLI Commands

```bash
# Link project
supabase link --project-ref yrfdxocwhztokadzxtto

# Generate TypeScript types
supabase gen types typescript --project-id yrfdxocwhztokadzxtto > src/types/supabase.ts

# Apply migration
supabase db push

# Dump current schema
supabase db dump > supabase/schema-backup.sql

# Deploy function
supabase functions deploy <function-name>

# View function logs
supabase functions logs <function-name>

# Set function secret
supabase secrets set MY_SECRET=value
```

---

## 8. Common Supabase Errors

| Error | Cause | Fix |
|---|---|---|
| `violates row-level security` | RLS blocks the operation | Check RLS policies for the table |
| `duplicate key value violates unique constraint` | Already exists | Use upsert or check first |
| `invalid input value for enum "belt_type"` | Kids belt not in enum | Apply BLOCK-4 SQL migration |
| `profile self-create failed` | INSERT policy missing | Apply `supabase/patches/02_profile_self_create.sql` |
| `JWT expired` | Token expired | supabase-js auto-refreshes; if persisting, logout/login |

---

## 9. Testing

Currently no tests exist. See `documentation/13-Test-Strategy.md` for the complete test plan and implementation guide.

```bash
# After setting up tests:
npm run test           # Watch mode
npm run test -- --run  # CI single run
npm run test:e2e       # Playwright E2E
npm run coverage       # Coverage report
```

---

## 10. Architecture Decision Records

### ADR-001: Inline Styles Over CSS Framework

**Decision:** Use inline React styles throughout.  
**Context:** Rapid prototyping phase; no design system requirement.  
**Consequence:** Fast development, poor maintainability at scale. Migration to CSS modules planned for v2.

### ADR-002: auth_role() SECURITY DEFINER

**Decision:** Use a SECURITY DEFINER PostgreSQL function to check roles in RLS policies.  
**Context:** Direct `profiles` query in RLS would cause infinite recursion.  
**Consequence:** Correct and secure. All RLS policies must use `auth_role()` instead of querying profiles directly.

### ADR-003: History API for PWA Navigation

**Decision:** Use `history.pushState/replaceState` instead of URL routing for navigation.  
**Context:** SPA with no URL changes; mobile back button must navigate within app, not close it.  
**Consequence:** Custom history management required. `popstate` listener in `App.tsx` handles back navigation.

### ADR-004: Resend API Over SMTP

**Decision:** Prefer Resend API (`re_` key) over SMTP in `send-email` Edge Function.  
**Context:** Gmail/standard SMTP blocked by SPF/DKIM for gbbraga.com domain.  
**Consequence:** Resend handles DKIM automatically for verified domains. SMTP path retained as fallback.

### ADR-005: Module States in configuracoes Table

**Decision:** Store module enable/disable states as JSONB in existing `configuracoes` table.  
**Context:** Avoid creating a dedicated `modules` table for a simple key-value store.  
**Consequence:** Simpler schema; Realtime subscription on single table row. Works correctly.
