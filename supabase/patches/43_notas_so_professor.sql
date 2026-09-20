-- ============================================================
--  Patch 43 — Notas/lembretes do professor: só o professor
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Correção ao patch 42: "cargos superiores" (admin/superadmin/
--  atendimento) só devem ver o CALENDÁRIO de presenças do aluno — as
--  notas privadas e os lembretes são ferramenta de trabalho do
--  professor, não passam a estar abertos a mais ninguém (nem admin/
--  superadmin, que antes já podiam ver e escrever). `presencas` (o
--  calendário) não muda — continua acessível a todo o staff.
-- ============================================================

DROP POLICY IF EXISTS "Staff de treino vê notas" ON notas_aluno;
CREATE POLICY "Só o professor vê notas" ON notas_aluno FOR SELECT USING (
  (SELECT private.auth_role()) = 'professor'
);

DROP POLICY IF EXISTS "Staff de treino escreve notas" ON notas_aluno;
CREATE POLICY "Só o professor escreve notas" ON notas_aluno FOR INSERT WITH CHECK (
  professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor'
);

DROP POLICY IF EXISTS "Autor ou admin edita nota" ON notas_aluno;
CREATE POLICY "Só o autor edita nota" ON notas_aluno FOR UPDATE
  USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  WITH CHECK (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor');

DROP POLICY IF EXISTS "Autor ou admin apaga nota" ON notas_aluno;
CREATE POLICY "Só o autor apaga nota" ON notas_aluno FOR DELETE
  USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor');

DROP POLICY IF EXISTS "Staff de treino vê lembretes" ON lembretes_aluno;
CREATE POLICY "Só o professor vê lembretes" ON lembretes_aluno FOR SELECT USING (
  (SELECT private.auth_role()) = 'professor'
);

DROP POLICY IF EXISTS "Professor cria o próprio lembrete" ON lembretes_aluno;
CREATE POLICY "Só o professor cria lembrete" ON lembretes_aluno FOR INSERT WITH CHECK (
  professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor'
);

DROP POLICY IF EXISTS "Autor ou admin edita lembrete" ON lembretes_aluno;
CREATE POLICY "Só o autor edita lembrete" ON lembretes_aluno FOR UPDATE
  USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  WITH CHECK (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor');

DROP POLICY IF EXISTS "Autor ou admin apaga lembrete" ON lembretes_aluno;
CREATE POLICY "Só o autor apaga lembrete" ON lembretes_aluno FOR DELETE
  USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor');
