/**
 * Stripe Webhook Handler — GB Braga
 * Deploy as Vercel Serverless Function (Node.js runtime): /api/stripe-webhook.ts
 * NOTE: the `stripe` package is not Edge-Runtime-compatible (it pulls in Node
 * built-ins internally even with the fetch HTTP client), so this must run on
 * the default Node.js runtime, not `runtime: 'edge'`.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

interface InvoiceResult {
  sucesso: boolean;
  documentoId?: string | number;
  numero?: string;
  error?: string;
}

/**
 * Generates an officially certified FR via AT-certified Billing API (TOConline)
 */
async function emitirFatura(
  pagamentoId: string,
  aluno: { nome: string; email?: string; telefone?: string; nif?: string },
  planoNome: string,
  valor: number,
): Promise<InvoiceResult> {
  const token = process.env.TOCONLINE_ACCESS_TOKEN;
  const baseUrl = process.env.BILLING_API_URL || 'https://api.toconline.pt/v1';

  if (!token) {
    console.error('Missing TOCONLINE_ACCESS_TOKEN');
    return { sucesso: false, error: 'Missing TOCONLINE_ACCESS_TOKEN' };
  }

  try {
    // Call to the Billing API to create the FR
    const response = await fetch(`${baseUrl}/commercial_sales_documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'FR',
        date: new Date().toISOString().split('T')[0],
        customer_name: aluno.nome,
        customer_vat: aluno.nif || '999999990',
        customer_email: aluno.email,
        lines: [
          {
            description: planoNome,
            unit_price: Math.round((valor / 1.23) * 100) / 100,
            vat_rate: 23,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Billing API error:', data);
      return { sucesso: false, error: data.message || 'Billing API error' };
    }

    const salesDocumentId = data.id || data.salesDocumentId;
    const numeroDoc = data.number || data.document_number;

    if (salesDocumentId) {
      // Communicate the document to AT (Autoridade Tributária)
      await communicateWithAT(salesDocumentId);
    }

    // Send the document to the student's email if available
    if (aluno.email && salesDocumentId) {
      await fetch(`${baseUrl}/email/document`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sales_document_id: salesDocumentId,
          to: aluno.email,
        }),
      });
    }

    // Store the document in Supabase
    await supabase.from('toc_documentos').insert({
      numero: numeroDoc,
      tipo: 'FR',
      aluno_nome: aluno.nome,
      plano_nome: planoNome,
      valor_total: valor,
      documento_ext_id: String(salesDocumentId),
      estado: 'emitida_certificada',
      pagamento_id: pagamentoId,
      emitido_em: new Date().toISOString(),
    });

    console.log(`FR emitida: ${numeroDoc} · ${aluno.nome} · €${valor}`);

    return { sucesso: true, numero: numeroDoc, documentoId: salesDocumentId };
  } catch (err) {
    console.error('Erro ao emitir FR:', err);

    await supabase.from('toc_documentos').insert({
      tipo: 'FR',
      aluno_nome: aluno.nome,
      plano_nome: planoNome,
      valor_total: valor,
      estado: 'erro',
      pagamento_id: pagamentoId,
    });

    return { sucesso: false, error: 'Erro ao emitir FR' };
  }
}

// Communicate the document to AT (Autoridade Tributária)
async function communicateWithAT(salesDocumentId: string | number) {
  const token = process.env.TOCONLINE_ACCESS_TOKEN;

  try {
    const res = await fetch(
      'https://api.toconline.pt/api/send_document_at_webservice',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            id: String(salesDocumentId),
            type: 'send_document_at_webservice',
            attributes: {
              communication_code: '',
              communication_message: '',
              communication_status: '',
            },
          },
        }),
      },
    );

    const result = await res.json();

    if (!res.ok) {
      console.warn(`AT Webservice Warning for doc ${salesDocumentId}:`, result);
      return false;
    }

    console.log(`AT Communication successful for doc ${salesDocumentId}`);
    return true;
  } catch (err) {
    console.error(
      `Error communicating document ${salesDocumentId} to AT:`,
      err,
    );
    return false;
  }
}

// Enviar notificação WhatsApp (via Meta Cloud API)
async function notificarWhatsApp(telefone: string, mensagem: string) {
  if (!process.env.META_WHATSAPP_TOKEN) return;
  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${process.env.META_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefone.replace(/\D/g, ''),
          type: 'text',
          text: { body: mensagem },
        }),
      },
    );
  } catch (err) {
    console.error('Erro ao enviar notificação WhatsApp:', err);
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const customerId = pi.customer as string;

      if (!customerId) break;

      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome, email, telefone, plano_nome, whatsapp, nif')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!aluno) {
        console.warn('Aluno não encontrado para customer:', customerId);
        break;
      }

      const { data: pagamento } = await supabase
        .from('pagamentos')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          stripe_payment_id: pi.id,
        })
        .eq('aluno_id', aluno.id)
        .eq('status', 'pendente')
        .order('vencimento')
        .limit(1)
        .select()
        .single();

      if (pagamento) {
        await emitirFatura(
          pagamento.id,
          aluno,
          aluno.plano_nome || '',
          pi.amount / 100,
        );

        const tel = aluno.whatsapp || aluno.telefone;
        if (tel) {
          await notificarWhatsApp(
            tel,
            `Pagamento recebido! €${(pi.amount / 100).toFixed(2)} referente a ${aluno.plano_nome}. Obrigado! OSS! 🥋 — Gracie Barra Braga`,
          );
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const customerId = pi.customer as string;

      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome, telefone, whatsapp')
        .eq('stripe_customer_id', customerId)
        .single();

      if (!aluno) break;

      await supabase
        .from('pagamentos')
        .update({ status: 'vencido' })
        .eq('aluno_id', aluno.id)
        .eq('status', 'pendente');

      const tel = aluno.whatsapp || aluno.telefone;
      if (tel) {
        await notificarWhatsApp(
          tel,
          `Não conseguimos processar o teu pagamento. Por favor atualiza o método de pagamento ou contacta-nos. gbbraga.com · +351 927 773 854`,
        );
      }

      await supabase.from('mensagens').insert({
        para_id: 'admin',
        para_nome: 'Admin GB Braga',
        canal: 'email',
        corpo: `Pagamento falhado: ${aluno.nome}`,
        remetente: 'sistema',
        status: 'enviado',
        enviado_em: new Date().toISOString(),
      });
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;

      if (!priceId) break;

      const { data: plano } = await supabase
        .from('planos')
        .select('id, nome, valor')
        .or(
          `stripe_price_id_live.eq.${priceId},stripe_price_id_test.eq.${priceId}`,
        )
        .single();

      if (!plano) break;

      await supabase
        .from('alunos')
        .update({
          plano_id: plano.id,
          plano_nome: plano.nome,
          stripe_subscription_id: sub.id,
        })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('stripe_customer_id', sub.customer as string)
        .single();

      if (!aluno) break;

      await supabase
        .from('alunos')
        .update({ status: 'inativo' })
        .eq('id', aluno.id);
      await supabase
        .from('contratos')
        .update({ status: 'cancelado', data_fim: new Date().toISOString() })
        .eq('aluno_id', aluno.id)
        .eq('status', 'ativo');

      console.log(`Subscrição cancelada: ${aluno.nome}`);
      break;
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      if ((inv.attempt_count || 0) >= 3) {
        await supabase
          .from('alunos')
          .update({ status: 'suspenso' })
          .eq('stripe_customer_id', inv.customer as string);
        console.log(
          `Aluno suspenso após 3 falhas de pagamento: customer ${inv.customer}`,
        );
      }
      break;
    }

    default:
      console.log(`Evento ignorado: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
