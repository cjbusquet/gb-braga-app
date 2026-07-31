-- ============================================================
--  Patch 13 — RLS Enabled No Policy (graduacoes) + Unindexed FKs
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  1) graduacoes tinha RLS ativado (ALTER TABLE original) mas nunca
--     ganhou nenhuma policy — por omissão isso nega acesso a toda a
--     gente, incluindo staff, exceto o dono da tabela. Nem
--     GraduacaoPage.tsx (admin/professor) nem MinhaEvolucao.tsx
--     (aluno) conseguiriam realmente ler/escrever graduações via API.
--     Nota à parte: MinhaEvolucao.tsx busca TODAS as graduações e
--     filtra no cliente por aluno_id — sem a policy de SELECT abaixo,
--     isso expunha o histórico de graduação de todos os alunos a
--     qualquer aluno autenticado.
--
--  2) 16 foreign keys sem índice a cobri-las (Advisor: "Unindexed
--     foreign keys", Info). Isto obriga a um seq scan sempre que
--     Postgres verifica a FK num DELETE/UPDATE na tabela referenciada
--     (ex.: apagar um aluno teria de fazer table scan a contratos,
--     graduacoes, toc_documentos, pedidos_numerario, etc.), e também
--     torna lentas as próprias policies de RLS que filtram por estas
--     colunas (aluno_id = my_aluno_id() em contratos/graduacoes/
--     toc_documentos/pedidos_numerario não tinha índice nenhum).
-- ============================================================

-- 1) GRADUAÇÕES — policies em falta
CREATE POLICY "Ver graduações" ON graduacoes FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin','professor'));
CREATE POLICY "Registar graduação" ON graduacoes FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','professor'));

-- 2) Índices em falta nas foreign keys
CREATE INDEX IF NOT EXISTS idx_alunos_profile         ON alunos(profile_id);
CREATE INDEX IF NOT EXISTS idx_alunos_aprovado_por     ON alunos(numerario_aprovado_por);
CREATE INDEX IF NOT EXISTS idx_turmas_professor        ON turmas(professor_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_turma        ON inscricoes_turma(turma_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_plano        ON pagamentos(plano_id);
CREATE INDEX IF NOT EXISTS idx_presencas_turma         ON presencas(turma_id);
CREATE INDEX IF NOT EXISTS idx_contratos_aluno         ON contratos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_contratos_plano         ON contratos(plano_id);
CREATE INDEX IF NOT EXISTS idx_graduacoes_aluno        ON graduacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_graduacoes_professor    ON graduacoes(professor_id);
CREATE INDEX IF NOT EXISTS idx_toc_documentos_aluno    ON toc_documentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_toc_documentos_pagamento ON toc_documentos(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numerario_aluno    ON pedidos_numerario(aluno_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numerario_plano    ON pedidos_numerario(plano_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numerario_aprovado ON pedidos_numerario(aprovado_por);
CREATE INDEX IF NOT EXISTS idx_access_logs_user        ON access_logs(user_id);
