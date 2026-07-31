-- ============================================================
--  Patch 06 — RLS em falta em planos, turmas, inscricoes_turma,
--  access_logs
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: 4 tabelas em public nunca tiveram RLS ativado (Supabase
--  Studio → Advisors reporta isto como "RLS Disabled in Public",
--  severidade Critical). Com RLS desligado, qualquer detentor da
--  anon key (exposta no bundle do frontend) consegue ler e escrever
--  diretamente nestas tabelas via REST API, ignorando toda a app.
-- ============================================================

ALTER TABLE planos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_turma ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs      ENABLE ROW LEVEL SECURITY;

-- PLANOS — a página pública de matrícula (MatriculaPublica.tsx) lê
-- planos ativos antes de o visitante ter sessão, por isso o SELECT
-- tem de funcionar também para anon.
CREATE POLICY "Ver planos ativos" ON planos FOR SELECT USING (ativo = true OR auth_role() IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin gere planos" ON planos FOR ALL    USING (auth_role() IN ('admin','superadmin'));

-- TURMAS — qualquer utilizador autenticado (aluno/professor/staff)
-- pode ver o horário; só staff cria/edita/apaga (TurmasPage.tsx).
CREATE POLICY "Ver turmas" ON turmas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gere turmas" ON turmas FOR ALL USING (auth_role() IN ('admin','superadmin','atendimento'));

-- INSCRIÇÕES EM TURMA — aluno vê a própria inscrição; staff/professor
-- gerem tudo.
CREATE POLICY "Aluno vê a própria inscrição" ON inscricoes_turma FOR SELECT USING (aluno_id = my_aluno_id() OR auth_role() IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Admin gere inscrições" ON inscricoes_turma FOR ALL USING (auth_role() IN ('admin','superadmin','atendimento'));

-- ACCESS_LOGS — ninguém no frontend lê ou escreve esta tabela hoje;
-- presume-se escrita futura via backend/service role (que ignora
-- RLS). Por isso só existe policy de SELECT para staff — sem
-- INSERT/UPDATE/DELETE para nenhum papel de cliente.
CREATE POLICY "Admin vê access_logs" ON access_logs FOR SELECT USING (auth_role() IN ('admin','superadmin'));
