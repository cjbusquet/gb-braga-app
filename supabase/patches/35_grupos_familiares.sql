-- ============================================================
--  Patch 35 — Grupos familiares (planos "Família N membros")
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Um plano família = uma subscrição Stripe, no nome do
--  responsável de pagamentos (titular), que cobre N praticantes.
--  Cada praticante tem a sua conta (auth + alunos) ligada ao
--  grupo por `grupo_familiar_id`. O webhook propaga o estado da
--  subscrição a todos os membros do grupo.
--
--  O titular pode:
--   - treinar  → tem linha `alunos` (com grupo_familiar_id)
--   - só pagar → role 'encarregado', sem linha `alunos`
-- ============================================================

-- ── role 'encarregado' (titular que não treina) ─────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'encarregado';

-- ── nº de praticantes por plano (1 = individual) ────────────
ALTER TABLE planos ADD COLUMN IF NOT EXISTS membros INT NOT NULL DEFAULT 1;
UPDATE planos SET membros = 2 WHERE id IN ('pl-familia-2','pl-familia-2-fund');
UPDATE planos SET membros = 3 WHERE id IN ('pl-familia-3','pl-familia-3-kids','pl-familia-3-fund');
UPDATE planos SET membros = 4 WHERE id IN ('pl-familia-4','pl-familia-4-fund');

-- ── grupos_familiares ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS grupos_familiares (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plano_id               TEXT REFERENCES planos(id) ON DELETE SET NULL,
  plano_nome             TEXT,
  titular_nome           TEXT NOT NULL,
  titular_email          TEXT NOT NULL,            -- email base, sem +N
  titular_nif            TEXT,
  titular_treina         BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status                 aluno_status NOT NULL DEFAULT 'inativo',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grupos_familiares_titular  ON grupos_familiares(lower(titular_email));
CREATE INDEX IF NOT EXISTS idx_grupos_familiares_customer ON grupos_familiares(stripe_customer_id);

ALTER TABLE alunos ADD COLUMN IF NOT EXISTS grupo_familiar_id UUID REFERENCES grupos_familiares(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_grupo_familiar ON alunos(grupo_familiar_id);

-- ── pagamentos: pode pertencer a um grupo (sem aluno_id) ────
ALTER TABLE pagamentos ALTER COLUMN aluno_id DROP NOT NULL;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS grupo_familiar_id UUID REFERENCES grupos_familiares(id) ON DELETE SET NULL;
ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamento_tem_alvo;
ALTER TABLE pagamentos ADD CONSTRAINT pagamento_tem_alvo
  CHECK (aluno_id IS NOT NULL OR grupo_familiar_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_pagamentos_grupo ON pagamentos(grupo_familiar_id);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE grupos_familiares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver grupo familiar" ON grupos_familiares;
CREATE POLICY "Ver grupo familiar" ON grupos_familiares FOR SELECT USING (
  lower(titular_email) = lower((SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR id IN (SELECT grupo_familiar_id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
);
DROP POLICY IF EXISTS "Admin gere grupo familiar" ON grupos_familiares;
CREATE POLICY "Admin gere grupo familiar" ON grupos_familiares FOR ALL
  USING ((SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
-- INSERT/UPDATE normais são feitos pela edge function / webhook (service_role,
-- ignora RLS). Alunos só leem.

-- Aluno vê o próprio pagamento de grupo
DROP POLICY IF EXISTS "Aluno vê pagamentos grupo" ON pagamentos;
CREATE POLICY "Aluno vê pagamentos grupo" ON pagamentos FOR SELECT USING (
  grupo_familiar_id IN (
    SELECT id FROM grupos_familiares
    WHERE lower(titular_email) = lower((SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
       OR id IN (SELECT grupo_familiar_id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  )
);
