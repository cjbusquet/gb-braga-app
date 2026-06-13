# Code Quality Report

**GB Braga Platform — Code Quality Assessment**  
Date: 2026-06-13

---

## Summary

| Metric | Score | Notes |
|---|---|---|
| TypeScript Coverage | 70% | Many `any` casts in data hooks |
| Code Duplication | Medium | Belt config repeated; haversine duplicated |
| Complexity | Medium | Large monolithic page components |
| Maintainability | 6/10 | Inline styles make changes hard |
| Error Handling | 7/10 | Happy paths covered, edge cases partial |
| Naming | 9/10 | Consistent, clear, domain-appropriate |
| Comments | 7/10 | Key decisions documented |
| Dead Code | Low | src/src/ is the main offender |

---

## File-by-File Review

### `src/App.tsx` — GOOD
- Clean role-based routing
- Correct Rules of Hooks compliance (back button effect before conditionals)
- `safePage` redirect correctly prevents URL manipulation
- Issue: `handleNavigate` doesn't check `canAccessModule`

### `src/lib/auth.tsx` — GOOD
- Clean AuthContext pattern
- Correct handling of PASSWORD_RECOVERY event
- Profile self-create fallback is safe (ignoreDuplicates)
- Issue: `any` type in `mapProfile(data: any)`, `mockUsers` always imported

### `src/lib/useData.ts` — ADEQUATE
- Consistent hook pattern
- All hooks return `{ data, loading, refetch }`
- Issue: No pagination, many `any` types, some functions very long

### `src/lib/useModulos.tsx` — EXCELLENT
- Well-structured context with Realtime
- Correct optimistic update with revert on error
- Good use of `useCallback` and `useMemo` patterns
- `isActive()` defaulting to true for unknown IDs is correct

### `src/lib/gbBrand.ts` — GOOD
- Single source of truth for belt colors
- All kids variants covered
- Clean color values

### `src/components/layout/Layout.tsx` — ADEQUATE
- Complex but functional
- Both mobile and desktop handled in one file
- Issue: All inline styles, large file, hard to maintain

### `src/pages/admin/ConfigPage.tsx` — ADEQUATE
- Multiple responsibilities in one file (GPS, SMTP, staff, planos)
- Consider splitting into separate tab components
- `haversineM` utility duplicated from MeuCheckin.tsx

### `src/pages/admin/TurmasPage.tsx` — GOOD
- Well-structured calendar view
- Good use of `useMemo` for schedule map
- Clean component decomposition (TurmaBlock, Legend, CalendarView)

### `src/pages/aluno/MeuCheckin.tsx` — GOOD
- GPS fence logic clear and correct
- Haversine formula correctly implemented
- Issue: INSERT policy missing (CRIT-3) — will fail silently

### `src/pages/admin/ComunicacaoPage.tsx` — GOOD
- Template CRUD well implemented
- History stored in DB after send
- Clean tab navigation

### `supabase/schema.sql` — VERY GOOD
- Comprehensive schema with all necessary tables
- RLS on most tables with clear policies
- `auth_role()` SECURITY DEFINER is the correct pattern
- v_kpis view is useful
- Issue: turmas and configuracoes missing RLS

---

## Code Duplication

### `haversineM` Function — Duplicated

Present in both `MeuCheckin.tsx` and `ConfigPage.tsx`. Extract to shared utility:

```typescript
// src/lib/geo.ts
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### Belt Config — Partially Duplicated

`beltConfig` is defined in `gbBrand.ts` and also partially referenced inline in some components. Always import from `gbBrand.ts`.

### Style Constants — Not Shared

The brand colors `#C8102E`, `#F7F6F4`, `#E2E0DB` appear as literals throughout all page files. They should always be imported from `gbBrand.ts`:

```typescript
// src/lib/gbBrand.ts — add exports
export const GB_RED = '#C8102E';
export const GB_CREAM = '#F7F6F4';
export const GB_BORDER = '#E2E0DB';
export const GB_BLACK = '#111111';
```

---

## Maintainability Issues

### Large Inline Style Objects

Example from ConfigPage (representative pattern found throughout):
```typescript
<div style={{ 
  background: '#fff', borderRadius: 12, padding: 24, 
  marginBottom: 20, border: '1px solid #E2E0DB',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
}}>
```

This pattern appears hundreds of times. Each new feature requires copy-pasting and modifying inline styles. A CSS module system would make this maintainable:

```css
/* ConfigPage.module.css */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #E2E0DB;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
```

### Component File Size

| File | Lines | Assessment |
|---|---|---|
| ConfigPage.tsx | ~800 | Too large — split into tab components |
| TurmasPage.tsx | ~500 | Acceptable — well structured |
| Layout.tsx | ~450 | Acceptable — split mobile/desktop |
| AlunosPage.tsx | ~600 | Consider splitting list/detail |
| ComunicacaoPage.tsx | ~500 | Acceptable |

---

## Type Safety Issues

### `any` Types Found

```typescript
// auth.tsx
const mapProfile = (data: any, email: string): User => ...

// useData.ts  
.then(({ data }: { data: any }) => ...)

// useModulos.tsx
const dados = (payload.new as any)?.dados;
```

**Recommendation:** Generate Supabase types (`npx supabase gen types typescript`) and replace all `any` with generated types. This will catch schema changes at compile time.

---

## ESLint Configuration

The ESLint config (`eslint.config.js`) uses:
- `@eslint/js` recommended
- `typescript-eslint` recommended  
- `react-hooks` plugin (enforces rules of hooks)
- `react-refresh` plugin

**Recommendation:** Add these rules:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'error',
  'no-console': ['warn', { allow: ['error', 'warn'] }],
}
```

---

## Positive Highlights

1. **Rules of Hooks compliance** — The back button `useEffect` is correctly placed before conditional returns, with a clear comment explaining why.

2. **Optimistic updates in useModulos** — Toggle updates state immediately, then persists to DB, with revert on error. This is the correct UX pattern.

3. **SECURITY DEFINER helper** — Using `auth_role()` as a SECURITY DEFINER function to read profiles without recursive RLS evaluation is the correct Supabase pattern.

4. **PWA cache strategies** — Three different strategies (NetworkFirst, CacheFirst, StaleWhileRevalidate) applied correctly to different resource types.

5. **Enrollment flow isolation** — The `registering` state flag keeps `FluxoMatricula` mounted through the auth state change, preventing a race condition mid-enrollment. Well thought out.

6. **`safePage` redirect** — Role check on render (not just on navigation) prevents URL manipulation or stale state from showing unauthorized pages.
