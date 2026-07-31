-- ============================================================
--  Patch 23 — matricula_completa para aluno pré-criado pelo staff
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: um aluno criado por staff via "Nova Matrícula"
--  (NovaMatriculaModal.tsx → db.criarAluno(), que só grava a linha
--  em alunos — sem conta de login nenhuma) ficava sem forma de
--  entrar no portal quando a conta de login era criada a seguir
--  (signup normal, ou manualmente no Supabase Studio com o mesmo
--  email): handle_new_user() cria sempre matricula_completa=false,
--  e App.tsx manda qualquer aluno com matricula_completa=false
--  direto para o FluxoMatricula (ecrã de matrícula) — mesmo já tendo
--  ficha e plano criados pelo staff.
--
--  Fix: handle_new_user() verifica se já existe uma linha em alunos
--  com este email; se sim, a matrícula já está feita.
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill: contas já afetadas por este bug (perfil existe, matrícula
-- marcada como incompleta, mas já há uma linha em alunos com o mesmo
-- email).
UPDATE profiles p SET matricula_completa = true
FROM alunos a
WHERE a.email = p.email AND p.matricula_completa = false;
