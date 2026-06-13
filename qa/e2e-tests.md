# End-to-End Tests

**GB Braga Platform — E2E Test Scenarios**

See `documentation/13-Test-Strategy.md` for full Playwright implementations.

---

## Critical User Journeys

### Journey 1: Student Enrollment (Public)
1. Open app.gbbraga.com
2. Click "Registar"
3. Fill: name, email, password, phone, date of birth
4. Select a plan (e.g., "Adulto Plus €62")
5. Choose payment method (Stripe / Cash)
6. Sign contract on canvas
7. Accept RGPD + image rights
8. Complete enrollment
9. **Expected:** Portal page loads with welcome message

**Playwright file:** `e2e/enrollment.spec.ts`

---

### Journey 2: GPS Check-in (Student)
1. Login as aluno
2. Navigate to Check-in (bottom nav)
3. Grant geolocation permission (mocked to academy coordinates)
4. **Expected:** ✅ badge showing distance < 50m
5. Click "Fazer Check-in"
6. **Expected:** Confirmation + check-in appears in history

**Playwright file:** `e2e/gps-checkin.spec.ts`

---

### Journey 3: Admin — Add Student
1. Login as admin
2. Navigate to Alunos
3. Click "+ Novo Aluno"
4. Fill all fields
5. Save
6. **Expected:** Student appears in list with correct data

**Playwright file:** `e2e/admin-alunos.spec.ts`

---

### Journey 4: Email Communication
1. Login as admin
2. Navigate to Comunicação
3. Select "Todos os alunos ativos"
4. Write subject and message
5. Click "Enviar"
6. **Expected:** "Enviado com sucesso" message
7. Switch to "Histórico" tab
8. **Expected:** Message appears in history

**Playwright file:** `e2e/comunicacao.spec.ts`

---

### Journey 5: Module Toggle (Superadmin)
1. Login as superadmin
2. Navigate to Módulos
3. Toggle "Chat" to off
4. Open new browser tab, login as admin
5. **Expected:** "Chat" not visible in admin sidebar (within 5s — Realtime)
6. Toggle "Chat" back on
7. **Expected:** "Chat" reappears

**Playwright file:** `e2e/modulos.spec.ts`

---

### Journey 6: Belt Graduation
1. Login as professor
2. Navigate to Graduação
3. Select a student
4. Choose new belt (e.g., azul)
5. Confirm
6. **Expected:** Student's belt updated in Alunos list
7. Check Evolução as aluno
8. **Expected:** Graduation appears in history

**Playwright file:** `e2e/graduacao.spec.ts`

---

### Journey 7: Staff Invite
1. Login as admin
2. Config → Equipa → "+ Convidar Staff"
3. Enter email and role
4. Send invite
5. (Mock email) Click invite link
6. **Expected:** SetPasswordScreen shown
7. Set password
8. **Expected:** Dashboard loads with correct role

**Playwright file:** `e2e/staff-invite.spec.ts`

---

### Journey 8: PWA Back Button (Mobile)
1. Login as admin on mobile viewport (375px)
2. Navigate: Dashboard → Alunos → Financeiro
3. Press browser back button
4. **Expected:** Navigate to Alunos (not close app)
5. Press back again
6. **Expected:** Navigate to Dashboard

**Playwright file:** `e2e/navigation.spec.ts`

---

## Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install chromium webkit

# playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
});
```

---

## Run Commands

```bash
npm run test:e2e           # All E2E tests
npm run test:e2e -- --ui   # With Playwright UI
npm run test:e2e -- --debug # Debug mode
npx playwright show-report  # View HTML report
```

---

## E2E Environment Variables

```env
TEST_ADMIN_EMAIL=admin@gbbraga.com
TEST_ADMIN_PASSWORD=test-password
TEST_ALUNO_EMAIL=atleta@gbbraga.com
TEST_ALUNO_PASSWORD=test-password
TEST_SUPERADMIN_EMAIL=super@gbbraga.com
TEST_SUPERADMIN_PASSWORD=test-password
```

Use a dedicated test project in Supabase (separate from production).
