# Integration Tests

**GB Braga Platform — Integration Test Plan**

---

## Overview

Integration tests validate that the frontend correctly communicates with Supabase and that RLS policies enforce the expected access control. These tests require a dedicated **test Supabase project** (separate from production).

---

## Setup

```bash
# Create test project at supabase.com
# Apply schema to test project
supabase link --project-ref <test-project-id>
supabase db push

# .env.test
VITE_SUPABASE_URL_TEST=https://<test-project>.supabase.co
VITE_SUPABASE_ANON_TEST=<test-anon-key>
SUPABASE_SERVICE_TEST=<test-service-key>
TEST_ADMIN_EMAIL=admin@test.gbbraga.com
TEST_ADMIN_PASSWORD=test-admin-pass-123
TEST_ALUNO_EMAIL=aluno@test.gbbraga.com
TEST_ALUNO_PASSWORD=test-aluno-pass-123
TEST_SUPERADMIN_EMAIL=super@test.gbbraga.com
TEST_SUPERADMIN_PASSWORD=test-super-pass-123
```

---

## Test Scenarios

### 1. Authentication Integration

**1.1 New user registration creates profile automatically**
- Register via `supabase.auth.signUp()`
- Wait 1s for trigger
- Query `profiles` table
- Assert: profile exists with role='aluno'

**1.2 Login returns correct profile**
- `supabase.auth.signInWithPassword()`
- Query profile
- Assert: nome, email, role match expected

**1.3 Staff invite flow**
- Call `invite-staff` Edge Function as admin
- Assert: HTTP 200 + userId returned
- Assert: profile created with staff role

---

### 2. RLS Policy Integration

**2.1 Aluno can only see own data**
- Login as aluno A
- Query `alunos` table
- Assert: Only own record returned

**2.2 Admin can see all alunos**
- Login as admin
- Query `alunos` table
- Assert: Multiple records returned

**2.3 Aluno cannot read other aluno's pagamentos**
- Login as aluno A
- Query `pagamentos?aluno_id=eq.{aluno_B_id}`
- Assert: Empty array (RLS blocks)

**2.4 Aluno can insert own presença (after BLOCK-3 fix)**
- Login as aluno
- Insert to `presencas` with own `aluno_id`
- Assert: Insert succeeds

**2.5 Aluno cannot insert other's presença**
- Login as aluno A
- Insert presença with aluno_B's `aluno_id`
- Assert: RLS error (42501)

**2.6 Admin cannot write to configuracoes (after RLS fix)**
- Login as admin (not superadmin)
- Insert to `configuracoes`
- Assert: RLS error

---

### 3. Data Integrity

**3.1 Duplicate email rejected**
- Insert aluno with existing email
- Assert: 23505 unique constraint error

**3.2 Invalid belt value rejected**
- Insert aluno with `faixa='invalid'`
- Assert: Enum constraint error

**3.3 Grau range constraint**
- Insert aluno with `grau=5`
- Assert: CHECK constraint error

---

### 4. Module System Integration

**4.1 Toggle persists to DB**
- Login as superadmin
- Upsert `configuracoes` with `{ secao: 'modulos', dados: { checkin: false }}`
- Read back
- Assert: `dados.checkin === false`

**4.2 Realtime propagation**
- Open WebSocket subscription
- Update configuracoes
- Assert: Realtime event received within 2s

---

### 5. Edge Function Integration

**5.1 send-email with Resend**
- Set Resend key in configuracoes
- Call send-email Edge Function
- Assert: HTTP 200
- Assert: No error in response

**5.2 send-email saves to mensagens**
- After send-email call
- Query mensagens table
- Assert: Record exists with correct assunto and para_id

---

## Running Integration Tests

```bash
# Requires test env setup
npm run test:integration

# Or with vitest directly
vitest run src/__tests__/integration/
```

---

## Cleanup Strategy

Each integration test should clean up after itself:
```typescript
afterEach(async () => {
  // Delete test data created in this test
  await serviceClient.from('alunos').delete().eq('email', TEST_EMAIL);
  await serviceClient.auth.admin.deleteUser(userId);
});
```

Use `SUPABASE_SERVICE_KEY` (service role) for cleanup operations to bypass RLS.
