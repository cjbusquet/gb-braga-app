# Performance Report

**GB Braga Platform — Performance Summary**  
Date: 2026-06-13

See `documentation/11-Performance-Audit.md` for full analysis.

---

## Current Metrics (Estimated)

| Metric | First Load | Subsequent (PWA) |
|---|---|---|
| Bundle size (gzip) | ~285 KB | Cached |
| Time to Interactive (4G) | ~1.5s | <0.5s |
| Time to Interactive (3G) | ~3s | <0.5s |
| API latency (Supabase EU) | 30-50ms | — |

---

## Priority Optimizations

| # | Optimization | Bundle Reduction | Effort |
|---|---|---|---|
| 1 | Lazy-load jsPDF | -30% (~85KB) | 1h |
| 2 | Code-split page components | -40% initial | 2h |
| 3 | Add pagination to data hooks | Critical at scale | 4h |
| 4 | Memoize schedule computation | Smooth calendar | 1h |
| 5 | Resize avatar before upload | Faster photos | 2h |
| 6 | Add missing DB indexes (4) | Faster queries | 30min |

---

## Immediate Action (30 min)

```sql
-- Add 4 missing database indexes
CREATE INDEX IF NOT EXISTS idx_presencas_turma ON presencas(turma_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venc_status ON pagamentos(vencimento, status);
CREATE INDEX IF NOT EXISTS idx_graduacoes_aluno_data ON graduacoes(aluno_id, data);
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON mensagens(created_at DESC);
```

These are zero-risk and immediately improve query performance.

---

## Scaling Thresholds

| Users | Status | Action Needed |
|---|---|---|
| 0–200 | ✅ No issues | None |
| 200–500 | ⚠️ Watch | Add pagination |
| 500–1000 | ❌ Degraded | Pagination critical |
| 1000+ | ❌ Broken | Materialize v_kpis, partitioning |
