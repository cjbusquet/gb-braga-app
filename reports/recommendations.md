# Recommendations Report

**GB Braga Platform — Implementation Recommendations**  
Date: 2026-06-13

---

## Immediate Actions (This Week)

### 1. Apply Security Fixes (30 minutes)

Apply all 4 critical SQL fixes via Supabase SQL Editor:

```sql
-- Fix 1: turmas RLS
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos veem turmas" ON turmas FOR SELECT USING (TRUE);
CREATE POLICY "Staff gere turmas" ON turmas FOR ALL
  USING (auth_role() IN ('admin','superadmin','atendimento','professor'));

-- Fix 2: configuracoes RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin gere config" ON configuracoes FOR ALL
  USING (auth_role() = 'superadmin');
CREATE POLICY "Admin lê config" ON configuracoes FOR SELECT
  USING (auth_role() IN ('admin','superadmin'));

-- Fix 3: presencas INSERT for alunos
CREATE POLICY "Aluno regista presença própria" ON presencas
  FOR INSERT WITH CHECK (aluno_id = my_aluno_id());

-- Fix 4: belt_type enum expansion
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-preta';
```

### 2. Configure Resend Email

1. Register at resend.com (free tier: 3,000 emails/month)
2. Add domain gbbraga.com → add DNS records
3. Create API key
4. In app: Config → Email → Password field → paste `re_xxx` key

### 3. Configure GPS Fence

1. Go to the academy
2. Admin → Config → Academia → GPS section
3. Click "📍 Capturar localização atual"
4. Set radius to 100m
5. Save

### 4. Remove Duplicate Directory

```bash
cd gb-braga-app
rm -rf src/src/
git add -A
git commit -m "fix: remove duplicate src/src/ directory"
```

---

## Short-term (1 Month)

### 5. Add Security Headers

Add to `vercel.json` headers:
```json
[
  { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.resend.com https://api.stripe.com; img-src 'self' data: https://*.supabase.co;" },
  { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
]
```

### 6. Add Missing Database Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_presencas_turma ON presencas(turma_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venc_status ON pagamentos(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_graduacoes_aluno_data ON graduacoes(aluno_id, data);
```

### 7. Generate TypeScript Types

```bash
npx supabase gen types typescript \
  --project-id yrfdxocwhztokadzxtto \
  > src/types/supabase.ts
```

Replace `any` casts in `useData.ts` and `auth.tsx` with generated types.

### 8. Add Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Ocorreu um erro</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap in `App.tsx`:
```typescript
<ErrorBoundary>
  <ModulosProvider>
    <AppContent />
  </ModulosProvider>
</ErrorBoundary>
```

### 9. Add Test Suite

Install and configure Vitest + Testing Library (see `documentation/13-Test-Strategy.md` for full test implementations).

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## Medium-term (3 Months)

### 10. Implement Pagination

Add pagination to `useAlunos`, `usePagamentos`, `usePresencas`:

```typescript
function useAlunos(page = 0, pageSize = 50) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [total, setTotal] = useState(0);
  
  const load = async () => {
    const { data, count } = await supabase
      .from('alunos')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('nome');
    setAlunos(data ?? []);
    setTotal(count ?? 0);
  };
  
  return { alunos, total, pages: Math.ceil(total / pageSize) };
}
```

### 11. Lazy-load jsPDF

```typescript
// src/lib/reportExport.ts
export async function generateContractPDF(data: ContractData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ... generate PDF
}
```

Reduces initial bundle by ~85KB (gzip).

### 12. Memoize Heavy Computations

In TurmasPage:
```typescript
const schedule = useMemo(() => buildScheduleMap(turmas), [turmas]);
```

In Layout:
```typescript
const visibleNav = useMemo(() => 
  NAV_ITEMS.filter(n => n.roles.includes(user.role) && isActive(n.id)),
  [user.role, isActive]
);
```

### 13. Image Optimization for Avatars

Resize photos before upload (max 400px, JPEG 85%):

```typescript
async function resizeAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(400, Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), {
    width: size, height: size
  });
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, size, size);
  return new Promise(r => canvas.toBlob(r!, 'image/jpeg', 0.85));
}
```

---

## Long-term (6+ Months)

### 14. WhatsApp Business Integration

The Meta WhatsApp Business API integration is designed but needs activation:
1. Register at business.facebook.com
2. Create WhatsApp Business app
3. Add `META_WHATSAPP_TOKEN` and `META_PHONE_ID` to Vercel env vars
4. Test bulk messaging from Comunicação page

### 15. Push Notifications

Implement PWA push notifications for:
- Payment due reminders
- Belt graduation announcements
- Class cancellations

Requires:
- Web Push API (VAPID keys)
- Service worker push event handler
- Opt-in UI for students

### 16. QR Code Check-in (Kiosk Mode)

The `KioskMode.tsx` component exists but QR scanning is not implemented:
1. Generate unique daily QR code per student
2. Add QR scanner to kiosk mode (e.g., `html5-qrcode` library)
3. Students scan their QR at the academy tablet

### 17. Migrate to CSS Modules

Replace all inline styles with CSS modules for better maintainability and responsive design. This is a significant effort (1-2 weeks) but dramatically improves code quality.

---

## Architecture Improvements

### Supabase Types Workflow

Set up a `supabase:types` npm script that regenerates types on schema change:
```json
{
  "scripts": {
    "supabase:types": "supabase gen types typescript --project-id yrfdxocwhztokadzxtto > src/types/supabase.ts"
  }
}
```

### CI/CD Pipeline

Add GitHub Actions for:
- Type checking on every PR
- ESLint on every PR
- Build verification on every PR
- E2E tests on merge to main

### Database Branching

Use Supabase's branch feature for database migrations:
```bash
supabase db branch create feature/new-table
# Apply migration to branch
# Test
# Merge to main
```
