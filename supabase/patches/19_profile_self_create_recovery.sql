-- ============================================================
--  Patch 19 — Restaurar o fallback de auto-criação de perfil
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  auth.tsx's loadProfile() tem um caminho de recuperação: se
--  profiles não tiver a linha do utilizador autenticado (ex.:
--  handle_new_user() não disparou, ou a sessão ficou órfã depois do
--  utilizador subjacente ser recriado), tenta INSERT-la a si próprio.
--  Esse fallback dependia de uma policy ("Utilizador cria próprio
--  perfil", documentada em supabase/patches/02_profile_self_create.sql)
--  que nunca chegou a ser incorporada no schema.sql atual — o INSERT
--  em profiles só tinha "Admin insere perfis" (admin/superadmin). Sem
--  a policy, o fallback falhava sempre com "new row violates row-level
--  security policy for table profiles", deixando o utilizador preso
--  permanentemente em "Profile not found", sem forma de recuperar.
--
--  Fix: fundir a condição de auto-inserção na policy de INSERT já
--  existente (mantendo "um policy por ação", ver patch 10) em vez de
--  reintroduzir uma segunda policy permissiva para a mesma ação.
-- ============================================================

DROP POLICY IF EXISTS "Admin insere perfis" ON profiles;
CREATE POLICY "Inserir perfil" ON profiles FOR INSERT WITH CHECK (
  id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
