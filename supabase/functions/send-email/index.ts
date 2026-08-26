// Supabase Edge Function — send-email
//
// Sends a transactional/campaign email to a segment of alunos via
// Resend (recommended, avoids SPF/DKIM headaches) or a generic SMTP
// server. Credentials are NOT environment variables — they live in
// the `configuracoes` table (secao='email'), set via Admin →
// Config → Email/SMTP, so the same deployed function works in any
// environment without redeploying: just change the row in the DB.
//
// Called by src/services/api/edgeFunctions.ts's sendEmail() from
// ComunicacaoPage.tsx.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Keys are the exact field labels ConfigPage.tsx's SimpleSection uses
// as the `configuracoes.dados` object keys (see fields=[...] for
// secao="email") — not a separate/renamed schema.
interface EmailConfig {
  'Servidor SMTP'?: string;
  Porta?: string;
  'Email remetente'?: string;
  Password?: string;
}

interface Recipient {
  email: string;
  nome: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { dest, assunto, corpo } = await req.json();
    if (!dest || !corpo) {
      return json({ error: 'dest e corpo são obrigatórios' }, 400);
    }

    // ── 1. Verify the caller is staff (matches ComunicacaoPage's page role) ──
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: callerUser } } = await caller.auth.getUser();
    if (!callerUser) return json({ error: 'Não autenticado' }, 401);

    const { data: callerProfile } = await caller
      .from('profiles').select('role').eq('id', callerUser.id).single();
    if (!['admin', 'superadmin', 'atendimento'].includes(callerProfile?.role ?? '')) {
      return json({ error: 'Acesso restrito a staff' }, 403);
    }

    // ── 2. Admin client (service role) for config + recipient lookups ───────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: cfgRow } = await admin
      .from('configuracoes').select('dados').eq('secao', 'email').maybeSingle();
    const cfg = (cfgRow?.dados ?? {}) as EmailConfig;
    const fromEmail = cfg['Email remetente'];
    const password = cfg.Password;
    if (!fromEmail || !password) {
      return json({ error: 'Email não configurado. Vai a Admin → Config → Email/SMTP.' }, 400);
    }

    // ── 3. Resolve the "dest" segment into actual recipients ─────────────────
    const recipients = await resolveRecipients(admin, dest);
    if (recipients.length === 0) {
      return json({ sent: 0, total: 0, errors: ['Nenhum destinatário encontrado para este segmento.'] });
    }

    // ── 4. Send — Resend if the "password" is a Resend API key (re_...),
    //       generic SMTP otherwise ──────────────────────────────────────────
    const isResend = password.startsWith('re_');
    const html = `<p>${escapeHtml(corpo).replace(/\n/g, '<br/>')}</p>`;
    const subject = assunto || 'Gracie Barra Braga';

    let sent = 0;
    const errors: string[] = [];

    if (isResend) {
      for (const r of recipients) {
        try {
          await sendViaResend({ apiKey: password, from: fromEmail, to: r.email, subject, html });
          sent++;
        } catch (e) {
          errors.push(`${r.email}: ${String(e)}`);
        }
      }
    } else {
      const hostname = cfg['Servidor SMTP'] || 'localhost';
      // Only the local Mailpit target (used for dev testing, no real
      // TLS cert) needs this: denomailer refuses to send AUTH over a
      // plaintext connection by default. Real prod SMTP servers use
      // port 465 (tls) or 587 (STARTTLS), so this never weakens an
      // actual production credential in transit.
      const isLocalDev = /localhost|127\.0\.0\.1|supabase_inbucket|mailpit/i.test(hostname);
      const client = new SMTPClient({
        connection: {
          hostname,
          port: parseInt(cfg.Porta || '587', 10),
          tls: parseInt(cfg.Porta || '587', 10) === 465,
          // Mailpit (local dev) doesn't implement SMTP AUTH at all —
          // sending it returns "502 Command not implemented". Real
          // prod SMTP servers require it.
          ...(isLocalDev ? {} : { auth: { username: fromEmail, password } }),
        },
        debug: isLocalDev ? { allowUnsecure: true } : undefined,
      });
      for (const r of recipients) {
        try {
          await client.send({ from: fromEmail, to: r.email, subject, html, content: corpo });
          sent++;
        } catch (e) {
          errors.push(`${r.email}: ${String(e)}`);
        }
      }
      try {
        await client.close();
      } catch {
        // denomailer throws reading a null internal socket when the
        // connection was never established (e.g. every send above
        // failed) — nothing left to close, safe to ignore.
      }
    }

    return json({ sent, total: recipients.length, errors: errors.length ? errors : undefined });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

async function resolveRecipients(
  admin: ReturnType<typeof createClient>,
  dest: string,
): Promise<Recipient[]> {
  // Specific student by id — anything not matching a known segment keyword.
  const KNOWN_SEGMENTS = ['all', 'inadimplentes', 'aniversariantes', 'faixa_branca', 'kids'];
  if (!KNOWN_SEGMENTS.includes(dest)) {
    const { data } = await admin.from('alunos').select('email, nome').eq('id', dest).maybeSingle();
    return data ? [{ email: data.email, nome: data.nome }] : [];
  }

  if (dest === 'all') {
    const { data } = await admin.from('alunos').select('email, nome').eq('status', 'ativo');
    return data ?? [];
  }

  if (dest === 'faixa_branca') {
    const { data } = await admin.from('alunos').select('email, nome').eq('status', 'ativo').eq('faixa', 'branca');
    return data ?? [];
  }

  if (dest === 'kids') {
    const { data } = await admin.from('alunos').select('email, nome').eq('status', 'ativo').ilike('plano_nome', '%kids%');
    return data ?? [];
  }

  if (dest === 'aniversariantes') {
    const { data } = await admin.from('alunos').select('email, nome, data_nascimento').eq('status', 'ativo');
    const mesAtual = new Date().getMonth();
    return (data ?? []).filter((a) => {
      if (!a.data_nascimento) return false;
      return new Date(a.data_nascimento as string).getMonth() === mesAtual;
    });
  }

  // dest === 'inadimplentes'
  const { data } = await admin
    .from('pagamentos')
    .select('aluno_id, alunos(email, nome)')
    .in('status', ['pendente', 'vencido']);
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const row of data ?? []) {
    const aluno = row.alunos as unknown as { email: string; nome: string } | null;
    if (aluno && !seen.has(aluno.email)) {
      seen.add(aluno.email);
      out.push({ email: aluno.email, nome: aluno.nome });
    }
  }
  return out;
}

async function sendViaResend(opts: { apiKey: string; from: string; to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: opts.from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
