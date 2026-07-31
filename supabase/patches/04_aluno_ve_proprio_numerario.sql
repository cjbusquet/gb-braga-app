-- ============================================================
--  Patch 04 — Aluno vê o próprio pedido de numerário
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: um aluno pode SUBMETER um pedido de pagamento em numerário
--  ("Aluno submete numerario" INSERT, ver patch 01) mas não existe
--  nenhuma policy de SELECT que lhe permita voltar a ler o próprio
--  pedido depois — só admin/atendimento/superadmin conseguem. Isto
--  impede a app de mostrar ao aluno se a matrícula ainda está
--  pendente de confirmação (ver App.tsx: ecrã "Aguardando
--  Confirmação de Matrícula").
-- ============================================================

CREATE POLICY "Aluno vê o próprio pedido de numerario" ON pedidos_numerario
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR auth_role() IN ('admin','superadmin','atendimento')
  );
