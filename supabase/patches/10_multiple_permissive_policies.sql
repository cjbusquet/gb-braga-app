-- ============================================================
--  Patch 10 — Multiple Permissive Policies
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Aviso do Supabase Studio → Advisors, "Multiple Permissive
--  Policies" (Warning), repetido em várias tabelas: sempre que uma
--  tabela tinha um policy "Admin gere X" FOR ALL a par de um policy
--  de ação específica (ex.: "Aluno vê dados" FOR SELECT), essa ação
--  ficava coberta por 2 policies permissivas em simultâneo — o
--  Postgres tem de avaliar AMBAS em cada query, mesmo que uma delas
--  já cubra o caso da outra.
--
--  Fix: um único policy por (tabela, ação). Onde o policy de aluno já
--  incluía a condição de staff (ex.: "Aluno vê dados"), esse fica
--  como o único policy da ação e o "FOR ALL" é substituído por
--  policies específicas para as restantes ações (INSERT/UPDATE/
--  DELETE), sem reintroduzir FOR ALL (que voltaria a sobrepor o
--  SELECT). Em toc_documentos e pedidos_numerario havia SELECTs
--  duplicados/redundantes que foram fundidos ou removidos.
--
--  Não muda quem pode fazer o quê — só como está escrito. Verificado
--  localmente que todos os fluxos (Minha Conta, gestão admin de
--  alunos/turmas/pagamentos/contratos, numerario) continuam a
--  funcionar exatamente como antes.
-- ============================================================

-- PLANOS
DROP POLICY IF EXISTS "Ver planos ativos" ON planos;
DROP POLICY IF EXISTS "Admin gere planos" ON planos;
CREATE POLICY "Ver planos"            ON planos FOR SELECT USING (ativo = true OR (SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin insere planos"   ON planos FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin atualiza planos" ON planos FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga planos"    ON planos FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin'));

-- PROFILES
DROP POLICY IF EXISTS "Admin edita perfis" ON profiles;
DROP POLICY IF EXISTS "Aluno atualiza próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admin insere" ON profiles;
CREATE POLICY "Admin insere perfis" ON profiles FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Atualizar perfil" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()) OR (SELECT auth_role()) IN ('admin','superadmin'))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT auth_role()) IN ('admin','superadmin'));

-- ALUNOS
DROP POLICY IF EXISTS "Admin gere alunos" ON alunos;
DROP POLICY IF EXISTS "Aluno edita os próprios dados" ON alunos;
CREATE POLICY "Atualizar aluno" ON alunos FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT auth_role()) IN ('admin','superadmin','atendimento'))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin apaga alunos" ON alunos FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- TURMAS
DROP POLICY IF EXISTS "Admin gere turmas" ON turmas;
CREATE POLICY "Admin cria turmas"     ON turmas FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin atualiza turmas" ON turmas FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin apaga turmas"    ON turmas FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- INSCRIÇÕES EM TURMA
DROP POLICY IF EXISTS "Admin gere inscrições" ON inscricoes_turma;
CREATE POLICY "Admin cria inscrições"     ON inscricoes_turma FOR INSERT WITH CHECK ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin atualiza inscrições" ON inscricoes_turma FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin apaga inscrições"    ON inscricoes_turma FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin','atendimento'));

-- PAGAMENTOS
DROP POLICY IF EXISTS "Admin gere pagamentos" ON pagamentos;
CREATE POLICY "Admin atualiza pagamentos" ON pagamentos FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga pagamentos"    ON pagamentos FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin'));

-- CONTRATOS
DROP POLICY IF EXISTS "Admin gere contratos" ON contratos;
CREATE POLICY "Admin atualiza contratos" ON contratos FOR UPDATE USING ((SELECT auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga contratos"    ON contratos FOR DELETE USING ((SELECT auth_role()) IN ('admin','superadmin'));

-- TOConline — 2 SELECTs sobrepostos fundidos num só
DROP POLICY IF EXISTS "Admin vê faturas" ON toc_documentos;
DROP POLICY IF EXISTS "Aluno vê as suas faturas" ON toc_documentos;
CREATE POLICY "Ver faturas" ON toc_documentos FOR SELECT USING (aluno_id = (SELECT my_aluno_id()) OR (SELECT auth_role()) IN ('admin','superadmin'));

-- NUMERÁRIO — "Atendimento vê numerario" e o SELECT do FOR ALL eram
-- inteiramente subsumidos por "Aluno vê o próprio pedido de
-- numerario"; UPDATE/DELETE continuam restritos a superadmin.
DROP POLICY IF EXISTS "Superadmin gere numerario" ON pedidos_numerario;
DROP POLICY IF EXISTS "Atendimento vê numerario" ON pedidos_numerario;
CREATE POLICY "Superadmin atualiza numerario" ON pedidos_numerario FOR UPDATE USING ((SELECT auth_role()) = 'superadmin');
CREATE POLICY "Superadmin apaga numerario"   ON pedidos_numerario FOR DELETE USING ((SELECT auth_role()) = 'superadmin');
