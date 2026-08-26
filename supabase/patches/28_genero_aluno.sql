-- ============================================================
--  Patch 28 — Campo género no aluno
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Necessário para a estatística de distribuição de género no
--  resumo de aulas do professor. Opcional/nullable — não há como
--  fazer backfill dos alunos já existentes.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE genero_type AS ENUM ('feminino','masculino','outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE alunos ADD COLUMN IF NOT EXISTS genero genero_type;
