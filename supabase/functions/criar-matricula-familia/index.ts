// Supabase Edge Function — criar-matricula-familia
// Matrícula de um plano família: cria uma conta (auth + alunos) por praticante,
// um `grupos_familiares` com o responsável de pagamentos (titular), e devolve o
// URL de um Checkout de subscrição Stripe que cobre a família toda.
//
// Chamada SEM JWT (o utilizador ainda não tem conta) — ver config.toml
// [functions.criar-matricula-familia] verify_jwt = false. Faz tudo com a
// service role. O grupo fica 'inativo' até o webhook (checkout.session.completed
// / invoice.paid) confirmar o pagamento — e, enquanto não estiver 'ativo', a BD
// não deixa os membros fazer check-in (patch 45, my_aluno_id_com_acesso).
//
// Segurança (patch 45 / revisão out-2026):
//   • limite de pedidos por IP (registar_tentativa);
//   • a conta do responsável é criada por signUp normal — com "Confirm email"
//     ativo no Supabase, só entra quem é dono do email (sem email_confirm
//     forçado, ninguém cria contas confirmadas no email de terceiros);
//   • membros com email próprio idem; membros sem email ficam com o alias
//     +N do responsável, criados POR CONFIRMAR — só o webhook os confirma
//     depois de a família pagar (ninguém entra numa conta +N de terceiros);
//   • emails guardados em minúsculas (como o Supabase Auth os guarda);
//   • se algo falhar a meio, tudo o que foi criado é apagado (sem órfãos);
//   • erros internos não são devolvidos ao browser.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.0.0?target=deno';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
const priceColumn = stripeKey.startsWith('sk_live_')
  ? 'stripe_price_id_live'
  : 'stripe_price_id_test';

const MIN_SENHA = 8;
const LIMITE_POR_HORA = 5;

const BELTS = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta', 'vermelha'];
const normFaixa = (f?: string): string => {
  const first = (f || '').toLowerCase().trim().split(/\s+/)[0];
  return BELTS.includes(first) ? first : 'branca';
};

/** joao@gmail.com + 1 → joao+1@gmail.com */
function plusAddress(email: string, n: number): string {
  const [local, domain] = email.trim().split('@');
  return `${local}+${n}@${domain}`;
}

interface Membro {
  nome: string;
  dataNasc: string; // ISO yyyy-mm-dd
  faixa?: string;
  grau?: number;
  email?: string;
  senha: string;
}
interface Body {
  planoId: string;
  contrato: { assinatura?: string; aceitaImagem?: boolean; aceitaRGPD?: boolean };
  titular: {
    nome: string; email: string; senha: string; nif?: string; telefone?: string;
    morada?: string; codPostal?: string; treina: boolean;
    dataNasc?: string; faixa?: string; grau?: number; // só quando treina
  };
  membros: Membro[];
  encarregado?: { nome?: string; nif?: string; telefone?: string; email?: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const b = (await req.json()) as Body;
    const { planoId, contrato, titular, membros = [], encarregado } = b;
    if (titular?.email) titular.email = titular.email.trim().toLowerCase();
    for (const m of membros) if (m.email) m.email = m.email.trim().toLowerCase();

    if (!planoId || !titular?.email || !titular?.nome) {
      return json({ error: 'planoId, titular.nome e titular.email são obrigatórios' }, 400);
    }
    if (!titular.senha || titular.senha.length < MIN_SENHA) {
      return json({ error: `A password do responsável precisa de pelo menos ${MIN_SENHA} caracteres.` }, 400);
    }
    if (!membros.length || membros.some((m) => !m.nome || !m.dataNasc)) {
      return json({ error: 'Cada membro precisa de nome e data de nascimento' }, 400);
    }
    const membroSemSenha = membros.findIndex((m) => !m.senha || m.senha.length < MIN_SENHA);
    if (membroSemSenha !== -1) {
      return json({ error: `A password do membro ${membroSemSenha + 1} precisa de pelo menos ${MIN_SENHA} caracteres.` }, 400);
    }
    if (membros.length > 6) {
      return json({ error: 'Número de membros inválido.' }, 400);
    }
    if (titular.treina && !titular.dataNasc) {
      return json({ error: 'O responsável treina — indica a data de nascimento dele.' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    // Cliente "público" (anon) só para o signUp do responsável/membros com
    // email próprio — assim o Supabase envia o email de confirmação.
    const publico = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 0. Limite de pedidos por IP ─────────────────────────────────────────
    // IP real: cabeçalhos do proxy primeiro; do X-Forwarded-For a ÚLTIMA
    // entrada (a 1.ª é escrita pelo cliente e pode ser falsificada).
    const ip =
      req.headers.get('cf-connecting-ip')?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      (req.headers.get('x-forwarded-for') || '').split(',').pop()?.trim() ||
      'desconhecido';
    const { data: dentroDoLimite, error: limErr } = await admin.rpc('registar_tentativa', {
      p_chave: `matricula-familia:${ip}`,
      p_max: LIMITE_POR_HORA,
      p_janela_min: 60,
    });
    if (limErr) {
      console.error('registar_tentativa:', limErr.message);
      return json({ error: 'Não foi possível processar a matrícula agora. Tenta mais tarde.' }, 503);
    }
    if (dentroDoLimite !== true) {
      return json({ error: 'Demasiadas tentativas. Tenta novamente daqui a uma hora.' }, 429);
    }

    // ── 1. Plano ────────────────────────────────────────────────────────────
    const { data: plano } = await admin
      .from('planos')
      .select(`id, nome, valor, categoria, membros, ${priceColumn}`)
      .eq('id', planoId)
      .single();
    if (!plano) return json({ error: 'Plano não encontrado' }, 404);
    if (plano.categoria !== 'familia') {
      return json({ error: 'Este plano não é familiar' }, 400);
    }
    const priceId = (plano as Record<string, string | null>)[priceColumn];
    if (!priceId) {
      return json({ error: `Plano "${plano.nome}" não está sincronizado com a Stripe.` }, 400);
    }
    const esperados = plano.membros as number;
    const contam = membros.length + (titular.treina ? 1 : 0);
    if (contam !== esperados) {
      return json({ error: `O plano "${plano.nome}" é para ${esperados} praticantes (indicaste ${contam}).` }, 400);
    }

    // ── 2. Emails livres? (titular + membros com email próprio) ──────────────
    const checarEmail = async (email: string): Promise<boolean> => {
      const { data } = await admin.rpc('email_existe', { e: email });
      return data === true;
    };
    if (await checarEmail(titular.email)) {
      return json({ error: 'Já existe uma conta com o email do responsável.', campo: 'titular' }, 409);
    }
    for (let i = 0; i < membros.length; i++) {
      const e = membros[i].email?.trim();
      if (e && (await checarEmail(e))) {
        return json({ error: `Já existe uma conta com o email do membro ${i + 1}.`, campo: `membro-${i}` }, 409);
      }
    }

    // ── 3. Grupo familiar ───────────────────────────────────────────────────
    // Tudo o que for criado daqui em diante é registado para rollback.
    const criados: Criados = { uids: [], grupoId: null, stripeCustomerId: null };
    try {
      const { data: grupo, error: grpErr } = await admin
        .from('grupos_familiares')
        .insert({
          plano_id: plano.id,
          plano_nome: plano.nome,
          titular_nome: titular.nome,
          titular_email: titular.email.trim(),
          titular_nif: titular.nif || null,
          titular_treina: !!titular.treina,
          status: 'inativo',
        })
        .select('id')
        .single();
      if (grpErr || !grupo) throw new Error(`grupo: ${grpErr?.message}`);
      const grupoId = grupo.id as string;
      criados.grupoId = grupoId;

      const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'http://localhost:5173';
      const menor = (iso: string) => {
        const d = new Date(iso);
        return !Number.isNaN(d.getTime()) && (Date.now() - d.getTime()) / 31557600000 < 18;
      };
      const respFields = (iso: string) =>
        menor(iso) && encarregado?.nome
          ? {
              responsavel: encarregado.nome,
              responsavel_nif: encarregado.nif || null,
              responsavel_email: encarregado.email || null,
              responsavel_tel: encarregado.telefone || null,
            }
          : {};

      // ── 4. Uma conta por praticante (+ titular se treina, ou role encarregado)
      // Todos escolhem a sua password no próprio formulário (mesmo os membros
      // sem email próprio, que ficam com o email +N do titular) — sem isto o
      // fluxo saía para um link de "definir password" por email a meio do
      // caminho até ao pagamento, interrompendo-o.
      const titularEmail = titular.email.trim().toLowerCase();
      const [titLocal, titDominio] = titularEmail.split('@');
      // alias +N da caixa do próprio responsável?
      const eAliasDoTitular = (email: string): boolean => {
        const [local, dominio] = email.trim().toLowerCase().split('@');
        return dominio === titDominio && local.startsWith(`${titLocal}+`);
      };

      const criarConta = async (email: string, nome: string, role: 'aluno' | 'encarregado', senha: string) => {
        let uid: string;
        if (eAliasDoTitular(email)) {
          // Alias +N do responsável: criado por confirmar. O webhook confirma-o
          // quando a família paga (api/stripe-webhook.ts confirmarAliasDoGrupo).
          const { data, error } = await admin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: false,
            user_metadata: { nome },
            app_metadata: { role },
          });
          if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
          uid = data.user.id;
        } else {
          // Email de alguém — tem de o confirmar (signUp normal).
          const { data, error } = await publico.auth.signUp({
            email,
            password: senha,
            options: { data: { nome }, emailRedirectTo: origin },
          });
          if (error || !data.user) throw new Error(`signUp: ${error?.message}`);
          uid = data.user.id;
        }
        criados.uids.push(uid);
        // O papel nunca vem do utilizador (patch 45) — define-o a service role.
        if (role !== 'aluno') {
          const { error: rErr } = await admin.from('profiles').update({ role }).eq('id', uid);
          if (rErr) throw new Error(`role: ${rErr.message}`);
        }
        return uid;
      };

      const inserir = async (tabela: string, linha: Record<string, unknown>) => {
        const { error } = await admin.from(tabela).insert(linha);
        if (error) throw new Error(`${tabela}: ${error.message}`);
      };

      // titular — já com a password escolhida no formulário
      const titularUid = await criarConta(
        titular.email.trim(),
        titular.nome,
        titular.treina ? 'aluno' : 'encarregado',
        titular.senha,
      );
      if (titular.treina) {
        await inserir('alunos', {
          profile_id: titularUid,
          nome: titular.nome,
          email: titular.email.trim(),
          telefone: titular.telefone || null,
          nif: titular.nif || null,
          faixa: normFaixa(titular.faixa),
          grau: Math.max(0, Math.min(4, titular.grau ?? 0)),
          morada: titular.morada || null,
          cod_postal: titular.codPostal || null,
          data_nascimento: titular.dataNasc,
          plano_id: plano.id,
          plano_nome: plano.nome,
          status: 'ativo',
          metodo_pagamento: 'stripe',
          grupo_familiar_id: grupoId,
        });
      }

      // membros
      const emailsMembros: string[] = [];
      for (let i = 0; i < membros.length; i++) {
        const m = membros[i];
        const email = m.email?.trim() || plusAddress(titular.email, i + 1);
        emailsMembros.push(email);
        const uid = await criarConta(email, m.nome, 'aluno', m.senha);
        await inserir('alunos', {
          profile_id: uid,
          nome: m.nome,
          email,
          telefone: null,
          nif: null,
          faixa: normFaixa(m.faixa),
          grau: Math.max(0, Math.min(4, m.grau ?? 0)),
          morada: titular.morada || null,
          cod_postal: titular.codPostal || null,
          data_nascimento: m.dataNasc,
          plano_id: plano.id,
          plano_nome: plano.nome,
          status: 'ativo',
          metodo_pagamento: 'stripe',
          grupo_familiar_id: grupoId,
          ...respFields(m.dataNasc),
        });
      }

      // ── 5. Contratos (um por praticante, mesma assinatura) + matrícula completa
      const { data: alunosGrupo } = await admin
        .from('alunos')
        .select('id, nome, nif')
        .eq('grupo_familiar_id', grupoId);
      for (const a of alunosGrupo ?? []) {
        await inserir('contratos', {
          aluno_id: a.id,
          aluno_nome: a.nome,
          aluno_nif: a.nif || null,
          plano_id: plano.id,
          plano_nome: plano.nome,
          valor: plano.valor,
          assinado: true,
          data_assinatura: new Date().toISOString(),
          assinatura_img: contrato?.assinatura || null,
          aceita_imagem: !!contrato?.aceitaImagem,
          aceita_rgpd: !!contrato?.aceitaRGPD,
          aceita_contrato: true,
          enc_pagamento: 'outro',
        });
      }
      // Todas as contas já têm password própria — sem isto ficavam presas a
      // repetir a matrícula no 1.º login.
      for (const email of [titular.email.trim(), ...emailsMembros]) {
        await admin.from('profiles').update({ matricula_completa: true }).eq('email', email);
      }

      // ── 6. Stripe: customer no titular + Checkout de subscrição ──────────────
      const customer = await stripe.customers.create({
        email: titular.email.trim(),
        name: titular.nome,
        metadata: { grupo_id: grupoId },
      });
      criados.stripeCustomerId = customer.id;
      const { error: custErr } = await admin
        .from('grupos_familiares')
        .update({ stripe_customer_id: customer.id })
        .eq('id', grupoId);
      if (custErr) throw new Error(`stripe_customer_id: ${custErr.message}`);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata: { grupo_id: grupoId } },
        success_url: `${origin}/?pago=1`,
        cancel_url: `${origin}/?pago=0`,
      });

      return json({ url: session.url });
    } catch (err) {
      console.error('criar-matricula-familia falhou, a reverter:', err);
      await reverter(admin, criados);
      return json({ error: 'Não foi possível concluir a matrícula. Nada foi gravado — tenta novamente ou contacta a academia.' }, 500);
    }
  } catch (err) {
    console.error('criar-matricula-familia:', err);
    return json({ error: 'Pedido inválido.' }, 400);
  }
});

// Apaga tudo o que a matrícula criou (alunos/contratos do grupo, contas e o
// grupo). Best-effort: cada passo continua mesmo que o anterior falhe.
interface Criados {
  uids: string[];
  grupoId: string | null;
  stripeCustomerId: string | null;
}

// deno-lint-ignore no-explicit-any
async function reverter(admin: any, criados: Criados): Promise<void> {
  if (criados.stripeCustomerId) {
    try {
      await stripe.customers.del(criados.stripeCustomerId);
    } catch (e) {
      console.error('rollback stripe customer:', e);
    }
  }
  if (criados.grupoId) {
    const { data: alunos } = await admin.from('alunos').select('id').eq('grupo_familiar_id', criados.grupoId);
    const ids = (alunos ?? []).map((a: { id: string }) => a.id);
    if (ids.length) {
      await admin.from('contratos').delete().in('aluno_id', ids);
      await admin.from('alunos').delete().in('id', ids);
    }
  }
  for (const uid of criados.uids) {
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) console.error(`rollback deleteUser ${uid}:`, error.message);
  }
  if (criados.grupoId) {
    await admin.from('grupos_familiares').delete().eq('id', criados.grupoId);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
