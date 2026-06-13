# Coverage Report

**GB Braga Platform — Test Coverage Status**  
Date: 2026-06-13

---

## Current State

**Overall coverage: 0%** (no tests exist)

---

## Target Coverage by Module

| Module | Lines | Target | Priority |
|---|---|---|---|
| `src/lib/gbBrand.ts` | ~80 | 100% | High |
| `src/lib/useModulos.tsx` | ~149 | 90% | High |
| `src/lib/auth.tsx` | ~230 | 80% | High |
| `src/App.tsx` (auth logic) | ~50 (extracted) | 100% | High |
| `src/lib/geo.ts` (to extract) | ~15 | 100% | High |
| `src/lib/useData.ts` | ~400 | 70% | Medium |
| `src/pages/aluno/MeuCheckin.tsx` | ~200 | 60% | Medium |
| `src/pages/admin/TurmasPage.tsx` | ~500 | 50% | Low |
| `src/pages/admin/ConfigPage.tsx` | ~800 | 40% | Low |
| Other pages | ~3000 | 30% | Low |
| **Total** | **~5500** | **50%** | |

---

## Coverage Gaps (Critical Business Logic)

### 1. Authorization Logic (0% coverage — CRITICAL)
The `PAGE_ROLES` map and `canAccess()` function control all access control decisions. **Must be tested.**

### 2. GPS Fence Calculation (0% coverage — CRITICAL)
The haversine formula determines whether a student can check in. A bug here could allow check-ins from anywhere. **Must be tested.**

### 3. Module System (0% coverage — HIGH)
The `isActive()` logic determines what users can see. A bug could expose or hide modules incorrectly. **Must be tested.**

### 4. Belt Configuration (0% coverage — MEDIUM)
UI relies on `beltConfig` for correct color display. Kids belt variants are recently added and untested.

---

## Path to 50% Coverage (v1.1 Goal)

### Week 1: Foundation (0% → 20%)
- [ ] Set up Vitest + Testing Library
- [ ] Test `gbBrand.ts` (100%)
- [ ] Test authorization logic (100%)
- [ ] Test `haversineM` utility (100%)
- [ ] Test MODULE_CATALOGUE structure

### Week 2: Core Logic (20% → 35%)
- [ ] Test `useModulos` context
- [ ] Test `auth.tsx` mapProfile
- [ ] Test `useData.ts` hooks (mocked Supabase)
- [ ] Test `FluxoMatricula` form validation

### Week 3: E2E Critical Paths (35% → 50%)
- [ ] E2E: Student enrollment
- [ ] E2E: GPS check-in (inside + outside fence)
- [ ] E2E: Admin login and navigation
- [ ] E2E: Module toggle propagation

---

## Coverage Configuration

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'src/data/mockData.ts',  // Mock data, not business logic
        'src/src/**',             // Duplicate directory
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 60,
        branches: 45,
      }
    }
  }
});
```

---

## CI Coverage Gate

```yaml
# .github/workflows/ci.yml
- name: Test with coverage
  run: npm run coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    fail_ci_if_error: true
    minimum_coverage: 50
```
