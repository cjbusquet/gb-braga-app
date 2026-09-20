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
--
--  Numa BD com dados anteriores a este patch pode já existir mais
--  que um check-in do mesmo aluno na mesma turma no mesmo dia (é
--  exatamente o que esta constraint passa a proibir) — sem isto o
--  CREATE UNIQUE INDEX abaixo falha com "23505: could not create
--  unique index ... is duplicated". Mantém só o check-in mais
--  antigo de cada grupo e remove os duplicados a seguir.
-- ============================================================

DELETE FROM presencas WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY aluno_id, turma_id, data
      ORDER BY created_at, id
    ) AS rn
    FROM presencas
    WHERE turma_id IS NOT NULL AND tipo = 'checkin'
  ) dup
  WHERE dup.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_presencas_aluno_turma_dia
  ON presencas(aluno_id, turma_id, data)
  WHERE turma_id IS NOT NULL AND tipo = 'checkin';
