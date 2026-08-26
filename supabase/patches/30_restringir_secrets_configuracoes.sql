-- ============================================================
--  Patch 30 — Restringir leitura de secrets em `configuracoes`
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  A policy "Ver configuracoes" permitia SELECT a qualquer
--  utilizador autenticado (incluindo role 'aluno'), porque
--  ModulosProvider (secao='modulos') e as páginas de check-in
--  (secao='academia', via MeuCheckin/KioskMode/CheckinPage)
--  precisam de ler a tabela para todos os papéis.
--
--  Isso arrastava as secoes toconline/stripe/whatsapp/email/
--  compliance, que guardam credenciais reais (Client Secret,
--  chaves Stripe sk_/whsec_, token WhatsApp) — qualquer aluno
--  conseguia lê-las com supabase.from('configuracoes').select('*')
--  diretamente do browser, sem precisar de ver a página de
--  Configurações (essa proteção é só de frontend, em App.tsx).
--
--  Mantém leitura ampla apenas para as secoes sem secrets
--  ('academia','modulos'); as restantes passam a exigir
--  admin/superadmin, igual às policies de INSERT/UPDATE já
--  existentes nesta tabela.
-- ============================================================

DROP POLICY IF EXISTS "Ver configuracoes" ON configuracoes;
CREATE POLICY "Ver configuracoes" ON configuracoes FOR SELECT USING (
  (secao IN ('academia','modulos') AND (SELECT auth.uid()) IS NOT NULL)
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
