-- ============================================================
--  Patch 32 — Notas privadas do professor, lembretes por presença,
--             e tag de aula particular
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  RLS é ao nível da linha, não da coluna, e aluno/staff partilham o
--  mesmo role de BD "authenticated" — por isso um campo "só visível
--  ao professor" não pode ser uma coluna em `alunos` (a policy "Aluno
--  vê dados" devolve a linha completa ao próprio aluno, sem
--  possibilidade de mascarar colunas). Segue-se o mesmo padrão de
--  `mensagens_chat`/`notificacoes` (patch 26): tabela dedicada com
--  RLS que nunca inclui o role 'aluno'.
--
--    notas_aluno     — log de observações do treinador, nunca lido
--                      pelo próprio aluno.
--    lembretes_aluno — "lembra-me disto daqui a N aulas"; um trigger
--                      em `presencas` avança a contagem a cada
--                      check-in e, ao atingir o alvo, cria uma
--                      notificação para o professor via `notificacoes`
--                      (já existente) — sem cron, o evento é o próprio
--                      check-in.
--
--  `aula_particular` é só uma etiqueta administrativa (não sensível
--  como as notas) — vive como coluna em `alunos`, coberta pela RLS
--  já existente da tabela. Como qualquer coluna nova em `alunos`,
--  precisa de entrar explicitamente na lista de exceções de
--  restringir_update_aluno() (schema.sql) — sem isto, o trigger
--  reverteria sempre a alteração para o professor (só admin/
--  superadmin/atendimento passam incondicionalmente).
-- ============================================================

-- ── NOTAS DO PROFESSOR (privadas, nunca visíveis ao aluno) ────
CREATE TABLE IF NOT EXISTS notas_aluno (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id     UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nota         TEXT NOT NULL CHECK (length(trim(nota)) > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_aluno_aluno ON notas_aluno(aluno_id, created_at DESC);

ALTER TABLE notas_aluno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff de treino vê notas" ON notas_aluno;
CREATE POLICY "Staff de treino vê notas" ON notas_aluno FOR SELECT USING (
  (SELECT private.auth_role()) IN ('professor','admin','superadmin')
);

DROP POLICY IF EXISTS "Staff de treino escreve notas" ON notas_aluno;
CREATE POLICY "Staff de treino escreve notas" ON notas_aluno FOR INSERT WITH CHECK (
  professor_id = (SELECT auth.uid())
  AND (SELECT private.auth_role()) IN ('professor','admin','superadmin')
);

DROP POLICY IF EXISTS "Autor ou admin edita nota" ON notas_aluno;
CREATE POLICY "Autor ou admin edita nota" ON notas_aluno FOR UPDATE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

DROP POLICY IF EXISTS "Autor ou admin apaga nota" ON notas_aluno;
CREATE POLICY "Autor ou admin apaga nota" ON notas_aluno FOR DELETE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- ── LEMBRETES ("lembra-me disto daqui a N aulas") ─────────────
CREATE TABLE IF NOT EXISTS lembretes_aluno (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id         UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  professor_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  texto            TEXT NOT NULL CHECK (length(trim(texto)) > 0),
  aulas_alvo       SMALLINT NOT NULL CHECK (aulas_alvo > 0),
  aulas_decorridas SMALLINT NOT NULL DEFAULT 0,
  concluido        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lembretes_aluno_ativos ON lembretes_aluno(aluno_id) WHERE NOT concluido;

ALTER TABLE lembretes_aluno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff de treino vê lembretes" ON lembretes_aluno;
CREATE POLICY "Staff de treino vê lembretes" ON lembretes_aluno FOR SELECT USING (
  (SELECT private.auth_role()) IN ('professor','admin','superadmin')
);

DROP POLICY IF EXISTS "Professor cria o próprio lembrete" ON lembretes_aluno;
CREATE POLICY "Professor cria o próprio lembrete" ON lembretes_aluno FOR INSERT WITH CHECK (
  professor_id = (SELECT auth.uid())
  AND (SELECT private.auth_role()) IN ('professor','admin','superadmin')
);

DROP POLICY IF EXISTS "Autor ou admin edita lembrete" ON lembretes_aluno;
CREATE POLICY "Autor ou admin edita lembrete" ON lembretes_aluno FOR UPDATE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

DROP POLICY IF EXISTS "Autor ou admin apaga lembrete" ON lembretes_aluno;
CREATE POLICY "Autor ou admin apaga lembrete" ON lembretes_aluno FOR DELETE
  USING (professor_id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- Avança todos os lembretes em aberto do aluno a cada check-in; ao
-- atingir o alvo, fecha o lembrete e notifica o professor dono via a
-- tabela `notificacoes` já existente (patch 26) — mesmo padrão de
-- notificar_nova_mensagem_chat: sem policy de INSERT para o professor
-- em `notificacoes` de outro perfil, por isso tem de ser SECURITY
-- DEFINER, ou o fan-out afetaria silenciosamente 0 linhas.
CREATE OR REPLACE FUNCTION avancar_lembretes_aluno() RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS trg_avancar_lembretes ON presencas;
CREATE TRIGGER trg_avancar_lembretes
  AFTER INSERT ON presencas
  FOR EACH ROW
  WHEN (NEW.tipo = 'checkin')
  EXECUTE FUNCTION avancar_lembretes_aluno();

REVOKE EXECUTE ON FUNCTION avancar_lembretes_aluno() FROM PUBLIC;

-- ── AULA PARTICULAR (tag administrativa em alunos) ────────────
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS aula_particular BOOLEAN NOT NULL DEFAULT FALSE;

-- Reescreve restringir_update_aluno (schema.sql) só para acrescentar
-- aula_particular à mesma exceção de faixa/grau/nif/data_nascimento —
-- editável por professor (é quem sinaliza os seus alunos de
-- particulares) além de admin/superadmin/atendimento, nunca pelo
-- próprio aluno.
CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := OLD.email;

  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
    IF private.auth_role() != 'professor' THEN
      NEW.faixa           := OLD.faixa;
      NEW.grau            := OLD.grau;
      NEW.nif             := OLD.nif;
      NEW.data_nascimento := OLD.data_nascimento;
      NEW.aula_particular := OLD.aula_particular;
    END IF;
    NEW.morada                 := OLD.morada;
    NEW.cod_postal             := OLD.cod_postal;
    NEW.plano_id               := OLD.plano_id;
    NEW.plano_nome             := OLD.plano_nome;
    NEW.status                 := OLD.status;
    NEW.frequencia             := OLD.frequencia;
    NEW.responsavel            := OLD.responsavel;
    NEW.responsavel_nif        := OLD.responsavel_nif;
    NEW.responsavel_email      := OLD.responsavel_email;
    NEW.responsavel_tel        := OLD.responsavel_tel;
    NEW.enc_pagamento          := OLD.enc_pagamento;
    NEW.stripe_customer_id     := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.metodo_pagamento       := OLD.metodo_pagamento;
    NEW.numerario_aprovado     := OLD.numerario_aprovado;
    NEW.numerario_aprovado_por := OLD.numerario_aprovado_por;
    NEW.data_matricula         := OLD.data_matricula;
    NEW.profile_id             := OLD.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
