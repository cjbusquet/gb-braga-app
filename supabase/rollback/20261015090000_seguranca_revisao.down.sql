-- ============================================================
--  ROLLBACK PARCIAL da migração 20261015090000_seguranca_revisao
--
--  Usar SÓ se, logo a seguir à aplicação, os alunos ficarem sem conseguir
--  fazer check-in ou matrícula. Reverte apenas as regras que mexem com o
--  funcionamento do dia a dia:
--    • check-in volta a não verificar o pagamento na BD;
--    • auto-registo/professor voltam a gravar os campos de pagamento enviados.
--
--  NÃO reverte (de propósito) as correções críticas, que não afetam o uso
--  normal: proteção do papel (role) em profiles, handle_new_user, índice
--  único de faturas, limites de pedidos, ranking abreviado, grupos
--  familiares sem acesso de professor. Reabrir essas falhas seria pior do
--  que qualquer incómodo que causem.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "Registar presença" ON public.presencas;
CREATE POLICY "Registar presença" ON public.presencas FOR INSERT WITH CHECK (
  aluno_id = (SELECT private.my_aluno_id())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento')
);

DROP TRIGGER IF EXISTS trg_proteger_insert_aluno ON public.alunos;

COMMIT;
