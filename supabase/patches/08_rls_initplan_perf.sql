-- ============================================================
--  Patch 08 — Auth RLS Initialization Plan (performance)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Aviso do Supabase Studio → Advisors, "Auth RLS Initialization
--  Plan" (Warning), repetido em todas as tabelas: as policies
--  chamavam auth.uid() / auth_role() / my_aluno_id() diretamente,
--  o que o Postgres reavalia LINHA A LINHA durante o scan. Envolver
--  a chamada em "(select ...)" faz o planeador tratá-la como um
--  InitPlan — avaliado uma única vez por query — o que é
--  significativamente mais rápido à escala. Não muda o
--  comportamento de nenhuma policy, só a forma de escrita.
--
--  Este patch faz DROP + CREATE de todas as policies afetadas com a
--  forma otimizada. É idempotente: pode ser corrido mais que uma vez.
-- ============================================================

-- PLANOS
DROP POLICY IF EXISTS "Ver planos ativos" ON planos;
CREATE POLICY "Ver planos ativos" ON planos FOR SELECT USING (ativo = true OR (SELECT auth_role()) IN ('admin','superadmin','atendimento'));
DROP POLICY IF EXISTS "Admin gere planos" ON planos;
CREATE POLICY "Admin gere planos" ON planos FOR ALL    USING ((SELECT auth_role()) IN ('admin','superadmin'));

-- PROFILES
DROP POLICY IF EXISTS "Perfil próprio" ON profiles;
CREATE POLICY "Perfil próprio"     ON profiles FOR SELECT USING (id = (SELECT auth.uid()) OR (SELECT auth_role()) IN ('admin','superadmin','atendimento'));
DROP POLICY IF EXISTS "Admin edita perfis" ON profiles;
CREATE POLICY "Admin edita perfis" ON profiles FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Admin insere" ON profiles;
CREATE POLICY "Admin insere"       ON profiles FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Aluno atualiza próprio perfil" ON profiles;
CREATE POLICY "Aluno atualiza próprio perfil" ON profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()));

-- ALUNOS
DROP POLICY IF EXISTS "Aluno vê dados" ON alunos;
CREATE POLICY "Aluno vê dados"     ON alunos FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT auth_role()) IN ('admin','superadmin','atendimento','professor'));
DROP POLICY IF EXISTS "Admin gere alunos" ON alunos;
CREATE POLICY "Admin gere alunos"  ON alunos FOR ALL    USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));
DROP POLICY IF EXISTS "Aluno edita os próprios dados" ON alunos;
CREATE POLICY "Aluno edita os próprios dados" ON alunos FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "Aluno auto-registo" ON alunos;
CREATE POLICY "Aluno auto-registo" ON alunos
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
    OR (SELECT auth_role()) IN ('admin','superadmin','atendimento')
  );

-- TURMAS
DROP POLICY IF EXISTS "Ver turmas" ON turmas;
CREATE POLICY "Ver turmas" ON turmas FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "Admin gere turmas" ON turmas;
CREATE POLICY "Admin gere turmas" ON turmas FOR ALL USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- INSCRIÇÕES EM TURMA
DROP POLICY IF EXISTS "Aluno vê a própria inscrição" ON inscricoes_turma;
CREATE POLICY "Aluno vê a própria inscrição" ON inscricoes_turma FOR SELECT USING (aluno_id = (SELECT my_aluno_id()) OR (SELECT auth_role()) IN ('admin','superadmin','atendimento','professor'));
DROP POLICY IF EXISTS "Admin gere inscrições" ON inscricoes_turma;
CREATE POLICY "Admin gere inscrições" ON inscricoes_turma FOR ALL USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- PAGAMENTOS
DROP POLICY IF EXISTS "Aluno vê pagamentos" ON pagamentos;
CREATE POLICY "Aluno vê pagamentos"  ON pagamentos FOR SELECT USING (aluno_id = (SELECT my_aluno_id()) OR (SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Admin gere pagamentos" ON pagamentos;
CREATE POLICY "Admin gere pagamentos" ON pagamentos FOR ALL USING ((SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Aluno insere pagamento" ON pagamentos;
CREATE POLICY "Aluno insere pagamento" ON pagamentos
  FOR INSERT
  WITH CHECK (
    aluno_id IN (
      SELECT id FROM alunos
      WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
    )
    OR (SELECT auth_role()) IN ('admin','superadmin')
  );

-- PRESENÇAS
DROP POLICY IF EXISTS "Ver presenças" ON presencas;
CREATE POLICY "Ver presenças"    ON presencas FOR SELECT USING (aluno_id = (SELECT my_aluno_id()) OR (SELECT auth_role()) IN ('admin','superadmin','professor','atendimento'));
DROP POLICY IF EXISTS "Registar presença" ON presencas;
CREATE POLICY "Registar presença" ON presencas FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin','professor','atendimento'));

-- CONTRATOS
DROP POLICY IF EXISTS "Ver contrato" ON contratos;
CREATE POLICY "Ver contrato"     ON contratos FOR SELECT USING (aluno_id = (SELECT my_aluno_id()) OR (SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Admin gere contratos" ON contratos;
CREATE POLICY "Admin gere contratos" ON contratos FOR ALL USING ((SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Aluno insere contrato" ON contratos;
CREATE POLICY "Aluno insere contrato" ON contratos
  FOR INSERT
  WITH CHECK (
    aluno_id IN (
      SELECT id FROM alunos
      WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
    )
    OR (SELECT auth_role()) IN ('admin','superadmin')
  );

-- TOConline
DROP POLICY IF EXISTS "Admin vê faturas" ON toc_documentos;
CREATE POLICY "Admin vê faturas" ON toc_documentos FOR SELECT USING ((SELECT auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Aluno vê as suas faturas" ON toc_documentos;
CREATE POLICY "Aluno vê as suas faturas" ON toc_documentos FOR SELECT USING (aluno_id = (SELECT my_aluno_id()));

-- NUMERÁRIO
DROP POLICY IF EXISTS "Superadmin gere numerario" ON pedidos_numerario;
CREATE POLICY "Superadmin gere numerario" ON pedidos_numerario FOR ALL USING ((SELECT auth_role()) = 'superadmin');
DROP POLICY IF EXISTS "Atendimento vê numerario" ON pedidos_numerario;
CREATE POLICY "Atendimento vê numerario"  ON pedidos_numerario FOR SELECT USING ((SELECT auth_role()) IN ('admin','atendimento'));
DROP POLICY IF EXISTS "Aluno vê o próprio pedido de numerario" ON pedidos_numerario;
CREATE POLICY "Aluno vê o próprio pedido de numerario" ON pedidos_numerario FOR SELECT USING (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT auth_role()) IN ('admin','superadmin','atendimento')
);
DROP POLICY IF EXISTS "Aluno submete numerario" ON pedidos_numerario;
CREATE POLICY "Aluno submete numerario" ON pedidos_numerario
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
    OR (SELECT auth_role()) IN ('admin','superadmin','atendimento')
  );

-- MENSAGENS
DROP POLICY IF EXISTS "Admin gere mensagens" ON mensagens;
CREATE POLICY "Admin gere mensagens" ON mensagens FOR ALL USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- ACCESS_LOGS
DROP POLICY IF EXISTS "Admin vê access_logs" ON access_logs;
CREATE POLICY "Admin vê access_logs" ON access_logs FOR SELECT USING ((SELECT auth_role()) IN ('admin','superadmin'));
