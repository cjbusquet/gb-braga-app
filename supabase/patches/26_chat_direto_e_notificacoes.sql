-- ============================================================
--  Patch 26 — Chat direto (aluno ↔ staff) + notificações in-app
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Contexto: ChatPage.tsx (staff) e pages/aluno/Mensagens.tsx (aluno)
--  eram inteiramente mock — estado local em React, sem tabela, sem
--  RLS, sem realtime. `mensagens` (já existente) é um log de
--  campanhas/broadcast por segmento (WhatsApp/SMS/Email/Push), não
--  uma conversa 1:1 — não dá para reaproveitar sem introduzir
--  expansão de segmento por destinatário. Esta patch cria uma tabela
--  dedicada para a conversa 1:1 e uma tabela de notificações in-app
--  (sino no header), alimentada por fan-out via trigger.
--
--  Same DDL is mirrored into schema.sql for fresh installs.
-- ============================================================

-- ── CHAT DIRETO (aluno ↔ staff) ──────────────────────────────
CREATE TABLE IF NOT EXISTS mensagens_chat (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id       UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  remetente_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remetente_role user_role NOT NULL,
  corpo          TEXT NOT NULL CHECK (length(trim(corpo)) > 0),
  lida           BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_chat_aluno     ON mensagens_chat(aluno_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_remetente ON mensagens_chat(remetente_id);

ALTER TABLE mensagens_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver conversa" ON mensagens_chat;
CREATE POLICY "Ver conversa" ON mensagens_chat FOR SELECT USING (
  aluno_id = (SELECT private.my_aluno_id())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);

DROP POLICY IF EXISTS "Enviar mensagem de chat" ON mensagens_chat;
CREATE POLICY "Enviar mensagem de chat" ON mensagens_chat FOR INSERT WITH CHECK (
  remetente_id = (SELECT auth.uid())
  AND (
    ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento') AND remetente_role = (SELECT private.auth_role())::user_role)
    OR (aluno_id = (SELECT private.my_aluno_id()) AND remetente_role = 'aluno')
  )
);

-- ── NOTIFICAÇÕES IN-APP ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo     TEXT NOT NULL,
  corpo      TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','sucesso','aviso','erro')),
  link       TEXT,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_profile ON notificacoes(profile_id, lida, created_at DESC);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver próprias notificações" ON notificacoes;
CREATE POLICY "Ver próprias notificações" ON notificacoes FOR SELECT USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Marcar própria notificação como lida" ON notificacoes;
CREATE POLICY "Marcar própria notificação como lida" ON notificacoes FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
-- Sem policy de INSERT — só o trigger SECURITY DEFINER abaixo escreve aqui.

-- ── CHAT: marcar como lida (RPC, não UPDATE direto) ──────────
CREATE OR REPLACE FUNCTION marcar_chat_lida(p_aluno_id UUID)
RETURNS VOID AS $$
BEGIN
  IF (SELECT private.auth_role()) IN ('admin','superadmin','atendimento') THEN
    UPDATE mensagens_chat SET lida = TRUE, lida_em = NOW()
    WHERE aluno_id = p_aluno_id AND remetente_role = 'aluno' AND lida = FALSE;
  ELSIF p_aluno_id = (SELECT private.my_aluno_id()) THEN
    UPDATE mensagens_chat SET lida = TRUE, lida_em = NOW()
    WHERE aluno_id = p_aluno_id AND remetente_role != 'aluno' AND lida = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION marcar_chat_lida(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION marcar_chat_lida(UUID) TO authenticated;

-- ── CHAT → NOTIFICAÇÕES (fan-out, SECURITY DEFINER) ──────────
-- Um aluno pode inserir em mensagens_chat mas não tem (nem deve ter)
-- policy de INSERT em notificacoes para outros perfis — sem
-- SECURITY DEFINER aqui, o fan-out para staff a partir de uma
-- mensagem de aluno afetaria silenciosamente 0 linhas.
CREATE OR REPLACE FUNCTION notificar_nova_mensagem_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_aluno_nome TEXT;
  v_snippet    TEXT;
BEGIN
  SELECT nome INTO v_aluno_nome FROM alunos WHERE id = NEW.aluno_id;
  v_snippet := left(NEW.corpo, 80);

  -- link guarda o id de página usado por Layout.tsx/onNavigate, não um URL.
  IF NEW.remetente_role = 'aluno' THEN
    INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
    SELECT id, 'Nova mensagem de ' || COALESCE(v_aluno_nome, 'aluno'), v_snippet, 'info', 'chat'
    FROM profiles WHERE role IN ('admin','superadmin','atendimento');
  ELSE
    INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
    SELECT profile_id, 'Nova mensagem da academia', v_snippet, 'info', 'mensagens'
    FROM alunos WHERE id = NEW.aluno_id AND profile_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notificar_nova_mensagem_chat ON mensagens_chat;
CREATE TRIGGER trg_notificar_nova_mensagem_chat
  AFTER INSERT ON mensagens_chat
  FOR EACH ROW EXECUTE FUNCTION notificar_nova_mensagem_chat();

REVOKE EXECUTE ON FUNCTION notificar_nova_mensagem_chat() FROM PUBLIC;

-- ── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
