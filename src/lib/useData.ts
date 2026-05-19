/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from './supabaseClient';
import * as mock from '../data/mockData';

// ── Generic hook ─────────────────────────────────────────────
// key encodes query identity — change it to trigger a re-fetch (e.g. `alunos:${status}`)
function useQuery<T>(
  key: string,
  supabaseQuery: () => Promise<{ data: T[] | null; error: unknown }>,
  fallback: T[]
) {
  const [data, setData]       = useState<T[]>(fallback);
  const [loading, setLoading] = useState(isConfigured);
  const [error, setError]     = useState<string | null>(null);

  // key encodes when the query should re-run; supabaseQuery/fallback change
  // on every render (inline functions/arrays) so are intentionally omitted
  const fetch = useCallback(async () => {
    if (!isConfigured) { setData(fallback); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: rows, error: err } = await supabaseQuery();
      if (err) throw err;
      setData((rows as T[]) ?? fallback);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[${key}] Supabase error:`, msg);
      setError(msg);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // fetch() is async — setState is called asynchronously, not synchronously
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ── ALUNOS ────────────────────────────────────────────────────
export function useAlunos(filtros?: { status?: string }) {
  return useQuery(
    `alunos:${filtros?.status ?? ''}`,
    async () => {
      let q = supabase.from('alunos').select('*').order('nome');
      if (filtros?.status) q = q.eq('status', filtros.status);
      const res = await q;
      return { data: res.data?.map(mapAluno) ?? null, error: res.error };
    },
    mock.mockAlunos
  );
}

// ── TURMAS ────────────────────────────────────────────────────
export function useTurmas() {
  return useQuery(
    'turmas',
    async () => {
      const res = await supabase.from('turmas').select('*').order('nome');
      return { data: res.data?.map(mapTurma) ?? null, error: res.error };
    },
    mock.mockTurmas
  );
}

// ── PAGAMENTOS ────────────────────────────────────────────────
export function usePagamentos(alunoId?: string) {
  return useQuery(
    `pagamentos:${alunoId ?? ''}`,
    async () => {
      let q = supabase.from('pagamentos').select('*').order('vencimento', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapPagamento) ?? null, error: res.error };
    },
    alunoId ? mock.mockPagamentos.filter(p => p.alunoId === alunoId) : mock.mockPagamentos
  );
}

// ── PRESENÇAS ─────────────────────────────────────────────────
export function usePresencas(alunoId?: string, limit = 100) {
  return useQuery(
    `presencas:${alunoId ?? ''}:${limit}`,
    async () => {
      let q = supabase
        .from('presencas')
        .select('id, aluno_id, aluno_nome, turma_id, turma_nome, data, hora, tipo, metodo, created_at')
        .order('data', { ascending: false })
        .limit(limit);
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapPresenca) ?? null, error: res.error };
    },
    alunoId ? mock.mockPresencas.filter(p => p.alunoId === alunoId) : mock.mockPresencas
  );
}

// ── GRADUAÇÕES ────────────────────────────────────────────────
export function useGraduacoes(alunoId?: string) {
  return useQuery(
    `graduacoes:${alunoId ?? ''}`,
    async () => {
      let q = supabase.from('graduacoes').select('*').order('data', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const res = await q;
      return { data: res.data?.map(mapGraduacao) ?? null, error: res.error };
    },
    alunoId ? mock.mockGraduacoes.filter(g => g.alunoId === alunoId) : mock.mockGraduacoes
  );
}

// ── PLANOS ────────────────────────────────────────────────────
export function usePlanos() {
  return useQuery(
    'planos',
    async () => supabase.from('planos').select('*').eq('ativo', true).order('valor'),
    mock.mockPlanos
  );
}

// ── CONTRATOS ─────────────────────────────────────────────────
export function useContratos() {
  return useQuery(
    'contratos',
    async () => {
      const res = await supabase.from('contratos').select('*').order('data_inicio', { ascending: false });
      return { data: res.data?.map(mapContrato) ?? null, error: res.error };
    },
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
        supabase.from('pagamentos').select('aluno_id, valor, status, data_pagamento, vencimento'),
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

// ── MUTATIONS ─────────────────────────────────────────────────
export const db = {

  criarAluno: async (dados: any) => {
    if (!isConfigured) return null;
    // Normalize faixa to a valid belt_type enum value.
    // Form values like 'Cinza e Branca' or 'Branca' must map to
    // lowercase single-word values ('cinza', 'branca', …).
    const rawFaixa: string = (dados.faixa || '').toLowerCase().trim();
    const faixaEnum = rawFaixa.split(/\s+/)[0] || 'branca';
    const validFaixas = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];
    const faixa = validFaixas.includes(faixaEnum) ? faixaEnum : 'branca';

    const { data, error } = await supabase.from('alunos').insert({
      profile_id:      dados.profileId    || null,
      nome:            dados.nome,
      email:           dados.email,
      telefone:        dados.telefone     || null,
      nif:             dados.nif          || null,
      faixa,
      grau:            dados.grau         ?? 0,
      plano_id:        dados.planoId      || null,
      plano_nome:      dados.planoNome    || null,
      morada:          dados.morada       || null,
      cod_postal:      dados.codPostal    || null,
      data_nascimento: dados.dataNasc     || null,
      status:          dados.status       || 'ativo',
      data_matricula:  new Date().toISOString().split('T')[0],
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
      aluno_nif:       dados.alunoNif    || null,
      plano_id:        dados.planoId     || null,
      plano_nome:      dados.planoNome   || null,
      valor:           dados.valor       ?? 0,
      assinado:        true,
      data_assinatura: new Date().toISOString(),
      assinatura_img:  dados.assinaturaImg || null,
      aceita_imagem:   dados.aceitaImagem  ?? false,
      aceita_rgpd:     dados.aceitaRGPD    ?? false,
      aceita_contrato: true,
      enc_pagamento:   dados.encPagamento  || 'aluno',
    }).select().single();
    if (error) throw error;
    // NOTE: profiles.matricula_completa is set separately by the
    // enrollment flow using the correct auth user ID — do NOT update
    // it here (dados.alunoId is the alunos UUID, not the profile UUID).
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

// ── MAPPERS: Supabase snake_case → App camelCase ──────────────
export function mapAluno(r: any) {
  if (!r) return r;
  return {
    id:              r.id,
    nome:            r.nome,
    email:           r.email,
    telefone:        r.telefone || '',
    whatsapp:        r.whatsapp || '',
    dataNascimento:  r.data_nascimento || r.dataNascimento || '',
    nif:             r.nif || '',
    morada:          r.morada || '',
    codPostal:       r.cod_postal || r.codPostal || '',
    faixa:           r.faixa || 'branca',
    grau:            r.grau ?? 0,
    dataMatricula:   r.data_matricula || r.dataMatricula || '',
    plano:           r.plano_nome || r.plano || '',
    planoId:         r.plano_id || r.planoId || '',
    status:          r.status || 'ativo',
    frequencia:      r.frequencia ?? 0,
    responsavel:     r.responsavel || '',
    stripeCustomerId: r.stripe_customer_id || r.stripeCustomerId || '',
    stripeSubId:     r.stripe_subscription_id || '',
    metodoPagamento: r.metodo_pagamento || 'stripe',
    numerarioAprovado: r.numerario_aprovado || false,
  };
}

export function mapPresenca(r: any) {
  if (!r) return r;
  return {
    id:        r.id,
    alunoId:   r.aluno_id   || r.alunoId,
    alunoNome: r.aluno_nome || r.alunoNome,
    turmaId:   r.turma_id   || r.turmaId   || '',
    turmaNome: r.turma_nome || r.turmaNome  || '',
    data:      r.data,
    hora:      r.hora,
    tipo:      r.tipo    || 'checkin',
    metodo:    r.metodo  || 'manual',
  };
}

export function mapPagamento(r: any) {
  if (!r) return r;
  return {
    id:               r.id,
    alunoId:          r.aluno_id    || r.alunoId,
    alunoNome:        r.aluno_nome  || r.alunoNome,
    plano:            r.plano_nome  || r.plano || '',
    planoId:          r.plano_id    || r.planoId || '',
    valor:            r.valor,
    vencimento:       r.vencimento,
    pagamento:        r.data_pagamento?.split('T')[0] || r.pagamento || '',
    status:           r.status,
    metodo:           r.metodo || '',
    stripePaymentId:  r.stripe_payment_id || '',
  };
}

export function mapGraduacao(r: any) {
  if (!r) return r;
  return {
    id:             r.id,
    alunoId:        r.aluno_id       || r.alunoId,
    alunoNome:      r.aluno_nome     || r.alunoNome,
    faixaAnterior:  r.faixa_anterior || r.faixaAnterior || 'branca',
    grauAnterior:   r.grau_anterior  ?? r.grauAnterior ?? 0,
    faixaNova:      r.faixa_nova     || r.faixaNova || 'branca',
    grauNovo:       r.grau_novo      ?? r.grauNovo ?? 0,
    data:           r.data,
    professorNome:  r.professor_nome || r.professorNome || '',
    observacao:     r.observacao || '',
  };
}

export function mapContrato(r: any) {
  if (!r) return r;
  return {
    id:             r.id,
    alunoId:        r.aluno_id   || r.alunoId,
    alunoNome:      r.aluno_nome || r.alunoNome,
    plano:          r.plano_nome || r.plano || '',
    valor:          r.valor,
    dataInicio:     r.data_inicio || r.dataInicio || '',
    dataFim:        r.data_fim    || r.dataFim    || '',
    status:         r.status || 'ativo',
    assinado:       r.assinado || false,
    dataAssinatura: r.data_assinatura || '',
  };
}

export function mapTurma(r: any) {
  if (!r) return r;
  return {
    id:            r.id,
    nome:          r.nome,
    professorId:   r.professor_id   || '',
    professorNome: r.professor_nome || r.professorNome || '',
    horario:       r.horario || '',
    diaSemana:     r.dias_semana    || r.diaSemana || [],
    sala:          r.sala || '',
    capacidade:    r.capacidade || 20,
    inscritos:     r.inscritos ?? 0,
    nivel:         r.nivel || 'all',
    tipo:          r.tipo  || 'gi',
  };
}
