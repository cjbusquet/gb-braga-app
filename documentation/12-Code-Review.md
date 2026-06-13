# 12 — Code Review

**Gracie Barra Braga — Complete Code Analysis**  
Date: 2026-06-13

---

## 1. Overview

This review covers all source files in `src/`, `api/`, and `supabase/functions/`. Issues are classified by severity: Critical / High / Medium / Low.

---

## 2. Critical Issues

### CR-001 — Duplicate `src/src/` Directory

**Severity:** Critical  
**File:** `src/src/` (entire directory)

The directory `src/src/` contains an old copy of the entire source tree. It is NOT imported anywhere in the active application but bloats the repository by ~100% and will confuse developers.

**Fix:**
```bash
rm -rf src/src/
```
Verify build still passes: `npm run build`

---

### CR-002 — `belt_type` Enum Out of Sync with TypeScript Type

**Severity:** Critical  
**Files:** `supabase/schema.sql`, `src/types/index.ts`

The TypeScript `Belt` type includes 15 kids variants (`cinza-branca`, `cinza-preta`, etc.) that are not in the `belt_type` PostgreSQL enum. Attempting to store a kids intermediate belt in `alunos.faixa` will fail with a type error at the DB level.

**Fix:** Apply a migration:
```sql
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-preta';
```

---

## 3. High Issues

### CR-003 — Two Supabase Client Files

**Severity:** High  
**Files:** `src/lib/supabase.ts`, `src/lib/supabaseClient.ts`

There are two files that initialize/export Supabase clients. `supabaseClient.ts` is the current active client (imported in auth, useData, etc.). `supabase.ts` appears to be an older file with data functions.

**Impact:** Risk of maintaining two separate client instances, cache misalignment, confusion about which to import.

**Fix:** Consolidate — keep `supabaseClient.ts` as the single client source. Verify `supabase.ts` is not imported anywhere active, then remove it.

---

### CR-004 — `usePresencas` Hardcodes Staff-Inserted Check-in

**Severity:** High  
**File:** `src/pages/aluno/MeuCheckin.tsx`

The RLS policy for `presencas` INSERT is:
```sql
CREATE POLICY "Registar presença" ON presencas FOR INSERT
  WITH CHECK (auth_role() IN ('admin','superadmin','professor','atendimento'));
```

This means **alunos cannot insert their own presences**. The GPS check-in page will silently fail for students.

**Fix:** Add an aluno INSERT policy:
```sql
CREATE POLICY "Aluno regista presença própria" ON presencas
  FOR INSERT
  WITH CHECK (aluno_id = my_aluno_id());
```

---

### CR-005 — Missing Error Boundary

**Severity:** High  
**File:** `src/App.tsx`

No React Error Boundary wraps the application. A runtime error in any page component will crash the entire app with a blank white screen.

**Fix:** Add a simple Error Boundary wrapper:
```typescript
class ErrorBoundary extends React.Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <ErrorPage error={this.state.error} />;
    return this.props.children;
  }
}
```

---

## 4. Medium Issues

### CR-006 — Inline Styles Instead of CSS Classes

**Severity:** Medium  
**Files:** Multiple (Layout.tsx, ConfigPage.tsx, PerfilPage.tsx, etc.)

Virtually all styling is done via inline `style={{}}` objects. This:
- Prevents CSS cascade/inheritance
- Cannot be overridden by media queries
- Cannot be cached by the browser
- Makes responsive design harder
- Results in very large component files

**Impact:** Maintainability, performance (minor), responsive design complexity.

**Recommendation:** Migrate gradually to CSS modules or a utility-first approach. Since Tailwind is not used, CSS modules (`*.module.css`) are the pragmatic path. Priority: low for current launch, high for v2.

---

### CR-007 — `useData.ts` Fetches All Records Without Pagination

**Severity:** Medium  
**File:** `src/lib/useData.ts`

`useAlunos()`, `usePagamentos()`, `useGraduacoes()`, and `usePresencas()` fetch all records with no limit/offset. With 500+ students or years of payment history, this will:
- Cause slow initial load
- Increase Supabase bandwidth costs
- Potentially hit client memory limits

**Fix:** Add pagination parameters to each hook:
```typescript
function useAlunos(page = 0, pageSize = 50) {
  // .range(page * pageSize, (page + 1) * pageSize - 1)
}
```

---

### CR-008 — `mockData.ts` Imported in Production Auth

**Severity:** Medium  
**File:** `src/lib/auth.tsx` line 5

`import { mockUsers } from '../data/mockData'` is always imported, even in production. The mock data module (including fake user objects) is included in the production bundle.

**Fix:** Use dynamic import or environment check:
```typescript
const mockUsers = isConfigured ? [] : (await import('../data/mockData')).mockUsers;
```

---

### CR-009 — `supabase.auth.resetPasswordForEmail()` Without Rate Limiting

**Severity:** Medium  
**File:** `src/pages/admin/ConfigPage.tsx`

The password reset button in the staff section calls `resetPasswordForEmail` on every click without debouncing or confirmation. An admin could accidentally trigger multiple reset emails.

**Fix:** Add a cooldown state:
```typescript
const [resetSent, setResetSent] = useState(false);
// After send: setResetSent(true); setTimeout(() => setResetSent(false), 30000);
```

---

### CR-010 — GPS Coordinates Stored as String, Parsed Inline

**Severity:** Medium  
**Files:** `src/pages/aluno/MeuCheckin.tsx`, `src/pages/admin/ConfigPage.tsx`

GPS lat/lng is stored in `configuracoes.dados` as strings and parsed with `parseFloat()` inline. There's no validation that the stored values are valid numbers, and `parseFloat('')` returns `NaN` silently.

**Fix:** Validate on save (SEC-011) and add null checks on read:
```typescript
const lat = parseFloat(dados?.['GPS Latitude'] ?? '');
if (isNaN(lat)) return showError('GPS não configurado');
```

---

### CR-011 — `any` Types in Multiple Files

**Severity:** Medium  
**Files:** `src/lib/auth.tsx`, `src/lib/useData.ts`, `src/lib/useModulos.tsx`

Multiple `any` casts (`data: any`, `payload.new as any`) bypass TypeScript's type system. This risks runtime crashes when Supabase response shape changes.

**Fix:** Generate Supabase types and use them:
```bash
npx supabase gen types typescript --project-id yrfdxocwhztokadzxtto > src/types/supabase.ts
```

---

## 5. Low Issues

### CR-012 — Console Logs in Production Code

**Severity:** Low  
**Files:** `src/lib/auth.tsx` (lines 69, 70), multiple pages

`console.warn` and `console.error` calls remain in production code, potentially exposing internal details.

**Fix:** Replace with a logger utility that only logs in development:
```typescript
const log = import.meta.env.DEV ? console.log : () => {};
```

---

### CR-013 — `handleNavigate` Guards Only `canAccess`, Not `canAccessModule`

**Severity:** Low  
**File:** `src/App.tsx` lines 204-209

`handleNavigate` checks `canAccess(user.role, p)` but not `canAccessModule`. The module check is only applied at the `safePage` level. This means a disabled module's page can be "navigated to" (state updated) but then immediately redirected. Minor UX issue.

**Fix:** Add module check to `handleNavigate`:
```typescript
const handleNavigate = (p: string) => {
  if (canAccess(user.role, p) && canAccessModule(p, isActive)) {
    history.pushState({ page: p }, '', location.pathname + location.search);
    setCurrentPage(p);
  }
};
```

---

### CR-014 — `calcular_frequencia` PostgreSQL Function Has a Logic Bug

**Severity:** Low  
**File:** `supabase/schema.sql` lines 375-387

The frequency calculation counts `total_aulas` as distinct dates across ALL alunos, then divides individual attendance by that total. If a student misses a class that was only attended by one other person, it still reduces their percentage. This might be intentional (measuring class-level attendance) but is counterintuitive.

**Clarify intent:** If the goal is "% of available classes attended by this student," the function is correct. If it's "% of classes student could have attended," use turma enrollment data as the denominator.

---

### CR-015 — `vercel.json` Missing `Cache-Control` for Static Assets

**Severity:** Low  
**File:** `vercel.json`

Static assets (JS/CSS with hashed filenames) should have long cache TTLs. Vercel provides defaults, but explicit configuration ensures consistent behavior.

**Fix:**
```json
{
  "source": "/_next/static/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

---

### CR-016 — `FluxoMatricula` Double-Renders During Enrollment

**Severity:** Low  
**File:** `src/App.tsx` lines 179-190

`FluxoMatricula` with `registerMode` is mounted while `registering=true`. On completion, `refreshProfile()` is called and then `registering=false` clears the component. If `refreshProfile` is slow, there could be a flash of the login page. The comment in the code acknowledges this (`if we checked !user first...`).

**Current workaround is correct.** Document this behavior to prevent future regressions.

---

## 6. Code Quality Metrics

| Metric | Assessment |
|---|---|
| TypeScript coverage | ~70% (many `any` types) |
| Component complexity | High (large monolithic components) |
| Code duplication | Moderate (belt config in multiple places) |
| Test coverage | 0% (no tests exist) |
| Comment quality | Good (key decisions documented) |
| Naming conventions | Consistent (camelCase, Portuguese domain terms) |
| Error handling | Partial (happy paths covered, edge cases missing) |
| Accessibility | Not evaluated (no ARIA attributes found) |

---

## 7. Refactoring Recommendations

### Priority 1 (Pre-launch)
1. Fix CR-001: Remove `src/src/` duplicate
2. Fix CR-002: Expand `belt_type` enum
3. Fix CR-004: Add aluno INSERT policy for presencas

### Priority 2 (v1.1)
4. Fix CR-003: Remove `supabase.ts` legacy file
5. Fix CR-005: Add Error Boundary
6. Fix CR-007: Add pagination to data hooks
7. Fix CR-011: Generate and use Supabase types

### Priority 3 (v2)
8. CR-006: Migrate inline styles to CSS modules
9. CR-008: Dynamic import of mockData
