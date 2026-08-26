import { useQuery } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { mockKPIs } from '../data/mockData';
import type { KPIs } from '../types';

export const KPIS_QUERY_KEYS = {
  all: () => ['kpis'] as const,
};

async function fetchKPIs(): Promise<KPIs> {
  if (!isConfigured) return mockKPIs;

  try {
    const [alunosRes, pagRes] = await Promise.all([
      supabase.from('alunos').select('id, status, data_matricula'),
      supabase.from('pagamentos').select('aluno_id, valor, status, data_pagamento, vencimento'),
    ]);
    if (alunosRes.error) throw alunosRes.error;
    if (pagRes.error) throw pagRes.error;

    const alunos   = alunosRes.data ?? [];
    const pags     = pagRes.data ?? [];
    const now      = new Date();
    const mesAtual = now.toISOString().slice(0, 7);

    const ativos  = alunos.filter(a => a.status === 'ativo').length;
    const novos   = alunos.filter(a => a.data_matricula?.startsWith(mesAtual)).length;
    const pagMes  = pags.filter(p => p.status === 'pago' && p.data_pagamento?.startsWith(mesAtual));
    const receita = pagMes.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    const inadimp = new Set(pags.filter(p => p.status === 'vencido').map(p => p.aluno_id)).size;

    return {
      totalAlunos:     alunos.length,
      alunosAtivos:    ativos,
      receitaMensal:   receita,
      receitaPrevista: pags.filter(p => p.status === 'pendente').reduce((s, p) => s + (parseFloat(p.valor) || 0), 0),
      inadimplentes:   inadimp,
      taxaFrequencia:  0,
      novosAlunos:     novos,
      cancelamentos:   alunos.filter(a => a.status === 'inativo').length,
      taxaRetencao:    ativos > 0 ? Math.round((ativos / alunos.length) * 100) : 0,
    };
  } catch (e) {
    // Mirrors useData.ts's other hooks: log and degrade to demo numbers
    // rather than surfacing an error state — this app has no error-boundary
    // UI convention, every other hook fails this way.
    console.warn('[kpis] Supabase error:', e);
    return mockKPIs;
  }
}

/** `data` is undefined only during the initial fetch — gate the KpiCard
 * skeleton on that (`!kpis`), same as the `!aluno` guard in PortalAluno.tsx. */
export function useKPIs() {
  return useQuery({
    queryKey: KPIS_QUERY_KEYS.all(),
    queryFn: fetchKPIs,
  });
}
