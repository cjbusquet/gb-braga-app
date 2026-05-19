/* eslint-disable @typescript-eslint/no-explicit-any */
// Future production file — not yet imported in the app
// See DEPLOY.md for usage instructions

/**
 * Supabase client — GB Braga
 * 
 * INSTALAÇÃO:
 *   npm install @supabase/supabase-js
 * 
 * CONFIGURAÇÃO:
 *   Substituir SUPABASE_URL e SUPABASE_ANON_KEY pelos valores reais
 *   do teu projeto em: https://supabase.com/dashboard → Project Settings → API
 */

import { createClient } from '@supabase/supabase-js';

// ── Configuração ───────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON || 'sua-anon-key-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ── Tipos de retorno ───────────────────────────────────────────
export type DbAluno = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  whatsapp?: string;
  data_nascimento?: string;
  nif?: string;
  faixa: string;
  grau: number;
  data_matricula: string;
  plano_id?: string;
  plano_nome?: string;
  status: string;
  frequencia: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  metodo_pagamento: string;
  numerario_aprovado: boolean;
  responsavel?: string;
};

// ── ALUNOS ────────────────────────────────────────────────────
export const db = {
  alunos: {
    async listar(filtros?: { status?: string; plano?: string }) {
      let q = supabase.from('alunos').select('*').order('nome');
      if (filtros?.status) q = q.eq('status', filtros.status);
      if (filtros?.plano)  q = q.eq('plano_id', filtros.plano);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbAluno[];
    },

    async buscar(id: string) {
      const { data, error } = await supabase.from('alunos').select('*').eq('id', id).single();
      if (error) throw error;
      return data as DbAluno;
    },

    async criar(aluno: Omit<DbAluno, 'id'>) {
      const { data, error } = await supabase.from('alunos').insert(aluno).select().single();
      if (error) throw error;
      return data as DbAluno;
    },

    async atualizar(id: string, campos: Partial<DbAluno>) {
      const { data, error } = await supabase.from('alunos').update(campos).eq('id', id).select().single();
      if (error) throw error;
      return data as DbAluno;
    },

    async suspender(id: string) {
      return db.alunos.atualizar(id, { status: 'suspenso' });
    },

    async cancelar(id: string) {
      return db.alunos.atualizar(id, { status: 'inativo' });
    },
  },

  pagamentos: {
    async listar(filtros?: { alunoId?: string; status?: string; mes?: string }) {
      let q = supabase.from('pagamentos').select('*').order('vencimento', { ascending: false });
      if (filtros?.alunoId) q = q.eq('aluno_id', filtros.alunoId);
      if (filtros?.status)  q = q.eq('status', filtros.status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async marcarPago(id: string, metodo: string, stripeId?: string) {
      const { data, error } = await supabase.from('pagamentos')
        .update({ status: 'pago', data_pagamento: new Date().toISOString(), metodo, stripe_payment_id: stripeId })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async criarMensalidades(mes: Date) {
      // Gera cobranças para todos os alunos ativos com Stripe
      const alunos = await db.alunos.listar({ status: 'ativo' });
      const { data: planos } = await supabase.from('planos').select('*');
      const inserir = alunos.map(a => {
        const plano = planos?.find(p => p.id === a.plano_id);
        return {
          aluno_id: a.id,
          aluno_nome: a.nome,
          plano_id: a.plano_id,
          plano_nome: a.plano_nome,
          valor: plano?.valor || 0,
          vencimento: new Date(mes.getFullYear(), mes.getMonth(), 5).toISOString().split('T')[0],
          status: 'pendente',
        };
      });
      const { error } = await supabase.from('pagamentos').insert(inserir);
      if (error) throw error;
      return inserir.length;
    },
  },

  presencas: {
    async registar(dados: { alunoId: string; alunoNome: string; turmaId?: string; turmaNome?: string; metodo: string; gpsLat?: number; gpsLng?: number; gpsDist?: number }) {
      const { data, error } = await supabase.from('presencas').insert({
        aluno_id: dados.alunoId,
        aluno_nome: dados.alunoNome,
        turma_id: dados.turmaId,
        turma_nome: dados.turmaNome,
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
        tipo: 'checkin',
        metodo: dados.metodo,
        gps_lat: dados.gpsLat,
        gps_lng: dados.gpsLng,
        gps_dist_m: dados.gpsDist,
      }).select().single();
      if (error) throw error;
      return data;
    },

    async listar(alunoId?: string, dias = 30) {
      let q = supabase.from('presencas').select('*')
        .gte('data', new Date(Date.now() - dias * 86400000).toISOString().split('T')[0])
        .order('data', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async exportarCSV(dataInicio: string, dataFim: string): Promise<string> {
      const { data, error } = await supabase.from('presencas').select('*')
        .gte('data', dataInicio).lte('data', dataFim).order('data');
      if (error) throw error;
      const header = 'Aluno,Turma,Data,Hora,Método';
      const rows = data.map(p => `${p.aluno_nome},${p.turma_nome || ''},${p.data},${p.hora},${p.metodo}`);
      return [header, ...rows].join('\n');
    },
  },

  graduacoes: {
    async registar(dados: {
      alunoId: string; alunoNome: string;
      faixaAnterior: string; grauAnterior: number;
      faixaNova: string; grauNovo: number;
      professorId: string; professorNome: string;
      observacao?: string; notificarWA?: boolean;
    }) {
      const { data, error } = await supabase.from('graduacoes').insert({
        aluno_id: dados.alunoId, aluno_nome: dados.alunoNome,
        faixa_anterior: dados.faixaAnterior, grau_anterior: dados.grauAnterior,
        faixa_nova: dados.faixaNova, grau_novo: dados.grauNovo,
        data: new Date().toISOString().split('T')[0],
        professor_id: dados.professorId, professor_nome: dados.professorNome,
        observacao: dados.observacao, notificado_wa: false,
      }).select().single();
      if (error) throw error;

      // Atualizar faixa do aluno
      await db.alunos.atualizar(dados.alunoId, {
        faixa: dados.faixaNova as any,
        grau: dados.grauNovo,
      });

      return data;
    },

    async historico(alunoId?: string) {
      let q = supabase.from('graduacoes').select('*').order('data', { ascending: false });
      if (alunoId) q = q.eq('aluno_id', alunoId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  },

  contratos: {
    async criar(dados: {
      alunoId: string; alunoNome: string; alunoNif: string;
      planoId: string; planoNome: string; valor: number;
      assinaturaImg: string; aceitaImagem: boolean; aceitaRGPD: boolean;
      encPagamento: string;
    }) {
      const { data, error } = await supabase.from('contratos').insert({
        aluno_id: dados.alunoId, aluno_nome: dados.alunoNome, aluno_nif: dados.alunoNif,
        plano_id: dados.planoId, plano_nome: dados.planoNome, valor: dados.valor,
        assinado: true, data_assinatura: new Date().toISOString(),
        assinatura_img: dados.assinaturaImg,
        aceita_imagem: dados.aceitaImagem, aceita_rgpd: dados.aceitaRGPD, aceita_contrato: true,
        enc_pagamento: dados.encPagamento,
      }).select().single();
      if (error) throw error;
      return data;
    },
  },

  mensagens: {
    async enviar(dados: {
      paraId: string; paraNome: string; canal: string;
      assunto?: string; corpo: string; remetente: string;
      agendadoPara?: string;
    }) {
      const { data, error } = await supabase.from('mensagens').insert({
        para_id: dados.paraId, para_nome: dados.paraNome,
        canal: dados.canal, assunto: dados.assunto, corpo: dados.corpo,
        remetente: dados.remetente, agendado_para: dados.agendadoPara,
        status: dados.agendadoPara ? 'pendente' : 'enviado',
        enviado_em: dados.agendadoPara ? null : new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
  },

  numerario: {
    async submeterPedido(dados: {
      alunoId: string; nomeAluno: string; email: string;
      telefone: string; planoId: string; planoNome: string; valor: number;
    }) {
      const { data, error } = await supabase.from('pedidos_numerario').insert({
        aluno_id: dados.alunoId, nome_aluno: dados.nomeAluno, email: dados.email,
        telefone: dados.telefone, plano_id: dados.planoId, plano_nome: dados.planoNome,
        valor: dados.valor, status: 'pendente',
      }).select().single();
      if (error) throw error;
      return data;
    },

    async aprovar(id: string, adminId: string, nota: string) {
      const { data, error } = await supabase.from('pedidos_numerario').update({
        status: 'aprovado', aprovado_por: adminId,
        aprovado_em: new Date().toISOString(), nota_admin: nota,
      }).eq('id', id).select().single();
      if (error) throw error;
      // Marcar aluno como aprovado para numerário
      const pedido = data;
      if (pedido.aluno_id) {
        await supabase.from('alunos').update({
          numerario_aprovado: true, numerario_aprovado_por: adminId,
          metodo_pagamento: 'numerario',
        }).eq('id', pedido.aluno_id);
        // Marcar matrícula como completa
        await supabase.from('profiles').update({ matricula_completa: true })
          .eq('email', pedido.email);
      }
      return data;
    },

    async rejeitar(id: string, adminId: string, nota: string) {
      const { data, error } = await supabase.from('pedidos_numerario').update({
        status: 'rejeitado', aprovado_por: adminId,
        aprovado_em: new Date().toISOString(), nota_admin: nota,
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async listar(status?: string) {
      let q = supabase.from('pedidos_numerario').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  },

  kpis: {
    async obter() {
      const { data, error } = await supabase.from('v_kpis').select('*').single();
      if (error) throw error;
      return data;
    },
  },

  planos: {
    async listar() {
      const { data, error } = await supabase.from('planos').select('*').eq('ativo', true).order('valor');
      if (error) throw error;
      return data;
    },
    async atualizarStripeId(id: string, stripePriceId: string, modo: 'live' | 'test') {
      const campo = modo === 'live' ? 'stripe_price_id_live' : 'stripe_price_id_test';
      const { error } = await supabase.from('planos').update({ [campo]: stripePriceId }).eq('id', id);
      if (error) throw error;
    },
  },

  turmas: {
    async listar() {
      const { data, error } = await supabase.from('turmas').select('*, inscricoes_turma(count)').eq('ativa', true);
      if (error) throw error;
      return data;
    },
  },

  auth: {
    async login(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async logout() {
      await supabase.auth.signOut();
    },

    async registar(email: string, password: string, nome: string, role: string = 'aluno') {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nome, role } },
      });
      if (error) throw error;
      return data;
    },

    async perfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) return null;
      return data;
    },

    onAuthChange(callback: (user: any) => void) {
      return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user || null);
      });
    },
  },
};

export default db;
