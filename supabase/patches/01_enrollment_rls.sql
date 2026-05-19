-- ============================================================
--  Patch 01 — Enrollment self-registration RLS policies
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Safe to run on an existing database (uses IF NOT EXISTS style
--  via CREATE POLICY — will error if policy already exists, so
--  drop first if re-running).
-- ============================================================

-- ── 1. Aluno can insert their OWN record during enrollment ────
-- (profile is created by the trigger before this runs, so
--  profiles.email is already there)
CREATE POLICY "Aluno auto-registo" ON alunos
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR auth_role() IN ('admin','superadmin','atendimento')
  );

-- ── 2. Aluno can insert their own contract ────────────────────
CREATE POLICY "Aluno insere contrato" ON contratos
  FOR INSERT
  WITH CHECK (
    aluno_id IN (
      SELECT id FROM alunos
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
    OR auth_role() IN ('admin','superadmin')
  );

-- ── 3. Aluno can insert their own payment record ──────────────
CREATE POLICY "Aluno insere pagamento" ON pagamentos
  FOR INSERT
  WITH CHECK (
    aluno_id IN (
      SELECT id FROM alunos
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
    OR auth_role() IN ('admin','superadmin')
  );

-- ── 4. Aluno can submit a cash-payment request ────────────────
CREATE POLICY "Aluno submete numerario" ON pedidos_numerario
  FOR INSERT
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR auth_role() IN ('admin','superadmin','atendimento')
  );

-- ── 5. Any authenticated user can update their OWN profile ────
-- (needed to set matricula_completa = true/false after enrollment)
CREATE POLICY "Aluno atualiza próprio perfil" ON profiles
  FOR UPDATE
  USING (id = auth.uid());
