// Supabase Edge Function — sync-planos-stripe
// Para cada plano `ativo` sem Price recorrente na Stripe (no modo atual),
// cria o Product + um Price mensal em EUR e grava os ids de volta em `planos`.
// Idempotente: planos que já têm price id são ignorados. Admin/superadmin apenas.
// Correr uma vez por ambiente (test e live têm ids distintos).

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
    // ── Verify caller is admin/superadmin ────────────────────────────────────
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
      .select('role')
      .eq('id', callerUser.id)
      .single();
    if (!['admin', 'superadmin'].includes(callerProfile?.role ?? '')) {
      return json({ error: 'Acesso restrito a administradores' }, 403);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: planos, error } = await admin
      .from('planos')
      .select(`id, nome, valor, stripe_product_id, ${priceColumn}`)
      .eq('ativo', true);
    if (error) return json({ error: error.message }, 500);

    const results: { plano: string; priceId?: string; skipped?: boolean; error?: string }[] = [];

    for (const p of planos ?? []) {
      const row = p as Record<string, string | number | null>;
      if (row[priceColumn]) {
        results.push({ plano: String(row.nome), skipped: true });
        continue;
      }
      try {
        let productId = row.stripe_product_id as string | null;
        if (!productId) {
          const product = await stripe.products.create({
            name: `Mensalidade — ${row.nome}`,
            metadata: { plano_id: String(row.id) },
          });
          productId = product.id;
        }
        const price = await stripe.prices.create({
          product: productId,
          currency: 'eur',
          unit_amount: Math.round(Number(row.valor) * 100),
          recurring: { interval: 'month' },
          metadata: { plano_id: String(row.id) },
        });
        await admin
          .from('planos')
          .update({ stripe_product_id: productId, [priceColumn]: price.id })
          .eq('id', row.id);
        results.push({ plano: String(row.nome), priceId: price.id });
      } catch (e) {
        results.push({ plano: String(row.nome), error: String(e) });
      }
    }

    return json({ mode: priceColumn, results });
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
