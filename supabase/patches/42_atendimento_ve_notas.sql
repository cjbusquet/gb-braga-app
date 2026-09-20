-- ============================================================
--  Patch 42 — Atendimento passa a ver as estatísticas do aluno
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Pedido explícito: atendimento/admin/superadmin devem poder ver as
--  mesmas estatísticas de aluno que o professor vê no perfil (calendário
--  de presenças, notas do professor, lembretes por presença) —
--  admin/superadmin já viam tudo, faltava só atendimento.
--
--  presencas (o calendário) já incluía 'atendimento' na policy de
--  SELECT — só notas_aluno/lembretes_aluno ficavam de fora. Mantém-se
--  só leitura: atendimento passa a VER notas/lembretes já registados,
--  mas continua sem poder criar/apagar (isso fica professor/admin/
--  superadmin, quem já podia gerir graduações/candidatos).
-- ============================================================

DROP POLICY IF EXISTS "Staff de treino vê notas" ON notas_aluno;
CREATE POLICY "Staff de treino vê notas" ON notas_aluno FOR SELECT USING (
  (SELECT private.auth_role()) IN ('professor','admin','superadmin','atendimento')
);

DROP POLICY IF EXISTS "Staff de treino vê lembretes" ON lembretes_aluno;
CREATE POLICY "Staff de treino vê lembretes" ON lembretes_aluno FOR SELECT USING (
  (SELECT private.auth_role()) IN ('professor','admin','superadmin','atendimento')
);
