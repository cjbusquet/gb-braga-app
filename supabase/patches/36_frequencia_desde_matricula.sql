-- ============================================================
--  Patch 36 — calcular_frequencia() ancorada na matrícula
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  calcular_frequencia(aluno, meses=3) comparava sempre os últimos 3
--  meses de atividade da academia, mesmo para um aluno matriculado há
--  poucas semanas — a frequência saía artificialmente baixa só por o
--  aluno ainda não ter tido 3 meses para acumular presenças. A janela
--  passa a começar em GREATEST(data_matricula, hoje - p_meses), o que
--  não muda nada para alunos já estabelecidos (matriculados há mais de
--  p_meses) e corrige o caso dos recém-matriculados.
--
--  Inclui backfill: sem isto, alunos.frequencia só seria recalculada
--  no próximo check-in de cada um.
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_frequencia(p_aluno_id UUID, p_meses INT DEFAULT 3)
RETURNS INT AS $$
DECLARE total_aulas INT; aulas_aluno INT; desde TIMESTAMPTZ;
BEGIN
  SELECT GREATEST(a.data_matricula::TIMESTAMPTZ, NOW() - (p_meses || ' months')::INTERVAL)
    INTO desde
  FROM alunos a WHERE a.id = p_aluno_id;
  IF desde IS NULL THEN RETURN 0; END IF;

  SELECT COUNT(DISTINCT data) INTO total_aulas FROM presencas
  WHERE created_at >= desde AND tipo = 'checkin';
  SELECT COUNT(DISTINCT data) INTO aulas_aluno FROM presencas
  WHERE aluno_id = p_aluno_id AND tipo = 'checkin' AND created_at >= desde;
  IF total_aulas = 0 THEN RETURN 0; END IF;
  RETURN LEAST(100, ROUND((aulas_aluno::NUMERIC / total_aulas) * 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

UPDATE alunos SET frequencia = calcular_frequencia(id);
