-- ============================================================
--  Patch 44 — Cor por turma (schedule colorido, como a ficha da academia)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  O frontend já lia `turma.cor` em vários sítios (badge, bloco no
--  horário semanal, barra de ocupação) desde sempre — mas a coluna
--  nunca chegou a existir na BD, nem havia campo nenhum para a definir
--  ao criar/editar uma turma. Sem ela, `cor` era sempre undefined e
--  todas as turmas caíam no mesmo vermelho por omissão (GB.red) — daí
--  o horário parecer monocromático em vez de colorido como a ficha
--  física da academia.
-- ============================================================

ALTER TABLE turmas ADD COLUMN IF NOT EXISTS cor TEXT;

-- Cor por omissão nas turmas já existentes (heurística pelo nome/tipo),
-- para o horário ficar colorido de imediato em vez de tudo a vermelho.
-- Uma turma sem correspondência fica sem cor (cai no vermelho da marca
-- por omissão) — editar manualmente se o nome não seguir este padrão.
UPDATE turmas SET cor = '#1E3A5F' WHERE cor IS NULL AND (nome ILIKE '%adulto%' OR nome ILIKE '%avançad%') AND tipo = 'gi';
UPDATE turmas SET cor = '#DC2626' WHERE cor IS NULL AND (tipo = 'nogi' OR nome ILIKE '%wrestling%' OR nome ILIKE '%boxe%' OR nome ILIKE '%fit%');
UPDATE turmas SET cor = '#F97316' WHERE cor IS NULL AND (tipo = 'kids' OR nivel = 'kids');
UPDATE turmas SET cor = '#64748B' WHERE cor IS NULL;
