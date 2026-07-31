-- ============================================================
--  Patch 22 — Professor pode criar aluno (e responsável, se menor)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  "Erro ao criar aluno" / 42501 "new row violates row-level
--  security policy for table alunos": o botão "+ Nova Matrícula" em
--  AlunosPage.tsx já é acessível a professor (rota 'alunos' inclui
--  professor), e chama db.criarAluno() → INSERT direto em alunos,
--  mas "Aluno auto-registo" só permitia admin/superadmin/atendimento
--  para além do próprio aluno.
--
--  O mesmo fluxo (NovaMatriculaModal.tsx) cria e vincula um
--  responsável a seguir quando o novo aluno é menor — sem incluir
--  professor também nas policies de responsaveis/aluno_responsaveis,
--  esse segundo passo falharia com o mesmo tipo de erro assim que o
--  primeiro fosse corrigido.
-- ============================================================

DROP POLICY IF EXISTS "Aluno auto-registo" ON alunos;
CREATE POLICY "Aluno auto-registo" ON alunos FOR INSERT WITH CHECK (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
);

DROP POLICY IF EXISTS "Staff insere responsaveis" ON responsaveis;
CREATE POLICY "Staff insere responsaveis" ON responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));

DROP POLICY IF EXISTS "Staff vincula responsavel" ON aluno_responsaveis;
CREATE POLICY "Staff vincula responsavel" ON aluno_responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
