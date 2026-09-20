-- ============================================================
--  Patch 34 — RPC público email_existe(text)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  O fluxo de matrícula (FichaInscricao) precisa de saber, ANTES
--  de o utilizador assinar o contrato e escolher o plano, se o
--  email já tem conta — senão o signUp falha no fim e obriga a
--  refazer a ficha toda.
--
--  auth.users não é legível pelo role anon, por isso expomos uma
--  função SECURITY DEFINER mínima que devolve só um booleano.
--  Enumeração de emails já era possível pela mensagem de erro do
--  signUp ("already registered"), portanto não abre superfície nova.
-- ============================================================

CREATE OR REPLACE FUNCTION public.email_existe(e text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(e))
  );
$$;

REVOKE ALL ON FUNCTION public.email_existe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_existe(text) TO anon, authenticated;
