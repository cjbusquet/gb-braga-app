# 11 — Performance Audit

**Gracie Barra Braga — Performance Assessment**  
Date: 2026-06-13

---

## 1. Overview

| Area | Score | Status |
|---|---|---|
| Bundle Size | 8/10 | Good |
| Data Fetching | 6/10 | Needs Pagination |
| Rendering | 7/10 | Good |
| Caching (PWA) | 9/10 | Excellent |
| Database Queries | 8/10 | Good |
| API Latency | 8/10 | Good (EU region) |

---

## 2. Bundle Analysis

### 2.1 Current Bundle (Estimated)

| Chunk | Estimated Size (gzip) |
|---|---|
| React + React-DOM | ~45 KB |
| @supabase/supabase-js | ~35 KB |
| jsPDF | ~85 KB |
| Application code | ~120 KB |
| **Total** | **~285 KB** |

**Assessment:** Acceptable for a PWA. The service worker pre-caches the entire bundle on first load, so subsequent navigations are instant.

### 2.2 Optimization Opportunities

**PERF-001 — jsPDF is always loaded (High impact)**  
jsPDF (~85KB gzip) is loaded on startup but only used when generating PDFs (ContratosPage, RelatoriosPage). Lazy-load it:

```typescript
// Instead of:
import jsPDF from 'jspdf';

// Use:
const generatePDF = async () => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ...
};
```

Saves ~30% of initial bundle.

**PERF-002 — Large page components not code-split**  
All pages are bundled together. With React.lazy(), each page loads on demand:

```typescript
const TurmasPage = React.lazy(() => import('./pages/admin/TurmasPage'));
const FinanceiroPage = React.lazy(() => import('./pages/admin/FinanceiroPage'));
// etc.

// In renderPage():
<Suspense fallback={<Spinner />}>
  {renderPage()}
</Suspense>
```

---

## 3. Data Fetching Performance

### 3.1 Current Behavior

All `useData.ts` hooks fetch complete table contents:

```typescript
supabase.from('alunos').select('*')  // All students
supabase.from('pagamentos').select('*')  // All payments
supabase.from('presencas').select('*')  // All attendance records
```

**PERF-003 — No pagination (Critical at scale)**

| Table | Current | At 500 students |
|---|---|---|
| alunos | Fine | ~150KB payload, 2-3s |
| pagamentos | Fine | ~500KB (2 years × 500 students) |
| presencas | Fine | ~5MB (daily records) |
| graduacoes | Fine | ~200KB |

**Fix:** Add range-based pagination:

```typescript
function useAlunos(page = 0, pageSize = 50) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  return supabase
    .from('alunos')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('nome');
}
```

### 3.2 N+1 Query Issues

**PERF-004 — Turmas page loads all enrolled alunos on expand**

When a turma is expanded to show enrolled students, it triggers a separate query. With 25 turmas each showing students, this is 25 queries. Batch with a JOIN:

```sql
SELECT t.*, json_agg(a.*) as alunos
FROM turmas t
LEFT JOIN inscricoes_turma it ON it.turma_id = t.id
LEFT JOIN alunos a ON a.id = it.aluno_id
GROUP BY t.id;
```

### 3.3 Redundant Data Fetching

**PERF-005 — Multiple components fetch the same data**

When navigating between tabs within a page (e.g., Comunicação has 3 tabs), each tab may re-fetch data. Consider lifting state up or using a simple client-side cache.

---

## 4. Database Query Performance

### 4.1 View: `v_kpis`

The KPI view runs aggregation queries on every dashboard load:

```sql
SELECT COUNT(*), SUM(p.valor) FILTER (WHERE ...), ...
FROM alunos a LEFT JOIN pagamentos p ON p.aluno_id = a.id;
```

**PERF-006 — KPI view unindexed join**  
The `alunos LEFT JOIN pagamentos` scan is O(n×m). For 500 students with 12 months of history = 6,000 payment rows. Currently acceptable. At scale (>2,000 students), consider:

```sql
-- Materialize with pg_cron refresh every 15 minutes
CREATE MATERIALIZED VIEW v_kpis_cached AS
SELECT ... FROM alunos a LEFT JOIN pagamentos p ...;

CREATE UNIQUE INDEX ON v_kpis_cached (total_alunos); -- dummy unique for refresh

SELECT cron.schedule('refresh-kpis', '*/15 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY v_kpis_cached');
```

### 4.2 `calcular_frequencia` Function

Called per-student when computing attendance rates. Currently O(n) per call. For bulk computation (e.g., updating all students monthly), use a batch UPDATE instead.

### 4.3 Missing Indexes

| Table | Column | Query Pattern | Priority |
|---|---|---|---|
| presencas | turma_id | Filter by class | High |
| pagamentos | (vencimento, status) | Overdue reports | High |
| graduacoes | (aluno_id, data) | Student history | Medium |
| mensagens | (created_at DESC) | History ordering | Medium |

Apply:
```sql
CREATE INDEX IF NOT EXISTS idx_presencas_turma ON presencas(turma_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venc_status ON pagamentos(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_graduacoes_aluno_data ON graduacoes(aluno_id, data);
```

---

## 5. Rendering Performance

### 5.1 Large Component Re-renders

**PERF-007 — Layout.tsx re-renders on every page navigation**

The Layout component contains heavy sidebar and nav rendering. Since it receives `currentPage` as a prop, every navigation triggers a full Layout re-render.

**Fix:** Memoize the sidebar:
```typescript
const Sidebar = React.memo(function Sidebar({ currentPage, onNavigate }) {
  // ... sidebar content
});
```

### 5.2 Inline Style Objects

Every render creates new style objects (e.g., `style={{ color: '#C8102E', fontSize: 14 }}`). While React is smart about updating the DOM, the object creation itself adds GC pressure.

**Fix:** Hoist constant style objects outside of render:
```typescript
// Before (new object every render):
return <div style={{ color: '#C8102E', fontSize: 14 }}>...</div>;

// After (reference stable):
const TITLE_STYLE = { color: '#C8102E', fontSize: 14 } as const;
return <div style={TITLE_STYLE}>...</div>;
```

### 5.3 TurmasPage Calendar

The calendar view builds a complex schedule map on every render. Memoize the computation:
```typescript
const schedule = useMemo(() => {
  const map: Record<string, Record<string, Turma[]>> = {};
  for (const t of turmas) {
    for (const dia of t.dias_semana) {
      // ... build map
    }
  }
  return map;
}, [turmas]);
```

---

## 6. PWA and Caching Performance

### 6.1 Service Worker Cache Strategies (Current)

| Resource | Strategy | TTL | Assessment |
|---|---|---|---|
| JS/CSS/HTML | PreCache | App version | ✅ Excellent |
| Supabase REST API | NetworkFirst | 5 min | ✅ Good |
| Supabase Storage | StaleWhileRevalidate | 24h | ✅ Good |
| Google Fonts | CacheFirst | 1 year | ✅ Excellent |

### 6.2 First Load Performance

On first load, the service worker downloads and caches all assets. Subsequent loads serve from cache instantly. Estimated metrics:

| Metric | First Load | Subsequent |
|---|---|---|
| Time to Interactive | ~2-3s (3G) | <0.5s |
| Largest Contentful Paint | ~1.5s | <0.3s |
| Bundle size (gzip) | ~285 KB | Cached |

---

## 7. Network Performance

### 7.1 Supabase Region

Project in `eu-west-1` (Ireland). For users in Braga (Portugal), latency is approximately 30-50ms — excellent.

### 7.2 Realtime WebSocket

Module state propagation uses a persistent WebSocket to Supabase Realtime. Connection overhead is paid once per session, updates arrive in <100ms. This is significantly more efficient than polling.

---

## 8. Mobile Performance

The app is designed mobile-first with responsive layout. Key mobile considerations:

- Bottom navigation (4 tabs) — correct for mobile UX
- No heavy animations or transitions
- PWA installation reduces browser chrome overhead
- Offline-capable via service worker

**PERF-008 — No image optimization**  
Avatar images uploaded to Supabase Storage are served as-is. Large images (e.g., 5MB phone photos) will be slow to load.

**Fix:** Implement client-side image resize before upload:
```typescript
function resizeImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      const scale = maxSize / Math.max(img.width, img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve!, 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 9. Performance Optimization Priority

| Priority | Item | Expected Gain | Effort |
|---|---|---|---|
| 1 | Lazy-load jsPDF (PERF-001) | -30% bundle | 1h |
| 2 | Add pagination to alunos/pagamentos (PERF-003) | Critical at scale | 4h |
| 3 | Add missing DB indexes (4 indexes) | Fast queries | 30min |
| 4 | Memoize TurmasPage schedule (PERF-007) | Smooth calendar | 1h |
| 5 | Lazy-load page components (PERF-002) | Faster initial load | 2h |
| 6 | Resize avatar before upload (PERF-008) | Faster photo load | 2h |
| 7 | Memoize Layout sidebar | Reduce re-renders | 1h |
| 8 | Materialize v_kpis at scale | Dashboard speed | 2h |
