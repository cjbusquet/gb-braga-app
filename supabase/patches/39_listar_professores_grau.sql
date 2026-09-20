-- ============================================================
--  Patch 39 — listar_professores_ativos() passa a devolver grau
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  A função já devolvia id/nome/faixa (SECURITY DEFINER, porque um
--  professor não lê o perfil de outro via RLS). O novo masthead do
--  Dashboard do professor precisa também do grau para desenhar o
--  BeltBar da própria conta, tal como o cartão do aluno — evita criar
--  uma segunda função só para isso.
-- ============================================================

DROP FUNCTION IF EXISTS listar_professores_ativos();

CREATE OR REPLACE FUNCTION listar_professores_ativos()
RETURNS TABLE(id UUID, nome TEXT, faixa belt_type, grau SMALLINT) AS $$
  SELECT p.id, p.nome, COALESCE(pe.faixa, 'preta'), COALESCE(pe.grau, 0)
  FROM profiles p
  LEFT JOIN professor_extras pe ON pe.id = p.id
  WHERE p.role = 'professor'
  ORDER BY p.nome;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

REVOKE EXECUTE ON FUNCTION listar_professores_ativos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION listar_professores_ativos() TO authenticated;
