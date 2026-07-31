-- ============================================================
--  Patch 24 — "Suspender" e "Tornar Inativo" passam a bloquear
--             o acesso do aluno, em vez de serem só uma etiqueta
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: AlunosPage.tsx já tinha os botões "Suspender" e "Tornar
--  Inativo" (changeStatus()), e os diálogos de confirmação já
--  prometiam "O acesso será bloqueado temporariamente" / "O perfil
--  ficará arquivado" — mas a coluna alunos.status nunca era lida por
--  nenhuma policy de RLS nem pelo login. Um aluno "suspenso" ou
--  "inativo" continuava com login e acesso 100% normais; só mudava
--  uma etiqueta visual.
--
--  Fix (2 camadas, a mesma que os outros patches desta app usam:
--  DB é a fonte da verdade, o frontend só reflete):
--
--  1. Trigger em alunos: sempre que status muda, sincroniza
--     auth.users.banned_until — é o GoTrue (servidor de auth) que
--     passa a recusar login/refresh de token, não uma verificação de
--     frontend que dá para saltar com uma chamada directa à API.
--
--  2. private.my_aluno_id() passa a devolver NULL quando o aluno não
--     está 'ativo'. Esta função já é o ponto único usado pelas
--     policies de self-service de inscricoes_turma, presencas,
--     pagamentos, chat, aluno_responsaveis, professor_checkins, etc.
--     — bloqueá-la aqui bloqueia tudo isso de uma vez, sem tocar
--     policy a policy. Cobre o intervalo entre a suspensão e o
--     access_token (ainda válido) expirar.
--
--  "Atualizar aluno" (UPDATE) também passa a exigir status='ativo'
--  para a auto-edição do próprio aluno — staff continua a poder
--  editar/reativar sempre.
-- ============================================================

-- ── 1. Sincronizar banned_until com o status ──────────────────
-- NOTA: 'infinity'::timestamptz não serve aqui — o GoTrue (Go) lê
-- banned_until para um time.Time nativo, que não sabe representar o
-- valor especial "infinity" do Postgres. Isto falha com 500 "Database
-- error querying schema" no login do próprio aluno banido, e também
-- em qualquer chamada da Admin API que percorra auth.users (ex.:
-- admin.auth.admin.listUsers(), usado por seed.mjs). Usa-se uma data
-- bem distante em vez disso.
CREATE OR REPLACE FUNCTION sincronizar_ban_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE auth.users
    SET banned_until = CASE WHEN NEW.status = 'ativo' THEN NULL ELSE (now() + interval '100 years') END
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sincronizar_ban_aluno ON alunos;
CREATE TRIGGER trg_sincronizar_ban_aluno
  AFTER UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION sincronizar_ban_aluno();

REVOKE EXECUTE ON FUNCTION sincronizar_ban_aluno() FROM PUBLIC;

-- Backfill: alunos já suspensos/inativos antes deste patch existir,
-- que ainda tenham auth.users.banned_until em aberto. Mesma nota do
-- 'infinity' acima aplica-se aqui — NÃO usar 'infinity'::timestamptz.
UPDATE auth.users u SET banned_until = now() + interval '100 years'
FROM alunos a
WHERE a.profile_id = u.id AND a.status <> 'ativo'
  AND (u.banned_until IS NULL OR u.banned_until < now());

-- ── 2. my_aluno_id() devolve NULL para quem não está ativo ────
CREATE OR REPLACE FUNCTION private.my_aluno_id() RETURNS UUID AS $$
  SELECT id FROM alunos
  WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND status = 'ativo';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- ── 3. Auto-edição do próprio aluno exige status='ativo' ──────
DROP POLICY IF EXISTS "Atualizar aluno" ON alunos;
CREATE POLICY "Atualizar aluno" ON alunos FOR UPDATE
  USING (
    (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) AND status = 'ativo')
    OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
  )
  WITH CHECK (
    (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) AND status = 'ativo')
    OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
  );
