-- ============================================================
--  Patch 17 — Corrigir check-in (aluno e professor)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug 1: professor_checkins nunca foi criada. useProfessorCheckins,
--  registrarProfessorCheckin e concluirCheckinProfessor (useData.ts)
--  já a referenciavam — todas as chamadas falhavam com "relation
--  professor_checkins does not exist" (visível na consola como
--  "[professor_checkins:<id>] Supabase error: [object Object]" —
--  ver também o fix de logging abaixo, que é o que estava a esconder
--  a mensagem real por trás de "[object Object]").
--
--  Bug 2 (o bloqueio real do self-checkin como aluno): a policy de
--  INSERT em presencas só permitia admin/superadmin/professor/
--  atendimento. MeuCheckin.tsx faz este INSERT como o próprio aluno
--  — sem 'aluno' na condição, a RLS bloqueava sempre, silenciosamente
--  (a UI só mostrava um erro genérico).
-- ============================================================

CREATE TABLE IF NOT EXISTS professor_checkins (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome TEXT NOT NULL,
  turma_id       UUID REFERENCES turmas(id) ON DELETE SET NULL,
  turma_nome     TEXT,
  data           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio    TIME NOT NULL DEFAULT CURRENT_TIME,
  hora_fim       TIME,
  status         TEXT NOT NULL DEFAULT 'ativa',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professor_checkins_professor ON professor_checkins(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_checkins_turma     ON professor_checkins(turma_id);

ALTER TABLE professor_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver checkins de professor" ON professor_checkins FOR SELECT USING (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Professor regista checkin" ON professor_checkins FOR INSERT WITH CHECK (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Professor conclui checkin" ON professor_checkins FOR UPDATE USING (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);

DROP POLICY IF EXISTS "Registar presença" ON presencas;
CREATE POLICY "Registar presença" ON presencas FOR INSERT WITH CHECK (
  aluno_id = (SELECT private.my_aluno_id())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento')
);
