/**
 * Stripe Webhook Handler — GB Braga
 * 
 * Deploy como Vercel Edge Function: /api/stripe-webhook.ts
 * URL para configurar no Stripe: https://gbbraga.com/api/stripe-webhook
 * 
 * Eventos a subscrever no Stripe Dashboard:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const supabase  = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// TOConline: emitir fatura automaticamente
async function emitirFaturaAuto(pagamentoId: string, alunoNome: string, planoNome: string, valor: number) {
  const valorSemIVA = Math.round((valor / 1.23) * 100) / 100;
  const iva         = Math.round((valor - valorSemIVA) * 100) / 100;
  
  // Número sequencial
  const ano   = new Date().getFullYear();
  const { count } = await supabase.from('toc_documentos').select('*', { count: 'exact', head: true });
  const numero    = `FR ${ano}/${String((count || 0) + 1).padStart(4, '0')}`;

  await supabase.from('toc_documentos').insert({
    numero,
    tipo: 'FR',
    aluno_nome:    alunoNome,
    plano_nome:    planoNome,
    valor_total:   valor,
    iva_total:     iva,
    valor_sem_iva: valorSemIVA,
    pagamento_id:  pagamentoId,
    estado: 'emitida',
  });

  console.log(`✅ FR emitida: ${numero} · ${alunoNome} · €${valor}`);
  return numero;
}

// Enviar notificação WhatsApp (via Meta Cloud API)
async function notificarWhatsApp(telefone: string, mensagem: string) {
  if (!process.env.META_WHATSAPP_TOKEN) return;
  await fetch(`https://graph.facebook.com/v18.0/${process.env.META_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone.replace(/\D/g, ''),
      type: 'text',
      text: { body: mensagem },
    }),
  });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body      = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe webhook signature inválida:', err);
    return new Response('Webhook signature failed', { status: 400 });
  }

  console.log(`📨 Stripe event: ${event.type}`);

  switch (event.type) {

    // ── Pagamento confirmado ───────────────────────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const customerId = pi.customer as string;
      
      if (!customerId) break;

      // Encontrar aluno pelo stripe_customer_id
      const { data: aluno } = await supabase.from('alunos')
        .select('id, nome, email, telefone, plano_nome, whatsapp')
        .eq('stripe_customer_id', customerId).single();

      if (!aluno) { console.warn('Aluno não encontrado para customer:', customerId); break; }

      // Marcar pagamento como pago
      const { data: pagamento } = await supabase.from('pagamentos')
        .update({ status: 'pago', data_pagamento: new Date().toISOString(), stripe_payment_id: pi.id })
        .eq('aluno_id', aluno.id).eq('status', 'pendente')
        .order('vencimento').limit(1).select().single();

      if (pagamento) {
        // Emitir FR TOConline automaticamente
        await emitirFaturaAuto(pagamento.id, aluno.nome, aluno.plano_nome || '', pi.amount / 100);

        // Notificar aluno via WhatsApp
        const tel = aluno.whatsapp || aluno.telefone;
        if (tel) {
          await notificarWhatsApp(tel,
            `✅ Pagamento recebido! €${(pi.amount/100).toFixed(2)} referente a ${aluno.plano_nome}. Obrigado! OSS! 🥋 — Gracie Barra Braga`
          );
        }
      }
      break;
    }

    // ── Pagamento falhado ─────────────────────────────────────
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const customerId = pi.customer as string;
      
      const { data: aluno } = await supabase.from('alunos')
        .select('id, nome, telefone, whatsapp').eq('stripe_customer_id', customerId).single();
      
      if (!aluno) break;

      // Marcar como vencido
      await supabase.from('pagamentos')
        .update({ status: 'vencido' })
        .eq('aluno_id', aluno.id).eq('status', 'pendente');

      // Notificar aluno
      const tel = aluno.whatsapp || aluno.telefone;
      if (tel) {
        await notificarWhatsApp(tel,
          `⚠️ Não conseguimos processar o teu pagamento. Por favor atualiza o método de pagamento ou contacta-nos. gbbraga.com · +351 927 773 854`
        );
      }

      // Notificar admin por email (log)
      await supabase.from('mensagens').insert({
        para_id: 'admin', para_nome: 'Admin GB Braga',
        canal: 'email', corpo: `Pagamento falhado: ${aluno.nome}`,
        remetente: 'sistema', status: 'enviado', enviado_em: new Date().toISOString(),
      });
      break;
    }

    // ── Subscrição atualizada ─────────────────────────────────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      
      if (!priceId) break;

      // Encontrar plano pelo stripe_price_id
      const { data: plano } = await supabase.from('planos')
        .select('id, nome, valor')
        .or(`stripe_price_id_live.eq.${priceId},stripe_price_id_test.eq.${priceId}`)
        .single();

      if (!plano) break;

      // Atualizar aluno
      await supabase.from('alunos')
        .update({ plano_id: plano.id, plano_nome: plano.nome, stripe_subscription_id: sub.id })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    // ── Subscrição cancelada ──────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      
      const { data: aluno } = await supabase.from('alunos')
        .select('id, nome').eq('stripe_customer_id', sub.customer as string).single();
      
      if (!aluno) break;

      await supabase.from('alunos').update({ status: 'inativo' }).eq('id', aluno.id);
      await supabase.from('contratos').update({ status: 'cancelado', data_fim: new Date().toISOString() }).eq('aluno_id', aluno.id).eq('status', 'ativo');
      
      console.log(`🔴 Subscrição cancelada: ${aluno.nome}`);
      break;
    }

    // ── Fatura falhada (3 tentativas) ─────────────────────────
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      if ((inv.attempt_count || 0) >= 3) {
        // Suspender aluno após 3 falhas
        await supabase.from('alunos')
          .update({ status: 'suspenso' })
          .eq('stripe_customer_id', inv.customer as string);
        console.log(`⛔ Aluno suspenso após 3 falhas de pagamento: customer ${inv.customer}`);
      }
      break;
    }

    default:
      console.log(`ℹ️ Evento ignorado: ${event.type}`);
  }

  return new Response('OK', { status: 200 });
}
