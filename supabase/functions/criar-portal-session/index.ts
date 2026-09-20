// Supabase Edge Function — criar-portal-session
// Abre uma sessão do Stripe Customer Portal para o aluno autenticado gerir a
// própria subscrição (mudar cartão, ver faturas, cancelar). O cancelamento
// dispara customer.subscription.deleted, tratado em api/stripe-webhook.ts.
// Requer o Customer Portal ativado no dashboard Stripe (test tem config default).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.0.0?target=deno';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    // Aluno individual com subscrição própria...
    const { data: aluno } = await admin
      .from('alunos')
      .select('stripe_customer_id')
      .eq('email', callerProfile.email)
      .maybeSingle();
    let customerId: string | null = aluno?.stripe_customer_id ?? null;

    // ...ou titular de um grupo familiar (o pagador — pode nem ter linha alunos).
    if (!customerId) {
      const { data: grupo } = await admin
        .from('grupos_familiares')
        .select('stripe_customer_id')
        .ilike('titular_email', callerProfile.email)
        .maybeSingle();
      customerId = grupo?.stripe_customer_id ?? null;
    }

    if (!customerId) {
      return json({ error: 'Sem subscrição ativa para gerir' }, 400);
    }

    const origin =
      req.headers.get('origin') ||
      Deno.env.get('SITE_URL') ||
      'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/?pago=1`,
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
