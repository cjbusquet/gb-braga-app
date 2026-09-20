// Supabase Edge Function — criar-checkout-session
// Dois modos, conforme o body:
//   { planoId }     → Checkout mode:'subscription' — débito automático mensal.
//                     É o caminho normal (matrícula, "ativar débito automático").
//   { pagamentoId } → Checkout mode:'payment' — pagamento único de uma linha
//                     `pagamentos` pendente/vencido (retry de fatura falhada ou
//                     mensalidade legada de aluno sem subscrição).
// O webhook (api/stripe-webhook.ts) reage a checkout.session.completed +
// invoice.paid (subscrição) ou payment_intent.succeeded (one-off).

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    const { planoId, pagamentoId } = body as {
      planoId?: string;
      pagamentoId?: string;
    };
    if (!planoId && !pagamentoId) {
      return json({ error: 'planoId ou pagamentoId é obrigatório' }, 400);
    }

    // ── 1. Identify the caller and their own aluno record ─────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user: callerUser },
    } = await caller.auth.getUser();
    if (!callerUser) return json({ error: 'Não autenticado' }, 401);

    const { data: callerProfile } = await caller
      .from('profiles')
      .select('email')
      .eq('id', callerUser.id)
      .single();
    if (!callerProfile) return json({ error: 'Perfil não encontrado' }, 404);

    // ── 2. Admin client (service role) for the actual reads/writes ────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: aluno } = await admin
      .from('alunos')
      .select('id, nome, email, stripe_customer_id')
      .eq('email', callerProfile.email)
      .single();
    if (!aluno) return json({ error: 'Aluno não encontrado' }, 404);

    // ── 3. Ensure a real Stripe customer exists for this aluno ────────────────
    let stripeCustomerId = aluno.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: aluno.email,
        name: aluno.nome,
        metadata: { aluno_id: aluno.id },
      });
      stripeCustomerId = customer.id;
      await admin
        .from('alunos')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', aluno.id);
    }

    const origin =
      req.headers.get('origin') ||
      Deno.env.get('SITE_URL') ||
      'http://localhost:5173';
    const common = {
      customer: stripeCustomerId,
      success_url: `${origin}/?pago=1`,
      cancel_url: `${origin}/?pago=0`,
    } as const;

    // ── 4a. Subscription checkout ────────────────────────────────────────────
    if (planoId) {
      const { data: plano } = await admin
        .from('planos')
        .select(`id, nome, valor, ${priceColumn}`)
        .eq('id', planoId)
        .single();
      if (!plano) return json({ error: 'Plano não encontrado' }, 404);

      const priceId = (plano as Record<string, string | null>)[priceColumn];
      if (!priceId) {
        return json(
          { error: `Plano "${plano.nome}" ainda não está sincronizado com a Stripe. Corre sync-planos-stripe.` },
          400,
        );
      }

      const session = await stripe.checkout.sessions.create({
        ...common,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata: { aluno_id: aluno.id, plano_id: plano.id } },
      });
      return json({ url: session.url });
    }

    // ── 4b. One-off payment for an existing pagamentos row ───────────────────
    const { data: pagamento } = await admin
      .from('pagamentos')
      .select('id, aluno_id, valor, vencimento, plano_nome, status')
      .eq('id', pagamentoId)
      .single();
    if (!pagamento || pagamento.aluno_id !== aluno.id) {
      return json({ error: 'Pagamento não encontrado' }, 404);
    }
    if (!['pendente', 'vencido'].includes(pagamento.status)) {
      return json({ error: 'Este pagamento já não está pendente' }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(pagamento.valor * 100),
            product_data: {
              name: `${pagamento.plano_nome || 'Mensalidade'} — vencimento ${pagamento.vencimento}`,
            },
          },
          quantity: 1,
        },
      ],
    });
    return json({ url: session.url });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
