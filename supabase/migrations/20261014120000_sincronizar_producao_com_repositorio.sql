-- ============================================================
--  Migração: sincronizar a base de dados de produção com o repositório
--  Data: 14/10/2026
--
--  SÓ ACRESCENTA. Não apaga tabelas, colunas, políticas nem dados.
--  Idempotente: pode ser executada mais de uma vez sem erro.
--
--  Objetos acrescentados (definições copiadas de supabase/schema.sql):
--    • enums: belt_type (+vermelha-preta, +vermelha-branca), user_role (+encarregado)
--    • tabelas: grupos_familiares, notas_aluno, lembretes_aluno,
--               aulas_particulares, aulas_particulares_alunos (com RLS)
--    • colunas: alunos.genero, alunos.aula_particular, alunos.grupo_familiar_id,
--               planos.membros, pagamentos.grupo_familiar_id
--    • pagamentos.aluno_id passa a opcional (+ CHECK aluno OU grupo)
--    • funções, vistas e triggers usados pela app e em falta
--
--  Única alteração de dados: planos.membros preenchido nos planos família
--  (valores iguais aos de supabase/schema.sql).
-- ============================================================

-- ── 1. Enumerações ───────────────────────────────────────────
ALTER TYPE public.belt_type ADD VALUE IF NOT EXISTS 'vermelha-preta';
ALTER TYPE public.belt_type ADD VALUE IF NOT EXISTS 'vermelha-branca';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'encarregado';

-- ── 2. Grupos familiares ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grupos_familiares (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id               TEXT REFERENCES public.planos(id) ON DELETE SET NULL,
  plano_nome             TEXT,
  titular_nome           TEXT NOT NULL,
  titular_email          TEXT NOT NULL,
  titular_nif            TEXT,
  titular_treina         BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status                 public.aluno_status NOT NULL DEFAULT 'inativo',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grupos_familiares_titular  ON public.grupos_familiares(lower(titular_email));
CREATE INDEX IF NOT EXISTS idx_grupos_familiares_customer ON public.grupos_familiares(stripe_customer_id);

-- ── 3. Colunas em falta ──────────────────────────────────────
ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS membros INT NOT NULL DEFAULT 1;

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS genero            public.genero_type;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS aula_particular   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS grupo_familiar_id UUID REFERENCES public.grupos_familiares(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_grupo_familiar ON public.alunos(grupo_familiar_id);

ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS grupo_familiar_id UUID REFERENCES public.grupos_familiares(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pagamentos_grupo ON public.pagamentos(grupo_familiar_id);
-- Mensalidades de família são atribuídas ao grupo, não a um aluno.
ALTER TABLE public.pagamentos ALTER COLUMN aluno_id DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagamento_tem_alvo' AND conrelid = 'public.pagamentos'::regclass) THEN
    ALTER TABLE public.pagamentos
      ADD CONSTRAINT pagamento_tem_alvo CHECK (aluno_id IS NOT NULL OR grupo_familiar_id IS NOT NULL);
  END IF;
END $$;

-- Nº de praticantes por plano (só planos família; os restantes ficam 1)
UPDATE public.planos SET membros = 2 WHERE id IN ('pl-familia-2','pl-familia-2-fund')                  AND membros IS DISTINCT FROM 2;
UPDATE public.planos SET membros = 3 WHERE id IN ('pl-familia-3','pl-familia-3-kids','pl-familia-3-fund') AND membros IS DISTINCT FROM 3;
UPDATE public.planos SET membros = 4 WHERE id IN ('pl-familia-4','pl-familia-4-fund')                  AND membros IS DISTINCT FROM 4;

-- ── 4. Notas e lembretes do professor ────────────────────────
CREATE TABLE IF NOT EXISTS public.notas_aluno (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id     UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nota         TEXT NOT NULL CHECK (length(trim(nota)) > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notas_aluno_aluno ON public.notas_aluno(aluno_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lembretes_aluno (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id         UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  professor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  texto            TEXT NOT NULL CHECK (length(trim(texto)) > 0),
  aulas_alvo       SMALLINT NOT NULL CHECK (aulas_alvo > 0),
  aulas_decorridas SMALLINT NOT NULL DEFAULT 0,
  concluido        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lembretes_aluno_ativos ON public.lembretes_aluno(aluno_id) WHERE NOT concluido;

-- ── 5. Aulas particulares ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aulas_particulares (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professor_nome TEXT NOT NULL,
  ajudante_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_aulas_particulares_professor ON public.aulas_particulares(professor_id, data);
CREATE INDEX IF NOT EXISTS idx_aulas_particulares_ajudante  ON public.aulas_particulares(ajudante_id, data) WHERE ajudante_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.aulas_particulares_alunos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_particular_id  UUID NOT NULL REFERENCES public.aulas_particulares(id) ON DELETE CASCADE,
  aluno_id            UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  aluno_nome          TEXT NOT NULL,
  UNIQUE (aula_particular_id, aluno_id)
);
CREATE INDEX IF NOT EXISTS idx_aulas_particulares_alunos_aluno ON public.aulas_particulares_alunos(aluno_id);

-- ── 6. Row Level Security das tabelas novas ──────────────────
ALTER TABLE public.grupos_familiares         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_aluno               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes_aluno           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_particulares        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_particulares_alunos ENABLE ROW LEVEL SECURITY;

-- Helpers (quebram a recursão entre as duas tabelas de aulas particulares)
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

REVOKE ALL ON FUNCTION private.eh_participante_particular(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.pode_gerir_particular(UUID)     FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.eh_participante_particular(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.pode_gerir_particular(UUID)     TO authenticated;

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT * FROM (VALUES
    -- grupos_familiares
    ('grupos_familiares', 'Ver grupo familiar',
     $p$CREATE POLICY "Ver grupo familiar" ON public.grupos_familiares FOR SELECT USING (
        lower(titular_email) = lower((SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())))
        OR id IN (SELECT grupo_familiar_id FROM public.alunos WHERE email = (SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())))
        OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'))$p$),
    ('grupos_familiares', 'Admin gere grupo familiar',
     $p$CREATE POLICY "Admin gere grupo familiar" ON public.grupos_familiares FOR ALL
        USING ((SELECT private.auth_role()) IN ('admin','superadmin'))
        WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'))$p$),
    -- notas_aluno (privadas ao professor)
    ('notas_aluno', 'Só o professor vê notas',
     $p$CREATE POLICY "Só o professor vê notas" ON public.notas_aluno FOR SELECT USING ((SELECT private.auth_role()) = 'professor')$p$),
    ('notas_aluno', 'Só o professor escreve notas',
     $p$CREATE POLICY "Só o professor escreve notas" ON public.notas_aluno FOR INSERT WITH CHECK (
        professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    ('notas_aluno', 'Só o autor edita nota',
     $p$CREATE POLICY "Só o autor edita nota" ON public.notas_aluno FOR UPDATE
        USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
        WITH CHECK (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    ('notas_aluno', 'Só o autor apaga nota',
     $p$CREATE POLICY "Só o autor apaga nota" ON public.notas_aluno FOR DELETE
        USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    -- lembretes_aluno
    ('lembretes_aluno', 'Só o professor vê lembretes',
     $p$CREATE POLICY "Só o professor vê lembretes" ON public.lembretes_aluno FOR SELECT USING ((SELECT private.auth_role()) = 'professor')$p$),
    ('lembretes_aluno', 'Só o professor cria lembrete',
     $p$CREATE POLICY "Só o professor cria lembrete" ON public.lembretes_aluno FOR INSERT WITH CHECK (
        professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    ('lembretes_aluno', 'Só o autor edita lembrete',
     $p$CREATE POLICY "Só o autor edita lembrete" ON public.lembretes_aluno FOR UPDATE
        USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
        WITH CHECK (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    ('lembretes_aluno', 'Só o autor apaga lembrete',
     $p$CREATE POLICY "Só o autor apaga lembrete" ON public.lembretes_aluno FOR DELETE
        USING (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')$p$),
    -- aulas_particulares
    ('aulas_particulares', 'Ver aula particular',
     $p$CREATE POLICY "Ver aula particular" ON public.aulas_particulares FOR SELECT USING (
        professor_id = (SELECT auth.uid())
        OR ajudante_id = (SELECT auth.uid())
        OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
        OR private.eh_participante_particular(id))$p$),
    ('aulas_particulares', 'Marcar aula particular',
     $p$CREATE POLICY "Marcar aula particular" ON public.aulas_particulares FOR INSERT WITH CHECK (
        professor_id = (SELECT auth.uid())
        AND (SELECT private.auth_role()) IN ('professor','admin','superadmin'))$p$),
    ('aulas_particulares', 'Autor ou admin edita particular',
     $p$CREATE POLICY "Autor ou admin edita particular" ON public.aulas_particulares FOR UPDATE
        USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
        WITH CHECK (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))$p$),
    ('aulas_particulares', 'Autor ou admin apaga particular',
     $p$CREATE POLICY "Autor ou admin apaga particular" ON public.aulas_particulares FOR DELETE
        USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))$p$),
    -- aulas_particulares_alunos
    ('aulas_particulares_alunos', 'Ver participantes',
     $p$CREATE POLICY "Ver participantes" ON public.aulas_particulares_alunos FOR SELECT USING (
        private.pode_gerir_particular(aula_particular_id)
        OR aluno_id = private.my_aluno_id())$p$),
    ('aulas_particulares_alunos', 'Gerir participantes',
     $p$CREATE POLICY "Gerir participantes" ON public.aulas_particulares_alunos FOR ALL USING (
        private.pode_gerir_particular(aula_particular_id)
      ) WITH CHECK (
        private.pode_gerir_particular(aula_particular_id))$p$)
  ) AS v(tabela, nome, ddl)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = p.tabela AND policyname = p.nome) THEN
      EXECUTE p.ddl;
    END IF;
  END LOOP;
END $$;

-- ── 7. Funções usadas pela app ───────────────────────────────

-- Verificar se um email já tem conta (ficha de matrícula, antes do registo)
CREATE OR REPLACE FUNCTION public.email_existe(e text) RETURNS boolean
LANGUAGE SQL SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(e)));
$$;
REVOKE ALL ON FUNCTION public.email_existe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_existe(text) TO anon, authenticated;

-- Seletor de professor substituto
CREATE OR REPLACE FUNCTION public.listar_professores_ativos()
RETURNS TABLE(id UUID, nome TEXT, faixa public.belt_type, grau SMALLINT) AS $$
  SELECT p.id, p.nome, COALESCE(pe.faixa, 'preta'), COALESCE(pe.grau, 0)
  FROM profiles p
  LEFT JOIN professor_extras pe ON pe.id = p.id
  WHERE p.role = 'professor'
  ORDER BY p.nome;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;
REVOKE EXECUTE ON FUNCTION public.listar_professores_ativos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_professores_ativos() TO authenticated;

-- Substituições de professor por aula
CREATE OR REPLACE FUNCTION public.definir_professor_aula(
  p_turma_id UUID,
  p_data DATE,
  p_professor_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_role  TEXT := private.auth_role();
  v_uid   UUID := auth.uid();
  v_turma turmas%ROWTYPE;
  v_aula  aulas%ROWTYPE;
  v_aula_existe BOOLEAN;
  v_atual UUID;
  v_nome  TEXT;
  v_alvo_role TEXT;
  v_aula_id UUID;
BEGIN
  IF v_role NOT IN ('professor','admin','superadmin') THEN
    RAISE EXCEPTION 'Sem permissão para definir o professor de uma aula' USING ERRCODE = '42501';
  END IF;

  IF p_data < CURRENT_DATE THEN
    RAISE EXCEPTION 'Não é possível alterar o professor de uma aula passada' USING ERRCODE = '22007';
  END IF;

  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_aula FROM aulas WHERE turma_id = p_turma_id AND data = p_data;
  v_aula_existe := FOUND;
  v_atual := CASE WHEN v_aula_existe THEN v_aula.professor_id ELSE v_turma.professor_id END;

  IF p_professor_id IS NOT NULL THEN
    SELECT role, nome INTO v_alvo_role, v_nome FROM profiles WHERE id = p_professor_id;
    IF v_alvo_role IS DISTINCT FROM 'professor' THEN
      RAISE EXCEPTION 'O substituto tem de ser um professor' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF v_role = 'professor' THEN
    IF p_professor_id = v_uid THEN
      IF NOT (v_atual IS NULL OR v_atual = v_uid OR v_uid = v_turma.professor_id) THEN
        RAISE EXCEPTION 'Esta aula já tem um professor atribuído' USING ERRCODE = '42501';
      END IF;
    ELSIF p_professor_id IS NULL THEN
      IF NOT (v_uid = v_atual OR v_uid = v_turma.professor_id) THEN
        RAISE EXCEPTION 'Só o professor da aula ou o titular da turma pode libertá-la' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NOT (v_uid = v_turma.professor_id OR v_uid = v_atual) THEN
        RAISE EXCEPTION 'Só o titular da turma ou o professor da aula pode escolher um substituto' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala)
  VALUES (v_turma.id, v_turma.nome, p_professor_id, v_nome, p_data, v_turma.horario, v_turma.sala)
  ON CONFLICT (turma_id, data) DO UPDATE SET
    professor_id   = EXCLUDED.professor_id,
    professor_nome = EXCLUDED.professor_nome
  RETURNING id INTO v_aula_id;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.definir_professor_aula(UUID, DATE, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_professor_aula(UUID, DATE, UUID) TO authenticated;

-- Troca de professor titular → aulas futuras agendadas acompanham
CREATE OR REPLACE FUNCTION public.sincronizar_titular_aulas_futuras() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.professor_id IS DISTINCT FROM OLD.professor_id THEN
    UPDATE aulas SET
      professor_id   = NEW.professor_id,
      professor_nome = NEW.professor_nome
    WHERE turma_id = NEW.id
      AND data >= CURRENT_DATE
      AND status = 'agendada'
      AND professor_id IS NOT DISTINCT FROM OLD.professor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.sincronizar_titular_aulas_futuras() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_titular_aulas ON public.turmas;
CREATE TRIGGER trg_sync_titular_aulas
  AFTER UPDATE OF professor_id ON public.turmas
  FOR EACH ROW
  EXECUTE FUNCTION public.sincronizar_titular_aulas_futuras();

-- Lembretes: avançar contagem a cada check-in
CREATE OR REPLACE FUNCTION public.avancar_lembretes_aluno() RETURNS TRIGGER AS $$
DECLARE
  v_lembrete lembretes_aluno%ROWTYPE;
  v_aluno_nome TEXT;
BEGIN
  FOR v_lembrete IN
    UPDATE lembretes_aluno
    SET aulas_decorridas = aulas_decorridas + 1
    WHERE aluno_id = NEW.aluno_id AND NOT concluido
    RETURNING *
  LOOP
    IF v_lembrete.aulas_decorridas >= v_lembrete.aulas_alvo THEN
      UPDATE lembretes_aluno SET concluido = TRUE WHERE id = v_lembrete.id;
      SELECT nome INTO v_aluno_nome FROM alunos WHERE id = v_lembrete.aluno_id;
      INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
      VALUES (v_lembrete.professor_id, 'Lembrete — ' || COALESCE(v_aluno_nome, 'aluno'), v_lembrete.texto, 'aviso', 'alunos');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.avancar_lembretes_aluno() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_avancar_lembretes ON public.presencas;
CREATE TRIGGER trg_avancar_lembretes
  AFTER INSERT ON public.presencas
  FOR EACH ROW
  WHEN (NEW.tipo = 'checkin')
  EXECUTE FUNCTION public.avancar_lembretes_aluno();

-- Marcar aula particular (escrita atómica nas duas tabelas)
CREATE OR REPLACE FUNCTION public.criar_aula_particular(
  p_data        DATE,
  p_hora_inicio TIME,
  p_hora_fim    TIME,
  p_sala        TEXT,
  p_observacoes TEXT,
  p_ajudante_id UUID,
  p_aluno_ids   UUID[]
) RETURNS UUID AS $$
DECLARE
  v_role          TEXT := private.auth_role();
  v_uid           UUID := auth.uid();
  v_prof_nome     TEXT;
  v_ajudante_nome TEXT;
  v_ajudante_role TEXT;
  v_id            UUID;
  v_aluno_id      UUID;
  v_aluno_nome    TEXT;
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
REVOKE EXECUTE ON FUNCTION public.criar_aula_particular(DATE, TIME, TIME, TEXT, TEXT, UUID, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_aula_particular(DATE, TIME, TIME, TEXT, TEXT, UUID, UUID[]) TO authenticated;

-- Notificar o ajudante de uma aula particular
CREATE OR REPLACE FUNCTION public.notificar_ajudante_aula_particular() RETURNS TRIGGER AS $$
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
REVOKE EXECUTE ON FUNCTION public.notificar_ajudante_aula_particular() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notificar_ajudante_particular ON public.aulas_particulares;
CREATE TRIGGER trg_notificar_ajudante_particular
  AFTER INSERT OR UPDATE OF ajudante_id ON public.aulas_particulares
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_ajudante_aula_particular();

-- Aula particular concluída → regista presença dos participantes
CREATE OR REPLACE FUNCTION public.registar_presenca_aula_particular() RETURNS TRIGGER AS $$
DECLARE
  v_participante RECORD;
  v_ajudante_aluno_id UUID;
BEGIN
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida') THEN
    FOR v_participante IN
      SELECT aluno_id, aluno_nome FROM aulas_particulares_alunos WHERE aula_particular_id = NEW.id
    LOOP
      INSERT INTO presencas (aluno_id, aluno_nome, turma_nome, data, hora, tipo, metodo)
      VALUES (v_participante.aluno_id, v_participante.aluno_nome, 'Aula Particular', NEW.data, NEW.hora_inicio, 'checkin', 'particular');
    END LOOP;

    IF NEW.ajudante_tipo = 'aluno' THEN
      SELECT id INTO v_ajudante_aluno_id FROM alunos WHERE profile_id = NEW.ajudante_id;
      IF v_ajudante_aluno_id IS NOT NULL THEN
        INSERT INTO presencas (aluno_id, aluno_nome, turma_nome, data, hora, tipo, metodo)
        VALUES (v_ajudante_aluno_id, NEW.ajudante_nome, 'Aula Particular (ajudante)', NEW.data, NEW.hora_inicio, 'checkin', 'particular');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.registar_presenca_aula_particular() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_presenca_aula_particular ON public.aulas_particulares;
CREATE TRIGGER trg_presenca_aula_particular
  AFTER INSERT OR UPDATE OF status ON public.aulas_particulares
  FOR EACH ROW
  EXECUTE FUNCTION public.registar_presenca_aula_particular();

-- Estatísticas: frequência por dia da semana (corre com a RLS de quem chama)
CREATE OR REPLACE FUNCTION public.frequencia_dias_semana(p_aluno_id UUID, p_meses INT DEFAULT 6)
RETURNS TABLE(dia_semana INT, total BIGINT) AS $$
  SELECT EXTRACT(DOW FROM data)::INT AS dia_semana, COUNT(DISTINCT data) AS total
  FROM presencas
  WHERE aluno_id = p_aluno_id
    AND tipo = 'checkin'
    AND data >= (CURRENT_DATE - (p_meses || ' months')::INTERVAL)
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql STABLE SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.frequencia_dias_semana(UUID, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.frequencia_dias_semana(UUID, INT) TO authenticated;

-- Ranking por nº de treinos (só nome, faixa e contagem)
CREATE OR REPLACE FUNCTION public.ranking_treinos(p_meses INT DEFAULT 3)
RETURNS TABLE(nome TEXT, faixa public.belt_type, treinos BIGINT) AS $$
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
REVOKE EXECUTE ON FUNCTION public.ranking_treinos(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ranking_treinos(INT) TO authenticated;

-- ── 8. Vistas (respeitam a RLS de quem consulta) ─────────────
CREATE OR REPLACE VIEW public.v_alunos_abaixo_meta WITH (security_invoker = true) AS
SELECT
  a.id, a.nome, a.faixa, a.frequencia,
  COUNT(DISTINCT p.data) FILTER (WHERE p.data >= CURRENT_DATE - 7) AS dias_ultimos_7
FROM public.alunos a
LEFT JOIN public.presencas p ON p.aluno_id = a.id AND p.tipo = 'checkin'
WHERE a.status = 'ativo'
GROUP BY a.id, a.nome, a.faixa, a.frequencia
HAVING COUNT(DISTINCT p.data) FILTER (WHERE p.data >= CURRENT_DATE - 7) < 2;

CREATE OR REPLACE VIEW public.v_alunos_proximos_graduacao WITH (security_invoker = true) AS
WITH ultima AS (
  SELECT DISTINCT ON (aluno_id) aluno_id, data AS ultima_graduacao
  FROM public.graduacoes
  ORDER BY aluno_id, data DESC
),
base AS (
  SELECT
    a.id, a.nome, a.faixa, a.grau, a.frequencia,
    COALESCE(u.ultima_graduacao, a.data_matricula) AS desde,
    DATE_PART('year',  AGE(NOW(), COALESCE(u.ultima_graduacao, a.data_matricula))) * 12
      + DATE_PART('month', AGE(NOW(), COALESCE(u.ultima_graduacao, a.data_matricula))) AS meses_no_nivel
  FROM public.alunos a
  LEFT JOIN ultima u ON u.aluno_id = a.id
  WHERE a.status = 'ativo'
),
cfg AS (
  SELECT
    COALESCE((SELECT (dados->>'mesesParaGrau')::NUMERIC   FROM public.configuracoes WHERE secao = 'graduacao'), 4)  AS meses_grau,
    COALESCE((SELECT (dados->>'mesesParaFaixa')::NUMERIC  FROM public.configuracoes WHERE secao = 'graduacao'), 18) AS meses_faixa,
    COALESCE((SELECT (dados->>'frequenciaMinima')::NUMERIC FROM public.configuracoes WHERE secao = 'graduacao'), 70) AS freq_minima
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

REVOKE ALL ON public.v_alunos_abaixo_meta, public.v_alunos_proximos_graduacao FROM anon;
