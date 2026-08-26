-- ============================================================
--  Patch 25 — alunos.profile_id nunca era ligado para quem foi
--             pré-criado pelo staff e só depois cria a conta de login
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: handle_new_user() (patch 23) já detecta e liga
--  matricula_completa quando encontra uma linha em alunos pré-criada
--  pelo staff com o mesmo email, mas NUNCA escrevia alunos.profile_id
--  = NEW.id. Essa coluna ficava NULL para sempre nessas contas.
--
--  Isto passou despercebido até agora porque nada dependia dela — até
--  o patch 24 (Suspender/Tornar Inativo), cujo
--  sincronizar_ban_aluno() só actua "IF NEW.profile_id IS NOT NULL".
--  Resultado: suspender/inativar um aluno destes mudava o status na
--  UI, mas o login continuava 100% aberto — profile_id NULL fazia o
--  trigger do patch 24 não ter nenhum auth.users para bloquear.
--
--  Fix: handle_new_user() liga profile_id no momento do signup, e
--  um backfill de uma vez corrige as contas já afectadas.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ja_matriculado BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM alunos WHERE email = NEW.email) INTO v_ja_matriculado;

  INSERT INTO profiles (id, nome, email, role, matricula_completa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'),
    v_ja_matriculado
  );

  -- Liga o registo pré-criado pelo staff (sem profile_id, sem conta de
  -- login) à conta agora criada. TEM de vir DEPOIS do INSERT acima:
  -- alunos.profile_id tem FK para profiles(id), e NEW.id só passa a
  -- existir em profiles nesse INSERT — sincronizar_ban_aluno() do
  -- patch 24 só actua "IF NEW.profile_id IS NOT NULL", por isso sem
  -- isto profile_id fica NULL para sempre nestas contas.
  IF v_ja_matriculado THEN
    UPDATE alunos SET profile_id = NEW.id WHERE email = NEW.email AND profile_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill: contas já afectadas por este bug (têm profiles/auth.users
-- correspondente pelo email, mas alunos.profile_id ficou NULL).
UPDATE alunos a SET profile_id = p.id
FROM profiles p
WHERE a.email = p.email AND a.profile_id IS NULL;
