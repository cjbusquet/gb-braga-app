-- ============================================================
--  Patch 02 — Robust profile creation
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Make handle_new_user trigger idempotent so it never
--    blocks auth.users INSERT even if a profile already exists
--    (e.g. email UNIQUE conflict from a prior registration attempt)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow an authenticated user to INSERT their own profile row
--    (fallback if the trigger didn't create it, e.g. first-run or error)
DROP POLICY IF EXISTS "Utilizador cria próprio perfil" ON profiles;
CREATE POLICY "Utilizador cria próprio perfil" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());
