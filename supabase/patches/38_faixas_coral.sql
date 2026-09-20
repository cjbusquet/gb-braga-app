-- ============================================================
--  Patch 38 — Faixas coral (vermelha-preta, vermelha-branca)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  belt_type já tinha 'vermelha' (9º/10º grau, honorária) mas saltava
--  diretamente de 'preta' para lá — faltavam as duas faixas coral (7º e
--  8º grau de faixa preta): vermelha-preta e vermelha-branca. São graus
--  normais da progressão (não honorários como a vermelha pura), por
--  isso entram em FAIXAS_ADULTO/FAIXAS_PROGRESSAO no frontend também.
--
--  ALTER TYPE ... ADD VALUE não pode correr dentro de uma transação
--  com outros comandos que já usem o tipo na mesma transação — por
--  isso este patch só faz os dois ADD VALUE, nada mais.
-- ============================================================

ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'vermelha-preta' BEFORE 'vermelha';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'vermelha-branca' BEFORE 'vermelha';
