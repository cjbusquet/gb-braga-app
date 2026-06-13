# 13 — Test Strategy

**Gracie Barra Braga — Testing Plan**

---

## 1. Current State

**Test coverage: 0%** — No test files exist in the project. This is the baseline from which we establish a comprehensive testing strategy.

---

## 2. Recommended Test Stack

| Layer | Tool | Rationale |
|---|---|---|
| Unit Tests | Vitest | Native Vite integration, no config needed |
| Component Tests | @testing-library/react | Industry standard for React |
| E2E Tests | Playwright | Cross-browser, PWA support |
| API/Edge Function Tests | Deno test (built-in) | Native Deno testing |
| Type Checking | tsc --noEmit | Already in package.json scripts |

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "coverage": "vitest run --coverage"
  }
}
```

---

## 3. Unit Tests

### 3.1 Belt Configuration (`src/lib/gbBrand.ts`)

```typescript
// src/lib/__tests__/gbBrand.test.ts
import { describe, it, expect } from 'vitest';
import { beltConfig } from '../gbBrand';

describe('beltConfig', () => {
  it('has config for all adult belts', () => {
    const adult = ['branca', 'azul', 'roxa', 'marrom', 'preta'];
    adult.forEach(b => {
      expect(beltConfig[b]).toBeDefined();
      expect(beltConfig[b].label).toBeTruthy();
      expect(beltConfig[b].bg).toBeTruthy();
    });
  });

  it('has config for all GB Kids belts', () => {
    const kids = [
      'cinza-branca', 'cinza', 'cinza-preta',
      'amarela-branca', 'amarela', 'amarela-preta',
      'laranja-branca', 'laranja', 'laranja-preta',
      'verde-branca', 'verde', 'verde-preta',
    ];
    kids.forEach(b => {
      expect(beltConfig[b]).toBeDefined();
    });
  });

  it('cinza belt is neutral gray, not blue', () => {
    expect(beltConfig['cinza'].bg).not.toContain('6B7280');
    expect(beltConfig['cinza'].bg).toContain('888888');
  });

  it('bicolor belts use gradient', () => {
    expect(beltConfig['cinza-branca'].bg).toContain('linear-gradient');
    expect(beltConfig['amarela-preta'].bg).toContain('linear-gradient');
  });
});
```

---

### 3.2 GPS / Haversine Distance

```typescript
// src/lib/__tests__/haversine.test.ts
import { describe, it, expect } from 'vitest';
import { haversineM } from '../haversine'; // Extract to shared util

describe('haversineM', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineM(41.5454, -8.4265, 41.5454, -8.4265)).toBe(0);
  });

  it('calculates Braga to Porto correctly (~50km)', () => {
    const dist = haversineM(41.5454, -8.4265, 41.1579, -8.6291);
    expect(dist).toBeGreaterThan(48000);
    expect(dist).toBeLessThan(55000);
  });

  it('GPS fence: 50m threshold', () => {
    // Academy: 41.5454, -8.4265
    const insideLat = 41.5455; // ~11m away
    const outsideLat = 41.5468; // ~155m away
    expect(haversineM(41.5454, -8.4265, insideLat, -8.4265)).toBeLessThan(50);
    expect(haversineM(41.5454, -8.4265, outsideLat, -8.4265)).toBeGreaterThan(50);
  });
});
```

---

### 3.3 Module System (`src/lib/useModulos.tsx`)

```typescript
// src/lib/__tests__/useModulos.test.ts
import { describe, it, expect } from 'vitest';
import { CORE_MODULE_IDS, MODULE_CATALOGUE } from '../useModulos';

describe('MODULE_CATALOGUE', () => {
  it('has 17 modules (11 staff + 6 aluno)', () => {
    const staff = MODULE_CATALOGUE.filter(m => m.category === 'staff');
    const aluno = MODULE_CATALOGUE.filter(m => m.category === 'aluno');
    expect(staff).toHaveLength(11);
    expect(aluno).toHaveLength(6);
  });

  it('all modules have required fields', () => {
    MODULE_CATALOGUE.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.icon).toBeTruthy();
      expect(m.category).toMatch(/^(staff|aluno)$/);
    });
  });

  it('core modules cannot be in catalogue as core=true for non-core', () => {
    MODULE_CATALOGUE.forEach(m => {
      if (CORE_MODULE_IDS.has(m.id)) {
        expect(m.core).toBe(true);
      }
    });
  });
});

describe('CORE_MODULE_IDS', () => {
  it('contains expected core IDs', () => {
    ['dashboard', 'alunos', 'portal', 'config', 'perfil'].forEach(id => {
      expect(CORE_MODULE_IDS.has(id)).toBe(true);
    });
  });
});
```

---

### 3.4 Authorization (`src/App.tsx`)

```typescript
// src/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest';
// Extract PAGE_ROLES and canAccess to a separate util file for testability

const PAGE_ROLES = {
  dashboard: ['superadmin','admin','atendimento','professor'],
  alunos: ['superadmin','admin','atendimento','professor'],
  modulos: ['superadmin'],
  portal: ['aluno'],
  'meu-checkin': ['aluno'],
  config: ['superadmin','admin'],
  numerario: ['superadmin'],
  financeiro: ['superadmin','admin'],
};

function canAccess(role: string, page: string): boolean {
  return (PAGE_ROLES[page] ?? []).includes(role);
}

describe('canAccess', () => {
  it('superadmin can access all pages', () => {
    Object.keys(PAGE_ROLES).forEach(page => {
      expect(canAccess('superadmin', page)).toBe(true);
    });
  });

  it('aluno cannot access admin pages', () => {
    ['dashboard', 'alunos', 'financeiro', 'config', 'modulos'].forEach(page => {
      expect(canAccess('aluno', page)).toBe(false);
    });
  });

  it('aluno can access student pages', () => {
    ['portal', 'meu-checkin'].forEach(page => {
      expect(canAccess('aluno', page)).toBe(true);
    });
  });

  it('professor cannot access financial pages', () => {
    expect(canAccess('professor', 'financeiro')).toBe(false);
    expect(canAccess('professor', 'numerario')).toBe(false);
  });

  it('atendimento cannot access config', () => {
    expect(canAccess('atendimento', 'config')).toBe(false);
  });

  it('returns false for unknown pages', () => {
    expect(canAccess('superadmin', 'unknown-page')).toBe(false);
  });
});
```

---

## 4. Component Tests

### 4.1 LoginPage

```typescript
// src/pages/__tests__/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../LoginPage';

const mockLogin = vi.fn();
vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ login: mockLogin, loading: false })
}));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage onRegister={() => {}} />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    mockLogin.mockResolvedValue(false);
    render(<LoginPage onRegister={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText(/entrar/i));
    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('calls login with correct credentials', async () => {
    mockLogin.mockResolvedValue(true);
    render(<LoginPage onRegister={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'admin@gbbraga.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByText(/entrar/i));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@gbbraga.com', 'correct-password');
    });
  });
});
```

---

### 4.2 Belt Display

```typescript
// src/components/__tests__/BeltBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { beltConfig } from '../../lib/gbBrand';

function BeltBadge({ belt }: { belt: string }) {
  const cfg = beltConfig[belt] ?? { bg: '#ccc', text: '#000', label: belt };
  return <span style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>;
}

describe('BeltBadge', () => {
  it('renders branca belt with correct label', () => {
    render(<BeltBadge belt="branca" />);
    expect(screen.getByText('Branca')).toBeInTheDocument();
  });

  it('renders cinza-branca bicolor belt', () => {
    render(<BeltBadge belt="cinza-branca" />);
    expect(screen.getByText('Cinza/Branca')).toBeInTheDocument();
  });
});
```

---

## 5. Integration Tests

### 5.1 Authentication Flow

```typescript
// src/__tests__/integration/auth.integration.test.ts
// Requires a test Supabase project or mocked Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL_TEST!,
  process.env.VITE_SUPABASE_ANON_TEST!
);

describe('Authentication Integration', () => {
  it('creates profile on user registration', async () => {
    const email = `test-${Date.now()}@gbbraga.com`;
    const { data: { user } } = await supabase.auth.signUp({
      email, password: 'testpass123'
    });
    expect(user).toBeTruthy();

    // Wait for trigger
    await new Promise(r => setTimeout(r, 1000));

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();

    expect(profile).toBeTruthy();
    expect(profile.role).toBe('aluno');
    expect(profile.email).toBe(email);

    // Cleanup
    await supabase.auth.signOut();
  });
});
```

---

### 5.2 Module Toggle

```typescript
// src/__tests__/integration/modulos.integration.test.ts

describe('Module Toggle Integration', () => {
  it('toggling module persists to DB', async () => {
    // Login as superadmin
    await supabase.auth.signInWithPassword({
      email: process.env.TEST_SUPERADMIN_EMAIL!,
      password: process.env.TEST_SUPERADMIN_PASSWORD!
    });

    // Disable checkin module
    await supabase.from('configuracoes').upsert({
      secao: 'modulos',
      dados: { checkin: false }
    }, { onConflict: 'secao' });

    // Read back
    const { data } = await supabase
      .from('configuracoes')
      .select('dados')
      .eq('secao', 'modulos')
      .single();

    expect(data.dados.checkin).toBe(false);

    // Re-enable
    await supabase.from('configuracoes').upsert({
      secao: 'modulos',
      dados: { checkin: true }
    }, { onConflict: 'secao' });
  });
});
```

---

## 6. End-to-End Tests

### 6.1 Student Enrollment E2E

```typescript
// e2e/enrollment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Student Enrollment', () => {
  test('complete enrollment flow', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Navigate to register
    await page.click('text=Registar');
    
    // Fill personal data
    await page.fill('[placeholder*="Nome"]', 'Test Student');
    await page.fill('[placeholder*="Email"]', 'test@example.com');
    await page.fill('[placeholder*="Password"]', 'testpass123');
    await page.click('text=Continuar');
    
    // Select plan
    await page.click('text=Adulto Plus');
    await page.click('text=Continuar');
    
    // Sign contract
    await page.locator('canvas').click({ position: { x: 100, y: 50 } });
    await page.click('text=Aceitar e Finalizar');
    
    // Verify portal loads
    await expect(page.locator('text=Bem-vindo')).toBeVisible();
  });
});
```

---

### 6.2 Admin Check-in E2E

```typescript
// e2e/checkin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('[placeholder*="Email"]', process.env.TEST_ADMIN_EMAIL!);
    await page.fill('[placeholder*="Password"]', process.env.TEST_ADMIN_PASSWORD!);
    await page.click('text=Entrar');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('navigate to check-in and record attendance', async ({ page }) => {
    await page.click('text=Check-in');
    await expect(page.locator('h1, h2').filter({ hasText: 'Check-in' })).toBeVisible();
    
    // Search for student
    await page.fill('[placeholder*="pesquisar"]', 'Test');
    await expect(page.locator('.student-row').first()).toBeVisible();
    
    // Record check-in
    await page.click('.student-row:first-child button:has-text("Check-in")');
    await expect(page.locator('text=Presença registada')).toBeVisible();
  });
});
```

---

### 6.3 GPS Check-in E2E

```typescript
// e2e/gps-checkin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('GPS Check-in', () => {
  test('check-in inside GPS fence', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ 
      latitude: 41.5454,  // Academy coordinates
      longitude: -8.4265 
    });

    // Login as aluno
    await page.goto('http://localhost:5173');
    await page.fill('[placeholder*="Email"]', process.env.TEST_ALUNO_EMAIL!);
    await page.fill('[placeholder*="Password"]', process.env.TEST_ALUNO_PASSWORD!);
    await page.click('text=Entrar');

    await page.click('text=Check-in');
    await expect(page.locator('text=✅')).toBeVisible({ timeout: 10000 });
    
    // Record check-in
    await page.click('text=Fazer Check-in');
    await expect(page.locator('text=Check-in registado')).toBeVisible();
  });

  test('shows warning outside GPS fence', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ 
      latitude: 40.0,   // Far away
      longitude: -8.0 
    });

    // Login as aluno and navigate to check-in
    // ... (login steps)
    
    await expect(page.locator('text=📍')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Fora da academia')).toBeVisible();
  });
});
```

---

## 7. Regression Tests

### 7.1 Back Button (PWA History)

```typescript
// e2e/navigation.spec.ts
test('back button navigates within app, not browser', async ({ page }) => {
  // Login as admin
  await page.click('text=Alunos'); // Navigate to Alunos
  await page.click('text=Financeiro'); // Navigate to Financeiro
  
  // Press back
  await page.goBack();
  
  // Should be on Alunos, not on login page
  await expect(page.locator('h1').filter({ hasText: 'Alunos' })).toBeVisible();
  // Should NOT be on login page
  await expect(page.locator('text=Entrar')).not.toBeVisible();
});
```

---

### 7.2 Module Disable Propagation

```typescript
// e2e/modules.spec.ts
test('disabling module hides nav item', async ({ page, context }) => {
  // Open two browser contexts (superadmin + admin)
  const adminPage = await context.newPage();
  
  // Login superadmin and disable 'financeiro'
  // ...toggle financeiro off...

  // Check admin page no longer shows Financeiro in nav
  await adminPage.reload();
  await expect(adminPage.locator('nav >> text=Financeiro')).not.toBeVisible();
});
```

---

## 8. Test Coverage Targets

| Area | Target Coverage | Priority |
|---|---|---|
| Business logic (belt, GPS, auth) | 95% | High |
| Data hooks (useData.ts) | 80% | High |
| Module system (useModulos) | 90% | High |
| Page components | 60% | Medium |
| Edge Functions | 80% | Medium |
| E2E critical paths | 100% of listed scenarios | High |

---

## 9. CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test -- --run
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build && npm run preview &
      - run: npm run test:e2e
```
