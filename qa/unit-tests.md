# Unit Tests

**GB Braga Platform — Unit Test Specifications**

See `documentation/13-Test-Strategy.md` for the full test implementation guide.

---

## Test Inventory

### `src/lib/gbBrand.ts`
- [x] All adult belts have beltConfig entries
- [x] All GB Kids belts have beltConfig entries (15 variants)
- [x] Cinza belt is neutral gray (#888888), not blue
- [x] Bicolor belts use CSS linear-gradient
- [x] Preta/Vermelha use correct colors
- [x] All entries have required fields: bg, text, label

### Authorization (`src/App.tsx` — extracted util)
- [x] Superadmin can access all pages
- [x] Aluno cannot access admin pages
- [x] Aluno can access student pages
- [x] Professor cannot access financial pages
- [x] Atendimento cannot access config
- [x] Unknown page returns false
- [x] Core modules are always active regardless of modulos state

### `src/lib/useModulos.tsx`
- [x] MODULE_CATALOGUE has 17 modules (11 staff + 6 aluno)
- [x] All modules have required fields
- [x] CORE_MODULE_IDS contains expected IDs
- [x] isActive returns true for core modules even if set to false
- [x] isActive returns true for unknown modules (default active)
- [x] toggle does not affect core modules

### GPS / Haversine (`src/lib/geo.ts` — to be extracted)
- [x] haversineM returns 0 for identical coordinates
- [x] haversineM correctly calculates Braga to Porto (~50km)
- [x] GPS fence: 50m threshold correctly applied
- [x] Handles edge cases: 0 coordinates, antipodal points

### `src/lib/auth.tsx`
- [x] mapProfile correctly maps all DB fields
- [x] mapProfile defaults role to 'aluno'
- [x] Demo mode (isConfigured=false) uses mockUsers
- [x] pendingPasswordSetup correctly set on PASSWORD_RECOVERY event

### Data Validation
- [x] Email format validation (to be implemented)
- [x] GPS coordinate range validation (to be implemented)
- [x] Password minimum length enforcement
- [x] Grau range 0-4 enforcement

---

## Setup

```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to vite.config.ts
export default defineConfig({
  plugins: [...],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  }
});

# Create test setup file
# src/test-setup.ts
import '@testing-library/jest-dom';
```

---

## Run Commands

```bash
npm run test           # Watch mode
npm run test -- --run  # Single run (CI)
npm run coverage       # With coverage report
```

---

## Coverage Targets

| Module | Target |
|---|---|
| gbBrand.ts | 100% |
| useModulos.tsx | 90% |
| Authorization logic | 100% |
| haversineM utility | 100% |
| auth.tsx mapProfile | 90% |
