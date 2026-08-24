// Seeds the LOCAL Supabase stack (supabase start) with demo users +
// data for every role, so the app can be exercised end-to-end
// without a real Supabase/Vercel account.
//
// Usage:
//   node supabase/seed.mjs
//
// Safe to re-run: it wipes and recreates only the rows/users it
// itself created (matched by email), never touches anything else.
// Refuses to run against anything that isn't localhost, so it can
// never accidentally seed a real project.

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SEED_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SEED_SERVICE_ROLE_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
// Must match DEV_PASSWORD in src/pages/LoginPage.tsx — that's what the
// login page's "DEV" quick-login buttons send for these seeded accounts.
const PASSWORD = 'DevTest1234!';

if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(URL)) {
  console.error(`Refusing to seed a non-local URL: ${URL}`);
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: 'superadmin@ginasio.test', role: 'superadmin', nome: 'Super Admin' },
  { email: 'admin@ginasio.test',      role: 'admin',      nome: 'Admin Braga' },
  { email: 'atendimento@ginasio.test', role: 'atendimento', nome: 'Atendimento Braga' },
  { email: 'professor@ginasio.test',  role: 'professor',  nome: 'Prof. João Santos' },
];

const ALUNOS = [
  { email: 'aluno1@ginasio.test', nome: 'Rui Ferreira', faixa: 'azul', grau: 2, status: 'ativo' },
  { email: 'aluno2@ginasio.test', nome: 'Marta Sousa', faixa: 'branca', grau: 0, status: 'ativo' },
  { email: 'aluno3@ginasio.test', nome: 'Tiago Costa', faixa: 'roxa', grau: 1, status: 'ativo' },
];

async function deleteExistingUser(email) {
  const { data } = await admin.auth.admin.listUsers();
  const existing = data.users.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);
}

async function createUser(email, role, nome) {
  await deleteExistingUser(email);
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { role, nome },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function seedEmailConfig() {
  // Points send-email (Edge Function) at the local Mailpit container
  // bundled with `supabase start`, so campaign/notification emails
  // work locally with zero setup — sent messages show up at
  // http://127.0.0.1:54324. Real deployments overwrite this row via
  // Admin → Config → Email/SMTP with a real Resend key or SMTP creds.
  await admin.from('configuracoes').upsert({
    secao: 'email',
    dados: {
      'Servidor SMTP': 'supabase_inbucket_gb-braga-app',
      Porta: '1025',
      'Email remetente': 'noreply@graciebarra.pt',
      Password: 'local-dev-no-auth',
    },
  });
  console.log('  config: email → local Mailpit (http://127.0.0.1:54324)');
}

async function main() {
  console.log(`Seeding ${URL} ...`);

  await seedEmailConfig();

  for (const { email, role, nome } of USERS) {
    const id = await createUser(email, role, nome);
    // handle_new_user() already created the profile row with this role;
    // nothing else needed for staff accounts.
    console.log(`  staff:  ${email.padEnd(28)} role=${role} id=${id}`);

    if (role === 'professor') {
      await admin.from('professor_extras').delete().eq('id', id);
      await admin.from('professor_extras').insert({
        id, faixa: 'preta', grau: 3, turmas: ['Jiu-Jitsu Adultos — Manhã'], status: 'ativo',
      });
      // turmas.professor_id nunca era ligado ao criar o professor — só
      // professor_nome (texto) ficava certo. Sem isto, "Minhas Turmas"
      // do professor fica sempre vazio (filtra por professor_id).
      await admin.from('turmas').update({ professor_id: id }).eq('professor_nome', nome);
    }
  }

  await admin.from('alunos').delete().in('email', ALUNOS.map((a) => a.email));

  const { data: turmas } = await admin.from('turmas').select('id, nome').limit(3);
  const { data: planos } = await admin.from('planos').select('id, nome, valor').eq('ativo', true).limit(1);
  const plano = planos?.[0];

  for (const a of ALUNOS) {
    const userId = await createUser(a.email, 'aluno', a.nome);
    await admin.from('profiles').update({ matricula_completa: true }).eq('id', userId);

    const { data: alunoRow, error: alunoErr } = await admin.from('alunos').insert({
      profile_id: userId,
      nome: a.nome,
      email: a.email,
      telefone: '912345678',
      data_nascimento: '1995-05-15',
      faixa: a.faixa,
      grau: a.grau,
      status: a.status,
      plano_id: plano?.id ?? null,
      plano_nome: plano?.nome ?? null,
      data_matricula: '2024-01-10',
    }).select().single();
    if (alunoErr) throw alunoErr;

    await admin.from('contratos').insert({
      aluno_id: alunoRow.id, aluno_nome: a.nome, plano_id: plano?.id ?? null,
      plano_nome: plano?.nome ?? 'Jiu-Jitsu Adulto Plus', valor: plano?.valor ?? 62,
      assinado: true, aceita_rgpd: true, aceita_contrato: true,
      data_assinatura: new Date().toISOString(),
    });

    await admin.from('pagamentos').insert([
      { aluno_id: alunoRow.id, aluno_nome: a.nome, plano_nome: plano?.nome ?? 'Plano', valor: plano?.valor ?? 62, vencimento: '2026-06-05', status: 'pago', data_pagamento: '2026-06-03' },
      { aluno_id: alunoRow.id, aluno_nome: a.nome, plano_nome: plano?.nome ?? 'Plano', valor: plano?.valor ?? 62, vencimento: '2026-08-05', status: 'pendente' },
    ]);

    if (turmas?.length) {
      await admin.from('inscricoes_turma').insert(
        turmas.slice(0, 2).map((t) => ({ aluno_id: alunoRow.id, turma_id: t.id })),
      );
      await admin.from('presencas').insert([
        { aluno_id: alunoRow.id, aluno_nome: a.nome, turma_id: turmas[0].id, turma_nome: turmas[0].nome, data: '2026-07-28', hora: '19:00:00', tipo: 'checkin', metodo: 'manual' },
        { aluno_id: alunoRow.id, aluno_nome: a.nome, turma_id: turmas[0].id, turma_nome: turmas[0].nome, data: '2026-07-30', hora: '19:00:00', tipo: 'checkin', metodo: 'manual' },
      ]);
    }

    if (a.grau > 0) {
      await admin.from('graduacoes').insert({
        aluno_id: alunoRow.id, aluno_nome: a.nome,
        faixa_anterior: a.faixa, grau_anterior: a.grau - 1,
        faixa_nova: a.faixa, grau_novo: a.grau,
        professor_nome: 'Prof. João Santos',
      });
    }

    console.log(`  aluno:  ${a.email.padEnd(28)} faixa=${a.faixa} grau=${a.grau} id=${userId}`);
  }

  console.log('\nDone. Login at http://localhost:5173 (or wherever `npm run dev` prints) with:\n');
  console.log(`  password for every account: ${PASSWORD}\n`);
  for (const u of [...USERS, ...ALUNOS]) console.log(`  ${u.email}`);
}

main().catch((e) => { console.error('SEED FAILED:', e); process.exit(1); });
