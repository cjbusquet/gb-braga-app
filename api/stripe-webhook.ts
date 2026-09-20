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

const hojeDate = (): string => new Date().toISOString().slice(0, 10);
const unixToDate = (secs: number | null | undefined): string | null =>
  typeof secs === 'number' ? new Date(secs * 1000).toISOString().slice(0, 10) : null;

// ── Grupos familiares ────────────────────────────────────────────────────────
// Um plano família = uma subscrição no titular, N praticantes. O `customer` da
// Stripe está em `grupos_familiares`, não em `alunos` — os handlers abaixo
// tentam primeiro o grupo e propagam o estado a todos os membros.
async function grupoPorCustomer(customerId: string) {
  const { data } = await supabase
    .from('grupos_familiares')
    .select('id, plano_id, plano_nome, titular_nome, titular_email, titular_nif')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data;
}
async function aplicarEstadoGrupo(
  grupoId: string,
  status: 'ativo' | 'inativo' | 'suspenso',
  subId?: string,
) {
  await supabase
    .from('grupos_familiares')
    .update({ status, ...(subId ? { stripe_subscription_id: subId } : {}) })
    .eq('id', grupoId);
  await supabase.from('alunos').update({ status }).eq('grupo_familiar_id', grupoId);
}

/**
 * Generates an officially certified FR via AT-certified Billing API (TOConline)
 */
async function emitirFatura(
  pagamentoId: string,
  aluno: { id?: string; nome: string; email?: string; telefone?: string; nif?: string },
  planoNome: string,
  valor: number,
  stripePaymentId?: string,
): Promise<InvoiceResult> {
  const token = process.env.TOCONLINE_ACCESS_TOKEN;
  const baseUrl = process.env.BILLING_API_URL || 'https://api.toconline.pt/v1';

  // valor is gross (VAT included). PT IVA 23% — split for the toc_documentos row.
  const valorSemIva = Math.round((valor / 1.23) * 100) / 100;
  const ivaTotal = Math.round((valor - valorSemIva) * 100) / 100;
  const linhaBase = {
    aluno_id: aluno.id ?? null,
    aluno_nome: aluno.nome,
    plano_nome: planoNome,
    valor_total: valor,
    valor_sem_iva: valorSemIva,
    iva_total: ivaTotal,
    pagamento_id: pagamentoId,
    stripe_payment_id: stripePaymentId ?? null,
  };

  if (!token) {
    console.error('Missing TOCONLINE_ACCESS_TOKEN');
    await supabase.from('toc_documentos').upsert(
      { ...linhaBase, numero: `ERRO-${pagamentoId}`, tipo: 'FR', estado: 'erro' },
      { onConflict: 'numero' },
    );
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
            unit_price: valorSemIva,
            vat_rate: 23,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Billing API error:', data);
      await supabase.from('toc_documentos').upsert(
        { ...linhaBase, numero: `ERRO-${pagamentoId}`, tipo: 'FR', estado: 'erro' },
        { onConflict: 'numero' },
      );
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
    await supabase.from('toc_documentos').upsert(
      {
        ...linhaBase,
        numero: numeroDoc || `FR-${salesDocumentId}`,
        tipo: 'FR',
        data_emissao: new Date().toISOString().split('T')[0],
        estado: aluno.email ? 'enviada' : 'emitida',
      },
      { onConflict: 'numero' },
    );

    console.log(`FR emitida: ${numeroDoc} · ${aluno.nome} · €${valor}`);

    return { sucesso: true, numero: numeroDoc, documentoId: salesDocumentId };
  } catch (err) {
    console.error('Erro ao emitir FR:', err);

    await supabase.from('toc_documentos').upsert(
      { ...linhaBase, numero: `ERRO-${pagamentoId}`, tipo: 'FR', estado: 'erro' },
      { onConflict: 'numero' },
    );

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
    // ── Subscription checkout finished — link + activate the aluno ───────────
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode !== 'subscription' || !s.customer) break;

      const grupo = await grupoPorCustomer(s.customer as string);
      if (grupo) {
        await aplicarEstadoGrupo(grupo.id, 'ativo', s.subscription as string);
        console.log(`Grupo familiar ativado: ${grupo.titular_nome}`);
        break;
      }

      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('stripe_customer_id', s.customer as string)
        .single();
      if (!aluno) {
        console.warn('checkout.session.completed: aluno não encontrado', s.customer);
        break;
      }

      await supabase
        .from('alunos')
        .update({
          stripe_subscription_id: s.subscription as string,
          status: 'ativo',
          metodo_pagamento: 'stripe',
        })
        .eq('id', aluno.id);
      console.log(`Subscrição ativada: ${aluno.nome}`);
      break;
    }

    // ── Monthly (and first) subscription charge succeeded ───────────────────
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      if (!inv.customer) break;

      // Idempotency — Stripe redelivers events
      const { data: existente } = await supabase
        .from('pagamentos')
        .select('id')
        .eq('stripe_invoice_id', inv.id)
        .maybeSingle();
      if (existente) {
        console.log(`invoice.paid ${inv.id} já registado, ignorado`);
        break;
      }

      const valor = inv.amount_paid / 100;
      const piId = typeof inv.payment_intent === 'string' ? inv.payment_intent : null;
      const venc = unixToDate(inv.lines.data[0]?.period?.start) ?? hojeDate();
      // `invoice.subscription` was removed in 2025 API versions → also check
      // `invoice.parent.subscription_details.subscription`.
      const invExtra = inv as unknown as {
        parent?: { subscription_details?: { subscription?: string } };
      };
      const subId =
        (inv.subscription as string | undefined) ||
        invExtra.parent?.subscription_details?.subscription ||
        undefined;

      // ── Plano família ──
      const grupo = await grupoPorCustomer(inv.customer as string);
      if (grupo) {
        const { data: pg } = await supabase
          .from('pagamentos')
          .insert({
            grupo_familiar_id: grupo.id,
            aluno_id: null,
            aluno_nome: grupo.titular_nome,
            plano_id: grupo.plano_id,
            plano_nome: grupo.plano_nome,
            valor,
            vencimento: venc,
            data_pagamento: new Date().toISOString(),
            status: 'pago',
            metodo: 'stripe',
            stripe_payment_id: piId,
            stripe_invoice_id: inv.id,
          })
          .select()
          .single();
        await aplicarEstadoGrupo(grupo.id, 'ativo', subId);
        if (pg) {
          await emitirFatura(
            pg.id,
            { nome: grupo.titular_nome, email: grupo.titular_email, nif: grupo.titular_nif ?? undefined },
            grupo.plano_nome || '',
            valor,
            piId ?? undefined,
          );
        }
        console.log(`Mensalidade família paga: ${grupo.titular_nome} · €${valor}`);
        break;
      }

      // ── Aluno individual ──
      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome, email, telefone, whatsapp, nif, plano_id, plano_nome')
        .eq('stripe_customer_id', inv.customer as string)
        .single();
      if (!aluno) {
        console.warn('invoice.paid: aluno/grupo não encontrado para customer', inv.customer);
        break;
      }

      const { data: pagamento } = await supabase
        .from('pagamentos')
        .insert({
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          plano_id: aluno.plano_id,
          plano_nome: aluno.plano_nome,
          valor,
          vencimento: venc,
          data_pagamento: new Date().toISOString(),
          status: 'pago',
          metodo: 'stripe',
          stripe_payment_id: piId,
          stripe_invoice_id: inv.id,
        })
        .select()
        .single();

      await supabase
        .from('alunos')
        .update({
          status: 'ativo',
          metodo_pagamento: 'stripe',
          ...(subId ? { stripe_subscription_id: subId } : {}),
        })
        .eq('id', aluno.id);

      if (pagamento) {
        await emitirFatura(pagamento.id, aluno, aluno.plano_nome || '', valor, piId ?? undefined);
        const tel = aluno.whatsapp || aluno.telefone;
        if (tel) {
          await notificarWhatsApp(
            tel,
            `Pagamento recebido! €${valor.toFixed(2)} referente a ${aluno.plano_nome}. Obrigado! OSS! 🥋 — Gracie Barra Braga`,
          );
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const customerId = pi.customer as string;

      // Subscription invoices carry an invoice id — handled by invoice.paid.
      if (!customerId || pi.invoice) break;

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
          pi.id,
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

      // Subscription invoices → handled by invoice.payment_failed.
      if (!customerId || pi.invoice) break;

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

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const ativar = event.type === 'customer.subscription.created';

      let planoInfo: { id: string; nome: string } | null = null;
      if (priceId) {
        const { data } = await supabase
          .from('planos')
          .select('id, nome')
          .or(`stripe_price_id_live.eq.${priceId},stripe_price_id_test.eq.${priceId}`)
          .single();
        planoInfo = data;
      }

      const grupo = await grupoPorCustomer(sub.customer as string);
      if (grupo) {
        await supabase
          .from('grupos_familiares')
          .update({
            stripe_subscription_id: sub.id,
            ...(ativar ? { status: 'ativo' } : {}),
            ...(planoInfo ? { plano_id: planoInfo.id, plano_nome: planoInfo.nome } : {}),
          })
          .eq('id', grupo.id);
        if (ativar) {
          await supabase.from('alunos').update({ status: 'ativo' }).eq('grupo_familiar_id', grupo.id);
        }
        if (planoInfo) {
          await supabase
            .from('alunos')
            .update({ plano_id: planoInfo.id, plano_nome: planoInfo.nome })
            .eq('grupo_familiar_id', grupo.id);
        }
        break;
      }

      const patch: Record<string, unknown> = { stripe_subscription_id: sub.id };
      if (ativar) {
        patch.status = 'ativo';
        patch.metodo_pagamento = 'stripe';
      }
      if (planoInfo) {
        patch.plano_id = planoInfo.id;
        patch.plano_nome = planoInfo.nome;
      }
      await supabase
        .from('alunos')
        .update(patch)
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      const grupo = await grupoPorCustomer(sub.customer as string);
      if (grupo) {
        await aplicarEstadoGrupo(grupo.id, 'inativo');
        const { data: membros } = await supabase
          .from('alunos')
          .select('id')
          .eq('grupo_familiar_id', grupo.id);
        const ids = (membros ?? []).map((m) => m.id);
        if (ids.length) {
          await supabase
            .from('contratos')
            .update({ status: 'cancelado', data_fim: new Date().toISOString() })
            .in('aluno_id', ids)
            .eq('status', 'ativo');
        }
        console.log(`Subscrição família cancelada: ${grupo.titular_nome}`);
        break;
      }

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
      if (!inv.customer) break;

      const valorFalha = (inv.amount_due ?? 0) / 100;
      const vencFalha = unixToDate(inv.lines.data[0]?.period?.start) ?? hojeDate();

      // ── Plano família ──
      const grupoF = await grupoPorCustomer(inv.customer as string);
      if (grupoF) {
        const { data: jaReg } = await supabase
          .from('pagamentos')
          .select('id')
          .eq('stripe_invoice_id', inv.id)
          .maybeSingle();
        if (!jaReg) {
          await supabase.from('pagamentos').insert({
            grupo_familiar_id: grupoF.id,
            aluno_id: null,
            aluno_nome: grupoF.titular_nome,
            plano_id: grupoF.plano_id,
            plano_nome: grupoF.plano_nome,
            valor: valorFalha,
            vencimento: vencFalha,
            status: 'vencido',
            metodo: 'stripe',
            stripe_invoice_id: inv.id,
          });
          await supabase.from('mensagens').insert({
            para_id: 'admin',
            para_nome: 'Admin GB Braga',
            canal: 'email',
            corpo: `Mensalidade família falhada: ${grupoF.titular_nome} (€${valorFalha.toFixed(2)})`,
            remetente: 'sistema',
            status: 'enviado',
            enviado_em: new Date().toISOString(),
          });
        }
        if ((inv.attempt_count || 0) >= 3) {
          await aplicarEstadoGrupo(grupoF.id, 'suspenso');
          console.log(`Grupo familiar suspenso após 3 falhas: ${grupoF.titular_nome}`);
        }
        break;
      }

      const { data: aluno } = await supabase
        .from('alunos')
        .select('id, nome, telefone, whatsapp')
        .eq('stripe_customer_id', inv.customer as string)
        .single();
      if (!aluno) break;

      // One 'vencido' row per invoice — record it the first time it fails.
      const { data: existente } = await supabase
        .from('pagamentos')
        .select('id')
        .eq('stripe_invoice_id', inv.id)
        .maybeSingle();

      if (!existente) {
        await supabase.from('pagamentos').insert({
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          valor: (inv.amount_due ?? 0) / 100,
          vencimento: unixToDate(inv.lines.data[0]?.period?.start) ?? hojeDate(),
          status: 'vencido',
          metodo: 'stripe',
          stripe_invoice_id: inv.id,
        });

        const tel = aluno.whatsapp || aluno.telefone;
        if (tel) {
          await notificarWhatsApp(
            tel,
            `Não conseguimos processar a tua mensalidade. Atualiza o cartão em ${
              inv.hosted_invoice_url || 'gbbraga.com'
            } ou fala connosco. — Gracie Barra Braga`,
          );
        }
        await supabase.from('mensagens').insert({
          para_id: 'admin',
          para_nome: 'Admin GB Braga',
          canal: 'email',
          corpo: `Mensalidade falhada: ${aluno.nome} (€${((inv.amount_due ?? 0) / 100).toFixed(2)})`,
          remetente: 'sistema',
          status: 'enviado',
          enviado_em: new Date().toISOString(),
        });
      }

      // Stripe's dunning gave up — suspend access.
      if ((inv.attempt_count || 0) >= 3) {
        await supabase
          .from('alunos')
          .update({ status: 'suspenso' })
          .eq('id', aluno.id);
        console.log(`Aluno suspenso após 3 falhas: ${aluno.nome}`);
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
