-- ============================================================
--  Patch 03 — Menores, Responsáveis e Famílias
--  Aplicar em: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── RESPONSÁVEIS ─────────────────────────────────────────────
-- Pessoas responsáveis por alunos menores.
-- aluno_id é preenchido quando o responsável também treina na academia.
CREATE TABLE IF NOT EXISTS responsaveis (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  email      TEXT,
  telefone   TEXT,
  nif        TEXT,
  aluno_id   UUID REFERENCES alunos(id) ON DELETE SET NULL,
  qr_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_aluno ON responsaveis(aluno_id);

-- ── ALUNO_RESPONSÁVEIS ────────────────────────────────────────
-- N:N — um menor pode ter vários responsáveis (pai, mãe, tutor).
-- Cada ligação tem permissões independentes.
CREATE TABLE IF NOT EXISTS aluno_responsaveis (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id             UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  responsavel_id       UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  tipo_relacao         TEXT NOT NULL DEFAULT 'responsavel'
                         CHECK (tipo_relacao IN ('pai','mae','avo','tutor','outro')),
  pode_checkin         BOOLEAN NOT NULL DEFAULT TRUE,
  e_titular_financeiro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (aluno_id, responsavel_id)
);

CREATE INDEX IF NOT EXISTS idx_aluno_resp_aluno ON aluno_responsaveis(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_resp_resp  ON aluno_responsaveis(responsavel_id);

-- ── FAMÍLIAS ──────────────────────────────────────────────────
-- Grupo de alunos com plano família — emite uma única fatura.
CREATE TABLE IF NOT EXISTS familias (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                   TEXT NOT NULL,
  titular_responsavel_id UUID REFERENCES responsaveis(id) ON DELETE SET NULL,
  plano_familia          TEXT REFERENCES planos(id) ON DELETE SET NULL,
  valor_total            NUMERIC(8,2),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FAMÍLIA_MEMBROS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS familia_membros (
  familia_id UUID NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
  aluno_id   UUID NOT NULL REFERENCES alunos(id)   ON DELETE CASCADE,
  tipo       TEXT NOT NULL DEFAULT 'membro'
               CHECK (tipo IN ('titular_adulto','membro','dependente')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (familia_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_familia_membros_aluno ON familia_membros(aluno_id);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE responsaveis       ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE familias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE familia_membros    ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "auth_responsaveis" ON responsaveis
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_aluno_responsaveis" ON aluno_responsaveis
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_familias" ON familias
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_familia_membros" ON familia_membros
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
