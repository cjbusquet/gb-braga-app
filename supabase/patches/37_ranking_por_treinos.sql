-- ============================================================
--  Patch 37 — Ranking por nº de treinos, não por % de frequência
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  ranking_frequencia() ordenava pela mesma alunos.frequencia usada na
--  página do aluno — que conta um treino por dia (2 check-ins no mesmo
--  dia só contam 1), de propósito, para a % pessoal não disparar por
--  causa de um dia com 2 aulas. Num ranking/leaderboard isso não faz
--  sentido: quem treina 2x num dia deve ficar à frente de quem só foi
--  1x. ranking_treinos() substitui-a, contando cada check-in a sério,
--  na mesma janela (matrícula, ou p_meses se for mais curta) já usada
--  em calcular_frequencia — a % pessoal mostrada no Portal/Minhas
--  Aulas/Evolução não muda, só o Rank.
-- ============================================================

DROP FUNCTION IF EXISTS ranking_frequencia();

CREATE OR REPLACE FUNCTION ranking_treinos(p_meses INT DEFAULT 3)
RETURNS TABLE(nome TEXT, faixa belt_type, treinos BIGINT) AS $$
  SELECT a.nome, a.faixa, COUNT(p.id) AS treinos
  FROM alunos a
  JOIN presencas p
    ON p.aluno_id = a.id
    AND p.tipo = 'checkin'
    AND p.created_at >= GREATEST(a.data_matricula::TIMESTAMPTZ, NOW() - (p_meses || ' months')::INTERVAL)
  WHERE a.status = 'ativo'
  GROUP BY a.id, a.nome, a.faixa
  ORDER BY treinos DESC, a.nome ASC
  LIMIT 50;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

REVOKE EXECUTE ON FUNCTION ranking_treinos(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ranking_treinos(INT) TO authenticated;
