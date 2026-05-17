// @ts-nocheck
/**
 * useData — hooks React que ligam a app ao Supabase.
 * Se Supabase não estiver configurado, usa mockData como fallback.
 * 
 * Padrão: const { data, loading, error, refetch } = useAlunos()
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from './supabaseClient';
import * as mock from '../data/mockData';
import type { Aluno, Turma, Pagamento, Presenca, Graduacao, Plano, Contrato } from '../types';

// ── Helper ───────────────────────────────────────────────────────────────────
function useQuery<T>(
  supabaseQuery: () => Promise<{ data: T[] | null; error: any }>,
  mockData: T[],
  deps: any[] = []
) {
  const [data, setData]     = useState<T[]>(mockData);
  const [loading, setLoading] = useState(isConfigured);
  const [error, setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!isConfigured) { setData(mockData); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabaseQuery();
      if (err) throw err;
      setData((rows as T[]) ?? mockData);
      setError(null);
    } catch (e: any) {
      console.error('useQuery error:', e.message);
      setError(e.message);
      setData(mockData); // fallback to mock on error
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ── MAP: Supabase row → App type ──────────────────────────────────────────────
const mapAluno = (r: any): Aluno => ({
  id: r.id, nome: r.nome, email: r.email,
  telefone: r.telefone || '', whatsapp: r.whatsapp,
  dataNascimento: r.data_nascimento || '',
  faixa: r.faixa || 'branca', grau: r.grau ?? 0,
  dataMatricula: r.data_matricula || '',
  plano: r.plano_nome || r.plano_id || '',
  status: r.status || 'ativo',
  frequencia: r.frequencia ?? 0,
  responsavel: r.responsavel,
  stripeCustomerId: r.stripe_customer_id,
});

const mapTurma = (r: any): Turma => ({
  id: r.id, nome: r.nome,
  professorId: r.professor_id || '',
  professorNome: r.professor_nome || '',
  horario: r.horario || '',
  diaSemana: r.dias_semana || [],
  sala: r.sala || '',
  capacidade: r.capacidade || 20,
  inscritos: r.inscritos ?? 0,
  nivel: r.nivel || 'all',
  tipo: r.tipo || 'gi',
});

const mapPagamento = (r: any): Pagamento => ({
  id: r.id, alunoId: r.aluno_id, alunoNome: r.aluno_nome,
  valor: r.valor, vencimento: r.vencimento,
  pagamento: r.data_pagamento?.split('T')[0],
  status: r.status, metodo: r.metodo,
  plano: r.plano_nome || '',
  stripePaymentId: r.stripe_payment_id,
});

const mapPresenca = (r: any): Presenca => ({
  id: r.id, alunoId: r.aluno_id, alunoNome: r.aluno_nome,
  turmaId: r.turma_id || '', turmaNome: r.turma_nome || '',
  data: r.data, hora: r.hora,
  tipo: r.tipo || 'checkin', metodo: r.metodo || 'gps',
});

const mapGraduacao = (r: any): Graduacao => ({
  id: r.id, alunoId: r.aluno_id, alunoNome: r.aluno_nome,
  faixaAnterior: r.faixa_anterior, grauAnterior: r.grau_anterior,
  faixaNova: r.faixa_nova, grauNovo: r.grau_novo,
  data: r.data, professorId: r.professor_id || '',
  professorNome: r.professor_nome || '', observacao: r.observacao,
});

const mapPlano = (r: any): Plano => ({
  id: r.id, nome: r.nome, valor: r.valor,
  descricao: r.descricao || '', aulas: 'ilimitado',
  ativo: r.ativo, stripePriceId: r.stripe_price_id_live,
  categoria: r.categoria,
});

const mapContrato = (r: any): Contrato => ({
  id: r.id, alunoId: r.aluno_id, alunoNome: r.aluno_nome,
  plano: r.plano_nome || '', dataInicio: r.data_inicio,
  dataFim: r.data_fim, valor: r.valor,
  status: r.status, assinado: r.assinado,
  dataAssinatura: r.data_assinatura,
});

// ── HOOKS ────────────────────────────────────────────────────────────────────
export function useAlunos(filtros?: { status?: string }) {
  return useQuery<Aluno>(
    async () => {
      let q = supabase.from('alunos').select('*').order('nome');
      if (filtros?.status) q = q.eq('status', filtros.status);
      const res = await q;
      return { data: res.data?.map(mapAluno) ?? null, error: res.error };
    },
    mock.mockAlunos,
    [filtros?.status]
  );
}

export function useTurmas() {
  return useQuery<Turma>(
    async () => {
      const res = await supabase.from('turmas').select('*').order('nome');
      return { data: res.data?.map(mapTurma) ?? null, error: res.error };
    },
    mock.mockTurmas
  );
}

export function usePagamentos(alunoId?: string) {
  return useQuery<Pagamento>(
    async () => {
      let q = supabase.from('pagamentos').select('*').order('vencimento', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapPagamento) ?? null, error: res.error };
    },
    alunoId
      ? mock.mockPagamentos.filter(p => p.alunoId === alunoId)
      : mock.mockPagamentos,
    [alunoId]
  );
}

export function usePresencas(alunoId?: string, limit = 50) {
  return useQuery<Presenca>(
    async () => {
      let q = supabase.from('presencas').select('*').order('data', { ascending: false }).limit(limit);
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapPresenca) ?? null, error: res.error };
    },
    alunoId
      ? mock.mockPresencas.filter(p => p.alunoId === alunoId)
      : mock.mockPresencas,
    [alunoId, limit]
  );
}

export function useGraduacoes(alunoId?: string) {
  return useQuery<Graduacao>(
    async () => {
      let q = supabase.from('graduacoes').select('*').order('data', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapGraduacao) ?? null, error: res.error };
    },
    alunoId
      ? mock.mockGraduacoes.filter(g => g.alunoId === alunoId)
      : mock.mockGraduacoes,
    [alunoId]
  );
}

export function usePlanos() {
  return useQuery<Plano>(
    async () => {
      const res = await supabase.from('planos').select('*').eq('ativo', true).order('valor');
      return { data: res.data?.map(mapPlano) ?? null, error: res.error };
    },
    mock.mockPlanos
  );
}

export function useContratos() {
  return useQuery<Contrato>(
    async () => {
      const res = await supabase.from('contratos').select('*').order('data_inicio', { ascending: false });
      return { data: res.data?.map(mapContrato) ?? null, error: res.error };
    },
    mock.mockContratos
  );
}

export function useKPIs() {
  const [data, setData] = useState(mock.mockKPIs);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.from('v_kpis').select('*').single().then(({ data: row }) => {
      if (row) setData({
        totalAlunos: row.total_alunos ?? 0,
        alunosAtivos: row.alunos_ativos ?? 0,
        receitaMensal: row.receita_mensal ?? 0,
        receitaPrevista: row.receita_prevista ?? 0,
        inadimplentes: row.inadimplentes ?? 0,
        taxaFrequencia: 0,
        novosAlunos: row.novos_alunos ?? 0,
        cancelamentos: 0,
        taxaRetencao: 0,
      });
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────
export const db = {
  // Alunos
  criarAluno: async (aluno: Partial<Aluno>) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('alunos').insert({
      nome: aluno.nome, email: aluno.email, telefone: aluno.telefone,
      faixa: aluno.faixa || 'branca', grau: aluno.grau || 0,
      plano_nome: aluno.plano, status: 'ativo',
    }).select().single();
    if (error) throw error;
    return data;
  },

  atualizarAluno: async (id: string, campos: Partial<Aluno>) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('alunos').update({
      nome: campos.nome, email: campos.email, telefone: campos.telefone,
      faixa: campos.faixa, grau: campos.grau, status: campos.status,
      plano_nome: campos.plano,
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  suspenderAluno: async (id: string) => {
    if (!isConfigured) return;
    await supabase.from('alunos').update({ status: 'suspenso' }).eq('id', id);
  },

  // Presenças
  registarPresenca: async (dados: {
    alunoId: string; alunoNome: string;
    turmaId?: string; turmaNome?: string;
    metodo: string; gpsLat?: number; gpsLng?: number; gpsDist?: number;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('presencas').insert({
      aluno_id: dados.alunoId, aluno_nome: dados.alunoNome,
      turma_id: dados.turmaId, turma_nome: dados.turmaNome,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 8),
      tipo: 'checkin', metodo: dados.metodo,
      gps_lat: dados.gpsLat, gps_lng: dados.gpsLng, gps_dist_m: dados.gpsDist,
    }).select().single();
    if (error) throw error;
    return data;
  },

  // Pagamentos
  marcarPago: async (id: string, metodo: string) => {
    if (!isConfigured) return;
    await supabase.from('pagamentos').update({
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      metodo,
    }).eq('id', id);
  },

  // Graduações
  registarGraduacao: async (dados: {
    alunoId: string; alunoNome: string;
    faixaAnterior: string; grauAnterior: number;
    faixaNova: string; grauNovo: number;
    professorNome: string; observacao?: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('graduacoes').insert({
      aluno_id: dados.alunoId, aluno_nome: dados.alunoNome,
      faixa_anterior: dados.faixaAnterior, grau_anterior: dados.grauAnterior,
      faixa_nova: dados.faixaNova, grau_novo: dados.grauNovo,
      data: new Date().toISOString().split('T')[0],
      professor_nome: dados.professorNome, observacao: dados.observacao,
    }).select().single();
    if (error) throw error;
    // Update aluno faixa
    await supabase.from('alunos').update({
      faixa: dados.faixaNova, grau: dados.grauNovo,
    }).eq('id', dados.alunoId);
    return data;
  },

  // Contratos
  criarContrato: async (dados: {
    alunoId: string; alunoNome: string; alunoNif: string;
    planoId: string; planoNome: string; valor: number;
    assinaturaImg: string; aceitaImagem: boolean; aceitaRGPD: boolean;
    encPagamento: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('contratos').insert({
      aluno_id: dados.alunoId, aluno_nome: dados.alunoNome, aluno_nif: dados.alunoNif,
      plano_id: dados.planoId, plano_nome: dados.planoNome, valor: dados.valor,
      assinado: true, data_assinatura: new Date().toISOString(),
      assinatura_img: dados.assinaturaImg,
      aceita_imagem: dados.aceitaImagem, aceita_rgpd: dados.aceitaRGPD,
      aceita_contrato: true, enc_pagamento: dados.encPagamento,
    }).select().single();
    if (error) throw error;
    // Mark profile as enrolled
    await supabase.from('profiles')
      .update({ matricula_completa: true })
      .eq('id', dados.alunoId);
    return data;
  },

  // Numerário
  submeterNumerario: async (dados: {
    alunoId: string; nomeAluno: string; email: string;
    telefone: string; planoId: string; planoNome: string; valor: number;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('pedidos_numerario').insert({
      aluno_id: dados.alunoId, nome_aluno: dados.nomeAluno, email: dados.email,
      telefone: dados.telefone, plano_id: dados.planoId,
      plano_nome: dados.planoNome, valor: dados.valor, status: 'pendente',
    }).select().single();
    if (error) throw error;
    return data;
  },

  aprovarNumerario: async (id: string, nota: string) => {
    if (!isConfigured) return;
    const { data } = await supabase.from('pedidos_numerario')
      .update({ status: 'aprovado', nota_admin: nota, aprovado_em: new Date().toISOString() })
      .eq('id', id).select().single();
    if (data?.aluno_id) {
      await supabase.from('alunos')
        .update({ numerario_aprovado: true, metodo_pagamento: 'numerario' })
        .eq('id', data.aluno_id);
      await supabase.from('profiles')
        .update({ matricula_completa: true })
        .eq('email', data.email);
    }
  },

  rejeitarNumerario: async (id: string, nota: string) => {
    if (!isConfigured) return;
    await supabase.from('pedidos_numerario')
      .update({ status: 'rejeitado', nota_admin: nota })
      .eq('id', id);
  },

  criarTurma: async (dados: {
    nome: string; professorNome?: string; horario: string;
    diasSemana?: string[]; sala?: string; capacidade?: number;
    nivel?: string; tipo?: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('turmas').insert({
      nome: dados.nome,
      professor_nome: dados.professorNome,
      horario: dados.horario,
      dias_semana: dados.diasSemana || [],
      sala: dados.sala,
      capacidade: dados.capacidade || 20,
      nivel: dados.nivel || 'all',
      tipo: dados.tipo || 'gi',
      ativa: true,
    }).select().single();
    if (error) throw error;
    return data;
  },

  criarPagamento: async (dados: {
    alunoId: string; alunoNome: string; planoId?: string;
    planoNome?: string; valor: number; vencimento: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('pagamentos').insert({
      aluno_id: dados.alunoId,
      aluno_nome: dados.alunoNome,
      plano_id: dados.planoId,
      plano_nome: dados.planoNome,
      valor: dados.valor,
      vencimento: dados.vencimento,
      status: 'pendente',
    }).select().single();
    if (error) throw error;
    return data;
  },

  criarAluno: async (dados: {
    nome: string; email: string; telefone?: string;
    nif?: string; faixa?: string; grau?: number;
    planoId?: string; planoNome?: string; morada?: string; codPostal?: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('alunos').insert({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      nif: dados.nif,
      faixa: dados.faixa || 'branca',
      grau: dados.grau || 0,
      plano_id: dados.planoId,
      plano_nome: dados.planoNome,
      morada: dados.morada,
      cod_postal: dados.codPostal,
      status: 'ativo',
      data_matricula: new Date().toISOString().split('T')[0],
    }).select().single();
    if (error) throw error;
    return data;
  },

  enviarMensagem: async (dados: {
    paraId: string; paraNome: string; canal: string;
    assunto?: string; corpo: string; remetente: string;
  }) => {
    if (!isConfigured) return null;
    const { data, error } = await supabase.from('mensagens').insert({
      para_id: dados.paraId,
      para_nome: dados.paraNome,
      canal: dados.canal,
      assunto: dados.assunto,
      corpo: dados.corpo,
      remetente: dados.remetente,
      status: 'enviado',
      enviado_em: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data;
  },
};
