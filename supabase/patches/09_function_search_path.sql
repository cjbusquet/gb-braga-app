-- ============================================================
--  Patch 09 — Function Search Path Mutable
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Aviso do Supabase Studio → Advisors, "Function Search Path
--  Mutable" (Warning), repetido em todas as funções: nenhuma tinha
--  search_path fixado. Sem isso, a função resolve nomes de tabelas
--  não qualificados (ex.: "profiles", "alunos") através do
--  search_path de quem a invoca — que um utilizador pode manipular
--  (ex.: criando um schema antes de "public" no seu próprio
--  search_path) para enganar a função a ler/escrever no sítio
--  errado. É particularmente grave aqui porque a maioria destas
--  funções é SECURITY DEFINER (corre com privilégios elevados).
--
--  Bónus: fixar o search_path de handle_new_user() também resolve
--  em definitivo o bug de "Database error creating new user" em
--  qualquer signup — supabase_auth_admin (o role que dispara este
--  trigger) tem search_path=auth só, por isso "INSERT INTO
--  profiles" nunca resolvia sem isto.
--
--  ALTER FUNCTION só define o parâmetro; não recria o corpo da
--  função, por isso é seguro correr num projeto já em produção.
-- ============================================================

ALTER FUNCTION handle_new_user()                                   SET search_path = public;
ALTER FUNCTION auth_role()                                         SET search_path = public;
ALTER FUNCTION my_aluno_id()                                       SET search_path = public;
ALTER FUNCTION restringir_update_aluno()                           SET search_path = public;
ALTER FUNCTION set_updated_at()                                    SET search_path = '';
ALTER FUNCTION calcular_frequencia(UUID, INT)                      SET search_path = public;
ALTER FUNCTION atualizar_frequencia_aluno()                        SET search_path = public;
