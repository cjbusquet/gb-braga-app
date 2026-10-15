# Testes de segurança da BD (RLS / triggers)

Correm contra um Postgres local qualquer (sem Supabase) — `supabase_stub.sql`
imita o mínimo do Supabase (`auth.users`, `auth.uid()`, roles `anon` /
`authenticated` / `service_role`).

```bash
npm i --no-save pg
# Postgres a escutar em /tmp/pgtest:55432 (ajustar em aplicar.mjs / *.test.mjs)
node supabase/tests/aplicar.mjs teste supabase/tests/supabase_stub.sql supabase/schema.sql
node supabase/tests/seguranca_45.test.mjs teste
```

Cenário igual à PRODUÇÃO (esquema antigo + políticas que só existem lá):

```bash
node supabase/tests/aplicar.mjs prod supabase/tests/supabase_stub.sql <esquema antigo>.sql \
  supabase/migrations/20261014120000_sincronizar_producao_com_repositorio.sql \
  supabase/tests/legado_producao.sql \
  supabase/migrations/20261015090000_seguranca_revisao.sql
node supabase/tests/seguranca_45.test.mjs prod
```

Tudo corre dentro de uma transação com ROLLBACK — não deixa dados.
