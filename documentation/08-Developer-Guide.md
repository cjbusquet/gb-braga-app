# 08 — Developer Guide

**Gracie Barra Braga — Developer Onboarding**

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS or later | https://nodejs.org |
| npm | 10+ (bundled with Node) | — |
| Git | 2.40+ | https://git-scm.com |
| Supabase CLI | latest | `npm i -g supabase` |
| VS Code | latest (recommended) | https://code.visualstudio.com |

---

## 2. Local Setup

See the root `README.md` "Instalação rápida" section for clone/install/env/run-locally steps.

---

## 3. Environment Configuration

See `documentation/07-Environment.md` for full variable reference.

**Minimum for local development:**
```env
VITE_SUPABASE_URL=https://yrfdxocwhztokadzxtto.supabase.co
VITE_SUPABASE_ANON=<your-anon-key>
```

**Demo mode** (no Supabase needed): leave `VITE_SUPABASE_URL` empty or with a placeholder. The app will use `src/data/mockData.ts` with five pre-configured users.

---

## 4. Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on localhost:5173 |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check without emitting files |

---

## 5. Project Structure

See `documentation/01-Architecture.md` §9 for the full annotated folder tree, and `CLAUDE.md` for the folder conventions new code should follow (`hooks/` for new data hooks, `services/` for PDF/API integration logic, etc.).

---

## 6. Coding Conventions

### 6.1 Component Structure

All pages follow this pattern:
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useData } from '../../lib/useData';

// 2. Type definitions (local to file)
interface LocalProps { ... }

// 3. Sub-components (if needed)
function SubComponent({ prop }: LocalProps) { ... }

// 4. Main exported component
export default function PageName() {
  // State
  const [state, setState] = useState(...);
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleAction = async () => { ... };
  
  // Render
  return <div>...</div>;
}
```

### 6.2 Styling

Styling uses **Tailwind CSS** utility classes (`className="..."`). Older pages still carry some inline styles (`style={{}}`) from before the Tailwind migration — prefer Tailwind classes for new code. The brand colors are:

```typescript
// src/lib/gbBrand.ts
export const GB_RED = '#C8102E';
export const GB_BLACK = '#111111';
export const GB_CREAM = '#F7F6F4'; // background
export const GB_BORDER = '#E2E0DB'; // borders
```

### 6.3 Data Fetching Pattern

```typescript
// hooks return: { data, loading, error, refetch }
function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('alunos').select('*');
    setAlunos(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  return { alunos, loading, refetch: load };
}
```

### 6.4 TypeScript

- Prefer explicit types over inference for function parameters and return values
- Use `type` for unions and aliases, `interface` for object shapes
- Avoid `any` — use `unknown` and narrow with type guards
- The `Belt` type (src/types/index.ts) is the canonical list of all belt variants

### 6.5 Error Handling

```typescript
// Pattern: try/catch with user-visible error state
try {
  const { data, error } = await supabase.from('alunos').insert({ ... });
  if (error) throw error;
  setSuccess(true);
} catch (e) {
  setError(e instanceof Error ? e.message : 'Erro desconhecido');
}
```

---

## 7. Adding a New Page

1. Create the page component in `src/pages/admin/NewPage.tsx` or `src/pages/aluno/NewPage.tsx`

2. Add the import to `src/App.tsx`:
```typescript
import NewPage from './pages/admin/NewPage';
```

3. Add to `PAGE_ROLES` in `App.tsx`:
```typescript
'new-page': ['admin', 'superadmin'],
```

4. Add to the `renderPage` switch in `App.tsx`:
```typescript
case 'new-page': return <NewPage />;
```

5. Add navigation item to `Layout.tsx` NAV_ITEMS:
```typescript
{ icon: '🆕', label: 'Nova Página', id: 'new-page', roles: ['admin', 'superadmin'] }
```

6. If the page should be a toggleable module, add to `MODULE_CATALOGUE` in `useModulos.tsx`

---

## 8. Adding a New Supabase Table

1. Write the migration SQL in `supabase/patches/`:
```sql
-- supabase/patches/03_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gere" ON new_table FOR ALL
  USING (auth_role() IN ('admin','superadmin'));
```

2. Apply via Supabase MCP or SQL Editor

3. Add TypeScript interface to `src/types/index.ts`

4. Add data hook to `src/lib/useData.ts`

---

## 9. Supabase Edge Functions

### Development

```bash
# Install Supabase CLI
npm i -g supabase

# Login
supabase login

# Link project
supabase link --project-ref yrfdxocwhztokadzxtto

# Deploy a function
supabase functions deploy send-email
supabase functions deploy invite-staff
```

### Edge Function Pattern

```typescript
// supabase/functions/function-name/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const body = await req.json();
    // ... business logic
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 10. Debugging

### Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| Blank screen after login | RLS policy missing or profile not created | Check Supabase Auth logs, run patch 02 |
| Module toggle not propagating | Realtime subscription not connected | Check browser WS connection to Supabase |
| GPS check-in fails silently | Aluno lacks INSERT policy on presencas | Check `supabase/patches/17_fix_checkin.sql` is applied |
| Email not sending | SMTP/SPF block | Use Resend API key instead |
| Belt shows wrong color | Old beltConfig cached | Hard refresh (Ctrl+Shift+R) |

### Browser DevTools

The app uses `console.warn` and `console.error` for non-fatal issues. Check the browser console for:
- `Profile not found — attempting self-create` → profile trigger failed
- `loadProfile error` → Supabase connectivity issue

### Supabase Logs

Dashboard → Logs → API Logs / Edge Function Logs

---

## 11. Git Workflow

```
main          ← production branch (auto-deploys to Vercel)
feature/*     ← feature branches
fix/*         ← bug fix branches
```

**Branch naming:** `feature/nome-da-feature` or `fix/descricao-do-bug`

**Commit format:** `feat: descrição` / `fix: descrição` / `docs: descrição`

**PR process:**
1. Create branch from `main`
2. Implement changes
3. Run `npm run typecheck && npm run lint && npm run build`
4. Open PR → review → merge to `main` → auto-deploy

---

## 12. Known Technical Debt

| Item | Priority | Effort |
|---|---|---|
| Add pagination to data hooks | Medium | 2-4 hours |
| Generate Supabase TypeScript types (`supabase gen types typescript`) | Medium | 1 hour |
| Add test suite (Vitest/Playwright — see CLAUDE.md §6) | Medium | 2-3 days |
| Finish migrating remaining inline styles to Tailwind classes | Low | ongoing |
