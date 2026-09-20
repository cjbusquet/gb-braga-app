-- ============================================================
--  Patch 40 — Aulas particulares (marcação real, não só etiqueta)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Até agora "aula particular" era só um checkbox em `alunos`
--  (patch 32, `aula_particular`), sem data/hora/participantes. Este
--  patch introduz marcações reais: um professor marca uma aula com 1+
--  alunos e, opcionalmente, associa um segundo professor ou aluno
--  "para ajudar" (`ajudante_id`/`ajudante_tipo`).
--
--  Mesmo padrão de `notas_aluno`/`lembretes_aluno` (patch 32): tabela
--  dedicada com RLS própria, nomes denormalizados (professor_nome,
--  aluno_nome) tal como `aulas`/`presencas` já fazem, para não obrigar
--  a um join em toda a leitura.
--
--  Fora de âmbito (deliberado): não mexe em `presencas`,
--  `calcular_frequencia()` nem `ranking_treinos()` — uma particular não
--  conta para as estatísticas de treino em grupo.
-- ============================================================

-- ── AULAS PARTICULARES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aulas_particulares (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professor_nome TEXT NOT NULL,
  ajudante_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ajudante_nome  TEXT,
  ajudante_tipo  TEXT CHECK (ajudante_tipo IN ('professor','aluno')),
  data           DATE NOT NULL,
  hora_inicio    TIME NOT NULL,
  hora_fim       TIME,
  sala           TEXT,
  observacoes    TEXT,
  status         TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','concluida','cancelada')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aulas_particulares_professor ON aulas_particulares(professor_id, data);
CREATE INDEX IF NOT EXISTS idx_aulas_particulares_ajudante  ON aulas_particulares(ajudante_id, data) WHERE ajudante_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS aulas_particulares_alunos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aula_particular_id  UUID NOT NULL REFERENCES aulas_particulares(id) ON DELETE CASCADE,
  aluno_id            UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_nome          TEXT NOT NULL,
  UNIQUE (aula_particular_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_aulas_particulares_alunos_aluno ON aulas_particulares_alunos(aluno_id);

ALTER TABLE aulas_particulares        ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_particulares_alunos ENABLE ROW LEVEL SECURITY;

-- Helpers SECURITY DEFINER — mesmo padrão de private.my_aluno_id() /
-- private.auth_role() já usados no schema. Sem isto, a policy de
-- `aulas_particulares` a consultar `aulas_particulares_alunos` e
-- vice-versa causa "infinite recursion detected in policy" (42P17):
-- confirmado ao testar esta feature. Uma função SECURITY DEFINER quebra
-- o ciclo porque a sua query interna corre com os privilégios do dono
-- da função, sem reavaliar a RLS da tabela-alvo.
CREATE OR REPLACE FUNCTION private.eh_participante_particular(p_aula_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM aulas_particulares_alunos
    WHERE aula_particular_id = p_aula_id AND aluno_id = private.my_aluno_id()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION private.pode_gerir_particular(p_aula_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM aulas_particulares
    WHERE id = p_aula_id AND (professor_id = auth.uid() OR ajudante_id = auth.uid())
  ) OR private.auth_role() IN ('admin','superadmin','atendimento');
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- SELECT: quem marcou, o ajudante, staff, ou um aluno participante.
DROP POLICY IF EXISTS "Ver aula particular" ON aulas_particulares;
CREATE POLICY "Ver aula particular" ON aulas_particulares FOR SELECT USING (
  professor_id = (SELECT auth.uid())
  OR ajudante_id = (SELECT auth.uid())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
  OR private.eh_participante_particular(id)
);

-- INSERT/UPDATE/DELETE: só quem marcou, ou admin/superadmin — o
-- ajudante só vê (tal como "Autor ou admin edita nota", patch 32).
DROP POLICY IF EXISTS "Marcar aula particular" ON aulas_particulares;
CREATE POLICY "Marcar aula particular" ON aulas_particulares FOR INSERT WITH CHECK (
  professor_id = (SELECT auth.uid())
  AND (SELECT private.auth_role()) IN ('professor','admin','superadmin')
);
DROP POLICY IF EXISTS "Autor ou admin edita particular" ON aulas_particulares;
CREATE POLICY "Autor ou admin edita particular" ON aulas_particulares FOR UPDATE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));
DROP POLICY IF EXISTS "Autor ou admin apaga particular" ON aulas_particulares;
CREATE POLICY "Autor ou admin apaga particular" ON aulas_particulares FOR DELETE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- aulas_particulares_alunos espelha a policy do pai (só quem marcou a
-- aula gere a lista de participantes) + visibilidade do próprio aluno.
DROP POLICY IF EXISTS "Ver participantes" ON aulas_particulares_alunos;
CREATE POLICY "Ver participantes" ON aulas_particulares_alunos FOR SELECT USING (
  private.pode_gerir_particular(aula_particular_id)
  OR aluno_id = private.my_aluno_id()
);
DROP POLICY IF EXISTS "Gerir participantes" ON aulas_particulares_alunos;
CREATE POLICY "Gerir participantes" ON aulas_particulares_alunos FOR ALL USING (
  private.pode_gerir_particular(aula_particular_id)
) WITH CHECK (
  private.pode_gerir_particular(aula_particular_id)
);

-- ── criar_aula_particular ─────────────────────────────────────
-- Escrita atómica em duas tabelas (regra do CLAUDE.md: mutações
-- multi-tabela não ficam a cargo do frontend). SECURITY DEFINER só
-- para poder validar o role/tipo do ajudante via `profiles` — as
-- policies de escrita continuam a aplicar-se (professor_id tem de ser
-- o utilizador autenticado).
CREATE OR REPLACE FUNCTION criar_aula_particular(
  p_data        DATE,
  p_hora_inicio TIME,
  p_hora_fim    TIME,
  p_sala        TEXT,
  p_observacoes TEXT,
  p_ajudante_id UUID,
  p_aluno_ids   UUID[]
) RETURNS UUID AS $$
DECLARE
  v_role         TEXT := private.auth_role();
  v_uid          UUID := auth.uid();
  v_prof_nome    TEXT;
  v_ajudante_nome TEXT;
  v_ajudante_role TEXT;
  v_id           UUID;
  v_aluno_id     UUID;
  v_aluno_nome   TEXT;
BEGIN
  IF v_role NOT IN ('professor','admin','superadmin') THEN
    RAISE EXCEPTION 'Sem permissão para marcar uma aula particular' USING ERRCODE = '42501';
  END IF;
  IF p_aluno_ids IS NULL OR array_length(p_aluno_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Escolhe pelo menos um aluno' USING ERRCODE = '22023';
  END IF;

  SELECT nome INTO v_prof_nome FROM profiles WHERE id = v_uid;

  IF p_ajudante_id IS NOT NULL THEN
    SELECT nome, role INTO v_ajudante_nome, v_ajudante_role FROM profiles WHERE id = p_ajudante_id;
    IF v_ajudante_role NOT IN ('professor','aluno') THEN
      RAISE EXCEPTION 'O ajudante tem de ser um professor ou um aluno' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO aulas_particulares (
    professor_id, professor_nome, ajudante_id, ajudante_nome, ajudante_tipo,
    data, hora_inicio, hora_fim, sala, observacoes
  ) VALUES (
    v_uid, v_prof_nome, p_ajudante_id, v_ajudante_nome, v_ajudante_role,
    p_data, p_hora_inicio, p_hora_fim, p_sala, p_observacoes
  ) RETURNING id INTO v_id;

  FOREACH v_aluno_id IN ARRAY p_aluno_ids LOOP
    SELECT nome INTO v_aluno_nome FROM alunos WHERE id = v_aluno_id;
    IF v_aluno_nome IS NULL THEN
      RAISE EXCEPTION 'Aluno não encontrado' USING ERRCODE = 'P0002';
    END IF;
    INSERT INTO aulas_particulares_alunos (aula_particular_id, aluno_id, aluno_nome)
    VALUES (v_id, v_aluno_id, v_aluno_nome);
  END LOOP;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION criar_aula_particular(DATE, TIME, TIME, TEXT, TEXT, UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION criar_aula_particular(DATE, TIME, TIME, TEXT, TEXT, UUID, UUID[]) TO authenticated;

-- ── Notificar o ajudante ──────────────────────────────────────
-- Sem policy de INSERT em `notificacoes` para o frontend inserir "para
-- outro perfil" (é sempre fan-out por trigger, ver comentário na
-- criação da tabela) — por isso SECURITY DEFINER, mesmo padrão de
-- avancar_lembretes_aluno (patch 32). O link muda consoante o tipo do
-- ajudante: professor tem página própria "particulares"; aluno vê a
-- marcação numa secção em "minhas-aulas".
CREATE OR REPLACE FUNCTION notificar_ajudante_aula_particular() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ajudante_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.ajudante_id IS DISTINCT FROM OLD.ajudante_id) THEN
    INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
    VALUES (
      NEW.ajudante_id,
      'Convite para ajudar numa aula particular',
      NEW.professor_nome || ' convidou-te para ajudar numa aula particular em ' || to_char(NEW.data, 'DD/MM') || ' às ' || to_char(NEW.hora_inicio, 'HH24:MI'),
      'info',
      CASE WHEN NEW.ajudante_tipo = 'aluno' THEN 'minhas-aulas' ELSE 'particulares' END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notificar_ajudante_particular ON aulas_particulares;
CREATE TRIGGER trg_notificar_ajudante_particular
  AFTER INSERT OR UPDATE OF ajudante_id ON aulas_particulares
  FOR EACH ROW
  EXECUTE FUNCTION notificar_ajudante_aula_particular();

REVOKE EXECUTE ON FUNCTION notificar_ajudante_aula_particular() FROM PUBLIC;
