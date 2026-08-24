-- ============================================================
--  Patch 29 — Remover inscrições em turma
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  inscricoes_turma nunca foi realmente usada: nenhuma RPC/trigger
--  lê a tabela, o fluxo de matrícula nunca escreve lá, e as duas
--  leituras que existiam no frontend (roster/ocupação em
--  TurmasPage.tsx via aluno.turmaId) já estavam silenciosamente
--  partidas — mapAluno() nunca preenchia turmaId, por isso a app
--  já mostrava sempre "0 alunos"/0% de ocupação.
--
--  A relação aluno↔turma passa a ser inferida só pelo histórico
--  real de presenças em aulas (ver useAlunosDaTurmaQuery/
--  useTurmasDoAlunoQuery em src/hooks/useAulas.ts) — não por uma
--  "inscrição" estática que nunca refletiu a realidade.
-- ============================================================

DROP TABLE IF EXISTS inscricoes_turma CASCADE;
