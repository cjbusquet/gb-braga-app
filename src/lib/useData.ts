// @ts-nocheck
/**
 * useData — hooks React ligados ao Supabase
 * Fallback automático para mockData se Supabase não configurado
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from './supabaseClient';
import * as mock from '../data/mockData';

// ── Generic hook ─────────────────────────────────────────────
function useQuery<T>(
  key: string,
  supabaseQuery: () => Promise<any>,
  fallback: T[],
  deps: any[] = []
) {
  const [data, setData]       = useState<T[]>(fallback);
  const [loading, setLoading] = useState(isConfigured);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isConfigured) { setData(fallback); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabaseQuery();
      if (err) throw err;
      setData(rows ?? fallback);
      setError(null);
    } catch (e: any) {
      console.warn(`[${key}] Supabase error:`, e.message);
      setError(e.message);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ── ALUNOS ────────────────────────────────────────────────────
export function useAlunos(filtros?: { status?: string }) {
  return useQuery(
    'alunos',
    async () => {
      let q = supabase.from('alunos').select('*').order('nome');
      if (filtros?.status) q = q.eq('status', filtros.status);
      return q;
    },
    mock.mockAlunos,
    [filtros?.status]
  );
}

// ── TURMAS ────────────────────────────────────────────────────
export function useTurmas() {
  return useQuery(
    'turmas',
    () => supabase.from('turmas').select('*').order('nome'),
    mock.mockTurmas
  );
}

// ── PAGAMENTOS ────────────────────────────────────────────────
export function usePagamentos(alunoId?: string) {
  return useQuery(
    'pagamentos',
    async () => {
      let q = supabase.from('pagamentos').select('*').order('vencimento', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      return q;
    },
    alunoId ? mock.mockPagamentos.filter(p => p.alunoId === alunoId) : mock.mockPagamentos,
    [alunoId]
  );
}

// ── PRESENÇAS ─────────────────────────────────────────────────
export function usePresencas(alunoId?: string, limit = 100) {
  return useQuery(
    'presencas',
    async () => {
      let q = supabase
        .from('presencas')
        .select('id, aluno_id, aluno_nome, turma_id, turma_nome, data, hora, tipo, metodo, created_at')
        .order('data', { ascending: false })
        .limit(limit);
      if (alunoId) q = q.eq('aluno_id', alunoId);
      return q;
    },
    alunoId ? mock.mockPresencas.filter(p => p.alunoId === alunoId) : mock.mockPresencas,
    [alunoId, limit]
  );
}

// ── GRADUAÇÕES ────────────────────────────────────────────────
export function useGraduacoes(alunoId?: string) {
  return useQuery(
    'graduacoes',
    async () => {
      let q = supabase.from('graduacoes').select('*').order('data', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      return q;
    },
    alunoId ? mock.mockGraduacoes.filter(g => g.alunoId === alunoId) : mock.mockGraduacoes,
    [alunoId]
  );
}

// ── PLANOS ────────────────────────────────────────────────────
export function usePlanos() {
  return useQuery(
    'planos',
    () => supabase.from('planos').select('*').eq('ativo', true).order('valor'),
    mock.mockPlanos
  );
}

// ── CONTRATOS ─────────────────────────────────────────────────
export function useContratos() {
  return useQuery(
    'contratos',
    () => supabase.from('contratos').select('*').order('data_inicio', { ascending: false }),
    mock.mockContratos || []
  );
}

// ── KPIs ──────────────────────────────────────────────────────
export function useKPIs() {
  const [data, setData]       = useState(mock.mockKPIs);
  const [loading, setLoading] = useState(isConfigured);

  const refetch = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    try {
      // Calculate KPIs from real data
      const [alunosRes, pagRes] = await Promise.all([
        supabase.from('alunos').select('id, status, data_matricula'),
        supabase.from('pagamentos').select('valor, status, data_pagamento, vencimento'),
      ]);

      const alunos    = alunosRes.data || [];
      const pags      = pagRes.data    || [];
      const now       = new Date();
      const mesAtual  = now.toISOString().slice(0, 7);

      const ativos    = alunos.filter(a => a.status === 'ativo').length;
      const novos     = alunos.filter(a => a.data_matricula?.startsWith(mesAtual)).length;
      const pagMes    = pags.filter(p => p.status === 'pago' && p.data_pagamento?.startsWith(mesAtual));
      const receita   = pagMes.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
      const inadimp   = new Set(pags.filter(p => p.status === 'vencido').map(p => p.aluno_id)).size;

      setData({
        totalAlunos:    alunos.length,
        alunosAtivos:   ativos,
        receitaMensal:  receita,
        receitaPrevista: pags.filter(p => p.status === 'pendente').reduce((s,p) => s + (parseFloat(p.valor)||0), 0),
        inadimplentes:  inadimp,
        taxaFrequencia: 0,
        novosAlunos:    novos,
        cancelamentos:  alunos.filter(a => a.status === 'inativo').length,
        taxaRetencao:   ativos > 0 ? Math.round((ativos / alunos.length) * 100) : 0,
      });
    } catch (e) {
      console.warn('useKPIs error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

// ── MUTATIONS ─────────────────────────────────────────────────
export const db = {

  criarAluno: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('alunos').insert({
      nome:       dados.nome,
      email:      dados.email,
      telefone:   dados.telefone,
      nif:        dados.nif,
      faixa:      dados.faixa || 'branca',
      grau:       dados.grau  || 0,
      plano_id:   dados.planoId,
      plano_nome: dados.planoNome,
      morada:     dados.morada,
      cod_postal: dados.codPostal,
      status:     'ativo',
      data_matricula: new Date().toISOString().split('T')[0],
    }).select().single();
    if (error) throw error;
    return data;
  },

  atualizarAluno: async (id: string, campos: any) => {
    if (!isConfigured) return null;
    const map: any = {};
    if (campos.nome)      map.nome      = campos.nome;
    if (campos.email)     map.email     = campos.email;
    if (campos.telefone)  map.telefone  = campos.telefone;
    if (campos.nif)       map.nif       = campos.nif;
    if (campos.status)    map.status    = campos.status;
    if (campos.faixa)     map.faixa     = campos.faixa;
    if (campos.grau !== undefined) map.grau = campos.grau;
    const { data, error } = await supabase.from('alunos').update(map).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  suspenderAluno: async (id: string) => {
    if (!isConfigured) return;
    await supabase.from('alunos').update({ status: 'suspenso' }).eq('id', id);
  },

  registarPresenca: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('presencas').insert({
      aluno_id:   dados.alunoId,
      aluno_nome: dados.alunoNome,
      turma_id:   dados.turmaId   || null,
      turma_nome: dados.turmaNome || null,
      data:       new Date().toISOString().split('T')[0],
      hora:       new Date().toTimeString().slice(0, 8),
      tipo:       'checkin',
      metodo:     dados.metodo || 'manual',
      gps_lat:    dados.gpsLat   || null,
      gps_lng:    dados.gpsLng   || null,
      gps_dist_m: dados.gpsDist  || null,
    }).select().single();
    if (error) throw error;
    return data;
  },

  marcarPago: async (id: string, metodo: string) => {
    if (!isConfigured) return;
    const { error } = await supabase.from('pagamentos').update({
      status:          'pago',
      data_pagamento:  new Date().toISOString(),
      metodo,
    }).eq('id', id);
    if (error) throw error;
  },

  criarPagamento: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('pagamentos').insert({
      aluno_id:   dados.alunoId,
      aluno_nome: dados.alunoNome,
      plano_id:   dados.planoId,
      plano_nome: dados.planoNome,
      valor:      dados.valor,
      vencimento: dados.vencimento,
      status:     'pendente',
    }).select().single();
    if (error) throw error;
    return data;
  },

  registarGraduacao: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('graduacoes').insert({
      aluno_id:       dados.alunoId,
      aluno_nome:     dados.alunoNome,
      faixa_anterior: dados.faixaAnterior,
      grau_anterior:  dados.grauAnterior,
      faixa_nova:     dados.faixaNova,
      grau_novo:      dados.grauNovo,
      data:           new Date().toISOString().split('T')[0],
      professor_nome: dados.professorNome,
      observacao:     dados.observacao || null,
    }).select().single();
    if (error) throw error;
    // Actualizar faixa do aluno
    await supabase.from('alunos').update({ faixa: dados.faixaNova, grau: dados.grauNovo }).eq('id', dados.alunoId);
    return data;
  },

  criarContrato: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('contratos').insert({
      aluno_id:        dados.alunoId,
      aluno_nome:      dados.alunoNome,
      aluno_nif:       dados.alunoNif,
      plano_id:        dados.planoId,
      plano_nome:      dados.planoNome,
      valor:           dados.valor,
      assinado:        true,
      data_assinatura: new Date().toISOString(),
      assinatura_img:  dados.assinaturaImg,
      aceita_imagem:   dados.aceitaImagem,
      aceita_rgpd:     dados.aceitaRGPD,
      aceita_contrato: true,
      enc_pagamento:   dados.encPagamento,
    }).select().single();
    if (error) throw error;
    await supabase.from('profiles').update({ matricula_completa: true }).eq('id', dados.alunoId);
    return data;
  },

  criarTurma: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('turmas').insert({
      nome:           dados.nome,
      professor_nome: dados.professorNome || null,
      horario:        dados.horario,
      dias_semana:    dados.diasSemana || [],
      sala:           dados.sala       || null,
      capacidade:     dados.capacidade || 20,
      nivel:          dados.nivel      || 'all',
      tipo:           dados.tipo       || 'gi',
      ativa:          true,
    }).select().single();
    if (error) throw error;
    return data;
  },

  enviarMensagem: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('mensagens').insert({
      para_id:    dados.paraId,
      para_nome:  dados.paraNome,
      canal:      dados.canal,
      assunto:    dados.assunto || null,
      corpo:      dados.corpo,
      remetente:  dados.remetente,
      status:     'enviado',
      enviado_em: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data;
  },

  submeterNumerario: async (dados: any) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('pedidos_numerario').insert({
      aluno_id:   dados.alunoId,
      nome_aluno: dados.nomeAluno,
      email:      dados.email,
      telefone:   dados.telefone,
      plano_id:   dados.planoId,
      plano_nome: dados.planoNome,
      valor:      dados.valor,
      status:     'pendente',
    }).select().single();
    if (error) throw error;
    return data;
  },

  aprovarNumerario: async (id: string, nota: string) => {
    if (!isConfigured) return;
    const { data, error } = await supabase.from('pedidos_numerario')
      .update({ status: 'aprovado', nota_admin: nota, aprovado_em: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    if (data?.aluno_id) {
      await supabase.from('alunos').update({ numerario_aprovado: true, metodo_pagamento: 'numerario' }).eq('id', data.aluno_id);
      await supabase.from('profiles').update({ matricula_completa: true }).eq('email', data.email);
    }
  },

  rejeitarNumerario: async (id: string, nota: string) => {
    if (!isConfigured) return;
    await supabase.from('pedidos_numerario')
      .update({ status: 'rejeitado', nota_admin: nota })
      .eq('id', id);
  },
};
