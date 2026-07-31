-- ============================================================
--  Patch 11 — Public Can Execute SECURITY DEFINER Function
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Aviso do Supabase Studio → Advisors: por defeito, o Postgres
--  concede EXECUTE a PUBLIC em toda função nova, o que significa que
--  anon/authenticated conseguem chamar qualquer uma diretamente via
--  /rest/v1/rpc/<funcao> — não só através do trigger/RLS para que
--  foram escritas.
--
--  Funções-trigger (handle_new_user, restringir_update_aluno,
--  set_updated_at, atualizar_frequencia_aluno) são invocadas
--  internamente quando o respetivo trigger dispara — isso não
--  verifica o privilégio EXECUTE da sessão que originou a query —
--  por isso revogar EXECUTE de todos é seguro e não afeta nenhum
--  comportamento da app.
--
--  calcular_frequencia() não é trigger e nunca é chamada pelo
--  frontend (sem uso de .rpc() em src/), mas aceitava um p_aluno_id
--  arbitrário sem verificar dono — qualquer pessoa, incluindo anon,
--  conseguia chamá-la diretamente e ler a frequência de qualquer
--  aluno. Revogar o EXECUTE público fecha isto; o único chamador
--  real (atualizar_frequencia_aluno, também SECURITY DEFINER)
--  continua a funcionar porque corre como o dono da função, que
--  mantém sempre EXECUTE nas suas próprias funções.
--
--  auth_role() e my_aluno_id() são a exceção: são chamadas de DENTRO
--  de todas as RLS policies deste schema, avaliadas com o papel de
--  quem faz a query — por isso anon e authenticated têm de manter
--  EXECUTE, ou toda a RLS parava de funcionar. O Advisor vai continuar
--  a assinalar estas duas; é uma exceção aceite e deliberada, não um
--  esquecimento. Ambas não recebem argumentos e só devolvem factos
--  sobre a própria sessão de quem chama, por isso a exposição direta
--  via RPC não representa risco.
-- ============================================================

REVOKE EXECUTE ON FUNCTION handle_new_user()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION restringir_update_aluno()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION set_updated_at()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION calcular_frequencia(UUID, INT)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION atualizar_frequencia_aluno()    FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION auth_role()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION my_aluno_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_role()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION my_aluno_id() TO anon, authenticated;
