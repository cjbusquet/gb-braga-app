-- ============================================================
--  Patch 20 — Um check-in por turma por dia
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Nada impedia um aluno de fazer check-in várias vezes na mesma
--  turma no mesmo dia — MeuCheckin.tsx nem tinha proteção nenhuma
--  (o botão chegava a convidar a isso: "Fazer check-in novamente").
--  Esta constraint bloqueia duplicados na MESMA turma no mesmo dia,
--  mas não afeta turmas diferentes no mesmo dia (esse continua
--  permitido) nem "treino livre" (turma_id NULL, sem limite).
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_presencas_aluno_turma_dia
  ON presencas(aluno_id, turma_id, data)
  WHERE turma_id IS NOT NULL AND tipo = 'checkin';
