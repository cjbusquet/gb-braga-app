-- ============================================================
--  Patch 31 — Analytics de frequência, meta semanal, ranking e
--             proximidade de graduação
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  `alunos.frequencia` já é mantida automaticamente por
--  trg_atualizar_frequencia (schema.sql) a cada check-in — esta patch
--  não recalcula nada, só expõe leituras derivadas dela e de
--  `presencas`/`graduacoes` que ainda não existiam:
--
--    frequencia_dias_semana(aluno, meses) — em que dias da semana o
--    aluno mais treina (função simples, sem SECURITY DEFINER: corre
--    com o RLS de quem chama, tal como qualquer SELECT do frontend a
--    "presencas").
--
--    v_alunos_abaixo_meta — alunos ativos com menos de 2 dias de
--    check-in nos últimos 7 dias (baseline de frequência). Vista
--    security_invoker, mesmo padrão de v_kpis (patch 07) — só quem já
--    pode ler todos os `alunos`/`presencas` (staff) vê alguma linha.
--
--    v_alunos_proximos_graduacao — alunos a aproximar-se do próximo
--    grau/faixa, usando limiares configuráveis em `configuracoes`
--    (secao 'graduacao') em vez de valores fixos no código.
--
--    ranking_frequencia() — como o ranking deve ser visível a
--    qualquer utilizador autenticado (incluindo alunos), e a policy
--    "Aluno vê dados" bloqueia um aluno de ler a linha de outro aluno,
--    isto teria de ser SECURITY DEFINER — mesmo padrão de
--    calcular_frequencia/registrar_graduacao.
--
--  Nenhuma destas views tem GRANT SELECT explícito, tal como v_kpis —
--  os privilégios de SELECT em `public` já vêm concedidos por omissão
--  no Supabase; a fronteira de segurança real é o RLS das tabelas
--  subjacentes (e, no caso do ranking, o próprio SECURITY DEFINER).
-- ============================================================

-- ── frequencia_dias_semana ───────────────────────────────────
CREATE OR REPLACE FUNCTION frequencia_dias_semana(p_aluno_id UUID, p_meses INT DEFAULT 6)
RETURNS TABLE(dia_semana INT, total BIGINT) AS $$
  SELECT EXTRACT(DOW FROM data)::INT AS dia_semana, COUNT(DISTINCT data) AS total
  FROM presencas
  WHERE aluno_id = p_aluno_id
    AND tipo = 'checkin'
    AND data >= (CURRENT_DATE - (p_meses || ' months')::INTERVAL)
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql STABLE;

REVOKE EXECUTE ON FUNCTION frequencia_dias_semana(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION frequencia_dias_semana(UUID, INT) TO authenticated;

-- ── v_alunos_abaixo_meta ──────────────────────────────────────
CREATE OR REPLACE VIEW v_alunos_abaixo_meta WITH (security_invoker = true) AS
SELECT
  a.id, a.nome, a.faixa, a.frequencia,
  COUNT(DISTINCT p.data) FILTER (WHERE p.data >= CURRENT_DATE - 7) AS dias_ultimos_7
FROM alunos a
LEFT JOIN presencas p ON p.aluno_id = a.id AND p.tipo = 'checkin'
WHERE a.status = 'ativo'
GROUP BY a.id, a.nome, a.faixa, a.frequencia
HAVING COUNT(DISTINCT p.data) FILTER (WHERE p.data >= CURRENT_DATE - 7) < 2;

-- ── v_alunos_proximos_graduacao ───────────────────────────────
-- Limiares em configuracoes.dados (secao 'graduacao') com fallback
-- embutido caso a secao ainda não exista — nunca quebra por falta de
-- seed.
CREATE OR REPLACE VIEW v_alunos_proximos_graduacao WITH (security_invoker = true) AS
WITH ultima AS (
  SELECT DISTINCT ON (aluno_id) aluno_id, data AS ultima_graduacao
  FROM graduacoes
  ORDER BY aluno_id, data DESC
),
base AS (
  SELECT
    a.id, a.nome, a.faixa, a.grau, a.frequencia,
    COALESCE(u.ultima_graduacao, a.data_matricula) AS desde,
    DATE_PART('year',  AGE(NOW(), COALESCE(u.ultima_graduacao, a.data_matricula))) * 12
      + DATE_PART('month', AGE(NOW(), COALESCE(u.ultima_graduacao, a.data_matricula))) AS meses_no_nivel
  FROM alunos a
  LEFT JOIN ultima u ON u.aluno_id = a.id
  WHERE a.status = 'ativo'
),
cfg AS (
  SELECT
    COALESCE((SELECT (dados->>'mesesParaGrau')::NUMERIC   FROM configuracoes WHERE secao = 'graduacao'), 4)  AS meses_grau,
    COALESCE((SELECT (dados->>'mesesParaFaixa')::NUMERIC  FROM configuracoes WHERE secao = 'graduacao'), 18) AS meses_faixa,
    COALESCE((SELECT (dados->>'frequenciaMinima')::NUMERIC FROM configuracoes WHERE secao = 'graduacao'), 70) AS freq_minima
)
SELECT b.id, b.nome, b.faixa, b.grau, b.frequencia, b.desde, b.meses_no_nivel,
       (b.grau = 4) AS proximo_e_faixa
FROM base b, cfg
WHERE b.frequencia >= cfg.freq_minima
  AND (
    (b.grau < 4 AND b.meses_no_nivel >= cfg.meses_grau  - 1)
    OR
    (b.grau = 4 AND b.meses_no_nivel >= cfg.meses_faixa - 1)
  );

-- ── ranking_frequencia ────────────────────────────────────────
CREATE OR REPLACE FUNCTION ranking_frequencia()
RETURNS TABLE(nome TEXT, faixa belt_type, frequencia SMALLINT) AS $$
  SELECT nome, faixa, frequencia
  FROM alunos
  WHERE status = 'ativo'
  ORDER BY frequencia DESC, nome ASC
  LIMIT 50;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

REVOKE EXECUTE ON FUNCTION ranking_frequencia() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ranking_frequencia() TO authenticated;

-- ── SEEDS: limiares configuráveis (ConfigPage pode editar depois) ─
INSERT INTO configuracoes (secao, dados) VALUES
  ('graduacao', '{"mesesParaGrau": 4, "mesesParaFaixa": 18, "frequenciaMinima": 70}'::jsonb),
  -- Categorias por idade mínima (IBJJF), avaliadas em ordem crescente —
  -- quem não atinge "juvenil" fica em "crianca". Ver src/lib/idade.ts.
  ('categorias_idade', '{"juvenil": 16, "adulto": 18, "master1": 30, "master2": 36, "master3": 41, "master4": 46, "master5": 51, "master6": 56, "master7": 61}'::jsonb)
ON CONFLICT (secao) DO NOTHING;
