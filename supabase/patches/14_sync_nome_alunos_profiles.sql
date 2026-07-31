-- ============================================================
--  Patch 14 — Sincronizar nome entre alunos e profiles
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: alunos.nome e profiles.nome são duas colunas independentes
--  para a mesma pessoa. "Minha Conta" (PortalAluno.tsx) só escreve
--  em alunos.nome; "O meu Perfil" (PerfilPage.tsx) só escreve em
--  profiles.nome — nada os mantinha sincronizados, por isso editar
--  um deixava o outro (e tudo o que lê dele, ex.: saudação no
--  sidebar vs. hero do portal) desatualizado.
--
--  SECURITY DEFINER importa aqui para além de convenção: atendimento
--  pode atualizar alunos.nome via AlunosPage.tsx mas não está na
--  lista de staff da policy "Atualizar perfil" — sem bypassar RLS a
--  escrita em cascata para profiles afetaria silenciosamente 0
--  linhas. O guard IS DISTINCT FROM (na condição E no WHERE do
--  UPDATE) impede as duas triggers de entrarem em ciclo uma com a
--  outra.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_aluno_nome_to_profile() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE profiles SET nome = NEW.nome WHERE id = NEW.profile_id AND nome IS DISTINCT FROM NEW.nome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_profile_nome_to_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE alunos SET nome = NEW.nome WHERE profile_id = NEW.id AND nome IS DISTINCT FROM NEW.nome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_aluno_nome ON alunos;
CREATE TRIGGER trg_sync_aluno_nome AFTER UPDATE OF nome ON alunos FOR EACH ROW EXECUTE FUNCTION sync_aluno_nome_to_profile();

DROP TRIGGER IF EXISTS trg_sync_profile_nome ON profiles;
CREATE TRIGGER trg_sync_profile_nome AFTER UPDATE OF nome ON profiles FOR EACH ROW EXECUTE FUNCTION sync_profile_nome_to_aluno();

REVOKE EXECUTE ON FUNCTION sync_aluno_nome_to_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION sync_profile_nome_to_aluno() FROM PUBLIC;

-- One-off backfill: reconcile any existing drift between the two
-- tables right now, preferring alunos.nome (the more recently
-- touched record for most existing rows) as the source of truth.
UPDATE profiles p SET nome = a.nome
FROM alunos a
WHERE a.profile_id = p.id AND a.nome IS DISTINCT FROM p.nome;
