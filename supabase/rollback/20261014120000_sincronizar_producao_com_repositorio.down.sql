-- ============================================================
--  ROLLBACK da migração 20261014120000_sincronizar_producao_com_repositorio
--
--  ATENÇÃO: apaga as tabelas novas E os dados que entretanto lá forem
--  criados (grupos familiares, notas, lembretes, aulas particulares) e as
--  colunas novas de alunos/planos/pagamentos. Usar só se a migração
--  causar um problema grave, logo a seguir à aplicação.
--  Não remove os valores de enumeração acrescentados (limitação do
--  PostgreSQL) — não têm efeito sobre os dados existentes.
--  Falha (e não altera nada) se já existirem pagamentos de família,
--  porque aluno_id voltaria a ser obrigatório — nesse caso, pedir ajuda.
-- ============================================================
BEGIN;

DROP VIEW IF EXISTS public.v_alunos_abaixo_meta, public.v_alunos_proximos_graduacao;

DROP TRIGGER IF EXISTS trg_sync_titular_aulas ON public.turmas;
DROP TRIGGER IF EXISTS trg_avancar_lembretes  ON public.presencas;

DROP FUNCTION IF EXISTS public.ranking_treinos(int);
DROP FUNCTION IF EXISTS public.frequencia_dias_semana(uuid, int);
DROP FUNCTION IF EXISTS public.listar_professores_ativos();
DROP FUNCTION IF EXISTS public.definir_professor_aula(uuid, date, uuid);
DROP FUNCTION IF EXISTS public.email_existe(text);
DROP FUNCTION IF EXISTS public.criar_aula_particular(date, time, time, text, text, uuid, uuid[]);
DROP FUNCTION IF EXISTS public.avancar_lembretes_aluno();
DROP FUNCTION IF EXISTS public.sincronizar_titular_aulas_futuras();

DROP TABLE IF EXISTS public.aulas_particulares_alunos;
DROP TABLE IF EXISTS public.aulas_particulares;
DROP FUNCTION IF EXISTS public.notificar_ajudante_aula_particular();
DROP FUNCTION IF EXISTS public.registar_presenca_aula_particular();
DROP FUNCTION IF EXISTS private.eh_participante_particular(uuid);
DROP FUNCTION IF EXISTS private.pode_gerir_particular(uuid);
DROP TABLE IF EXISTS public.notas_aluno;
DROP TABLE IF EXISTS public.lembretes_aluno;

-- As políticas de grupos_familiares referem alunos.grupo_familiar_id
DROP POLICY IF EXISTS "Ver grupo familiar"        ON public.grupos_familiares;
DROP POLICY IF EXISTS "Admin gere grupo familiar" ON public.grupos_familiares;

ALTER TABLE public.pagamentos DROP CONSTRAINT IF EXISTS pagamento_tem_alvo;
ALTER TABLE public.pagamentos ALTER COLUMN aluno_id SET NOT NULL;
ALTER TABLE public.pagamentos DROP COLUMN IF EXISTS grupo_familiar_id;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS grupo_familiar_id;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS aula_particular;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS genero;
ALTER TABLE public.planos DROP COLUMN IF EXISTS membros;
DROP TABLE IF EXISTS public.grupos_familiares;

COMMIT;
