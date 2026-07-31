-- ============================================================
--  Patch 18 — Missing tables found during functional sweep
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  A frontend query/mutation sweep found 4 tables + 1 storage bucket
--  referenced by useData.ts/hooks but never created:
--    - templates_mensagem (ComunicacaoPage.tsx)
--    - configuracoes (useModulos.tsx module toggles, useConfiguracoes.ts)
--    - responsaveis + aluno_responsaveis (AlunosPage.tsx guardians for minors)
--    - professores — implemented as a read-only VIEW over profiles +
--      a new professor_extras table, instead of duplicating
--      nome/email/telefone (Single Source of Truth rule)
--    - storage bucket "avatars" (useUploadAvatar in useProfile.ts)
--
--  familias/familia_membros is also referenced (useFamiliaAluno) but
--  has ZERO callers anywhere in src/pages — dead code, not fixed here.
-- ============================================================

CREATE TABLE IF NOT EXISTS templates_mensagem (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  canal      msg_canal NOT NULL,
  assunto    TEXT,
  corpo      TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes (
  secao      TEXT PRIMARY KEY,
  dados      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS responsaveis (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  email      TEXT,
  telefone   TEXT,
  nif        TEXT,
  aluno_id   UUID REFERENCES alunos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aluno_responsaveis (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id             UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  responsavel_id       UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  tipo_relacao         TEXT NOT NULL DEFAULT 'outro',
  pode_checkin         BOOLEAN NOT NULL DEFAULT TRUE,
  e_titular_financeiro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_aluno             ON responsaveis(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_responsaveis_aluno       ON aluno_responsaveis(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_responsaveis_responsavel ON aluno_responsaveis(responsavel_id);

CREATE TABLE IF NOT EXISTS professor_extras (
  id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  faixa         belt_type NOT NULL DEFAULT 'preta',
  grau          SMALLINT NOT NULL DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
  turmas        TEXT[] NOT NULL DEFAULT '{}',
  data_admissao DATE,
  status        TEXT NOT NULL DEFAULT 'ativo',
  foto          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW professores WITH (security_invoker = true) AS
SELECT
  p.id, p.nome, p.email, p.telefone,
  COALESCE(pe.faixa, 'preta')  AS faixa,
  COALESCE(pe.grau, 0)         AS grau,
  COALESCE(pe.turmas, '{}')    AS turmas,
  pe.data_admissao,
  COALESCE(pe.status, 'ativo') AS status,
  pe.foto
FROM profiles p
LEFT JOIN professor_extras pe ON pe.id = p.id
WHERE p.role = 'professor';

ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis       ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_extras   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver templates" ON templates_mensagem FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Staff insere templates" ON templates_mensagem FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Staff apaga templates" ON templates_mensagem FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

CREATE POLICY "Ver configuracoes" ON configuracoes FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Admin insere configuracoes" ON configuracoes FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin atualiza configuracoes" ON configuracoes FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

CREATE POLICY "Ver responsaveis" ON responsaveis FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Staff insere responsaveis" ON responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

CREATE POLICY "Ver vinculos responsaveis" ON aluno_responsaveis FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Staff vincula responsavel" ON aluno_responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Staff desvincula responsavel" ON aluno_responsaveis FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

CREATE POLICY "Ver professor_extras" ON professor_extras FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

ALTER PUBLICATION supabase_realtime ADD TABLE configuracoes;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatares são publicamente legíveis" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Utilizador faz upload do próprio avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Utilizador substitui o próprio avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);
