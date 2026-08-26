-- ============================================================
--  Patch 27 — Aulas individuais (ocorrências de turma)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  `turmas` é só o horário-modelo semanal recorrente — nunca existiu
--  nenhuma entidade para "esta turma, neste dia": o professor não
--  tinha como listar as aulas que efetivamente deu nem ver
--  estatísticas por aula (quantos foram, distribuição de faixas).
--
--  `aulas` passa a ser essa ocorrência concreta, materializada
--  automaticamente (por qualquer check-in ou pelo professor a dar
--  aula) e ligada a `presencas` via `aula_id`. Não há policies de
--  INSERT/UPDATE diretas na tabela — toda a escrita passa pelas
--  funções SECURITY DEFINER abaixo, que decidem o professor a partir
--  de quem chama (mesmo padrão de registrar_graduacao, schema.sql):
--
--    obter_ou_criar_aula(turma, data) — chamada por qualquer check-in
--    (aluno/kiosk/staff); usa o professor por omissão da turma.
--
--    iniciar_aula(turma, data) — só para role='professor'; marca-o
--    como o professor desta aula (suporta substituições) e
--    status='em_curso'.
--
--    concluir_aula(aula_id) — só o professor da aula ou admin/
--    superadmin; status='concluida'.
--
--  `professor_checkins` fica intacta (histórico), mas deixa de ser
--  escrita por código novo — substituída por `aulas`.
-- ============================================================

CREATE TABLE IF NOT EXISTS aulas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turma_id       UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  turma_nome     TEXT NOT NULL,
  professor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome TEXT,
  data           DATE NOT NULL,
  horario        TEXT,               -- horário agendado (copiado da turma, ex: "07:00-08:30")
  hora_inicio    TIME,               -- hora real em que o professor iniciou
  hora_fim       TIME,               -- hora real em que o professor concluiu
  sala           TEXT,
  status         TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','em_curso','concluida')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turma_id, data)
);

CREATE INDEX IF NOT EXISTS idx_aulas_professor ON aulas(professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data      ON aulas(data);

ALTER TABLE presencas ADD COLUMN IF NOT EXISTS aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_presencas_aula ON presencas(aula_id);

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Visibilidade do horário/agenda não é sensível — mesmo critério que
-- "Ver turmas" (schema.sql): qualquer utilizador autenticado.
CREATE POLICY "Ver aulas" ON aulas FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- ── obter_ou_criar_aula ──────────────────────────────────────
CREATE OR REPLACE FUNCTION obter_ou_criar_aula(p_turma_id UUID, p_data DATE)
RETURNS UUID AS $$
DECLARE
  v_turma turmas%ROWTYPE;
  v_aula_id UUID;
BEGIN
  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala)
  VALUES (v_turma.id, v_turma.nome, v_turma.professor_id, v_turma.professor_nome, p_data, v_turma.horario, v_turma.sala)
  ON CONFLICT (turma_id, data) DO NOTHING
  RETURNING id INTO v_aula_id;

  IF v_aula_id IS NULL THEN
    SELECT id INTO v_aula_id FROM aulas WHERE turma_id = p_turma_id AND data = p_data;
  END IF;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION obter_ou_criar_aula(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obter_ou_criar_aula(UUID, DATE) TO authenticated;

-- ── iniciar_aula ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION iniciar_aula(p_turma_id UUID, p_data DATE)
RETURNS UUID AS $$
DECLARE
  v_role TEXT := private.auth_role();
  v_turma turmas%ROWTYPE;
  v_professor_nome TEXT;
  v_aula_id UUID;
BEGIN
  IF v_role <> 'professor' THEN
    RAISE EXCEPTION 'Só um professor pode iniciar uma aula' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  SELECT nome INTO v_professor_nome FROM profiles WHERE id = auth.uid();

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala, status, hora_inicio)
  VALUES (v_turma.id, v_turma.nome, auth.uid(), COALESCE(v_professor_nome, 'Professor'), p_data, v_turma.horario, v_turma.sala, 'em_curso', NOW()::TIME(0))
  ON CONFLICT (turma_id, data) DO UPDATE SET
    professor_id   = auth.uid(),
    professor_nome = COALESCE(v_professor_nome, 'Professor'),
    status         = 'em_curso',
    hora_inicio    = NOW()::TIME(0)
  RETURNING id INTO v_aula_id;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION iniciar_aula(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION iniciar_aula(UUID, DATE) TO authenticated;

-- ── concluir_aula ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION concluir_aula(p_aula_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role TEXT := private.auth_role();
  v_aula aulas%ROWTYPE;
BEGIN
  SELECT * INTO v_aula FROM aulas WHERE id = p_aula_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF NOT ((v_aula.professor_id = auth.uid() AND v_role = 'professor') OR v_role IN ('admin','superadmin')) THEN
    RAISE EXCEPTION 'Sem permissão para concluir esta aula' USING ERRCODE = '42501';
  END IF;

  UPDATE aulas SET status = 'concluida', hora_fim = NOW()::TIME(0) WHERE id = p_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION concluir_aula(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION concluir_aula(UUID) TO authenticated;

-- ── Backfill: reconstruir aulas a partir do histórico ───────
-- 1) Materializar uma aula por (turma_id, data) já presente em presencas.
INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala, status)
SELECT DISTINCT p.turma_id, p.turma_nome, t.professor_id, t.professor_nome, p.data, t.horario, t.sala, 'concluida'
FROM presencas p
JOIN turmas t ON t.id = p.turma_id
WHERE p.turma_id IS NOT NULL
ON CONFLICT (turma_id, data) DO NOTHING;

-- 2) Enriquecer com quem deu a aula e a que horas, a partir do histórico
--    de professor_checkins (mais preciso do que o professor por omissão).
INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala, hora_inicio, hora_fim, status)
SELECT pc.turma_id, pc.turma_nome, pc.professor_id, pc.professor_nome, pc.data,
       t.horario, t.sala, pc.hora_inicio, pc.hora_fim,
       CASE WHEN pc.status = 'concluida' OR pc.hora_fim IS NOT NULL THEN 'concluida' ELSE 'em_curso' END
FROM professor_checkins pc
JOIN turmas t ON t.id = pc.turma_id
WHERE pc.turma_id IS NOT NULL
ON CONFLICT (turma_id, data) DO UPDATE SET
  professor_id   = EXCLUDED.professor_id,
  professor_nome = EXCLUDED.professor_nome,
  hora_inicio    = EXCLUDED.hora_inicio,
  hora_fim       = COALESCE(EXCLUDED.hora_fim, aulas.hora_fim),
  status         = EXCLUDED.status;

-- 3) Ligar as presenças já existentes à aula agora materializada.
UPDATE presencas p SET aula_id = a.id
FROM aulas a
WHERE p.turma_id = a.turma_id AND p.data = a.data AND p.turma_id IS NOT NULL AND p.aula_id IS NULL;
