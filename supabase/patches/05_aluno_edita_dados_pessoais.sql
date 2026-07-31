-- ============================================================
--  Patch 05 — Aluno edita os próprios dados pessoais
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: o formulário "Minha Conta" (PortalAluno.tsx →
--  EditPerfilModal) chama db.atualizarAluno(), que faz um UPDATE
--  na tabela alunos. Não existia nenhuma policy de UPDATE para o
--  aluno na própria linha — só "Admin gere alunos" (FOR ALL, restrito
--  a admin/superadmin/atendimento). O RLS bloqueava o UPDATE (0 linhas
--  afetadas), e o .single() subsequente rebentava com erro, que a UI
--  mostra como "Erro ao guardar. Tenta novamente."
--
--  Fix: adicionar a policy de UPDATE. Como RLS é ao nível da linha e
--  não da coluna, uma policy que só valide o email deixaria o aluno
--  alterar qualquer coluna da própria linha via API direta (faixa,
--  status, numerario_aprovado, etc.), não só nome/telefone/whatsapp
--  que o formulário expõe. Por isso também um trigger BEFORE UPDATE
--  que repõe o valor antigo (OLD) em todas as colunas sensíveis quando
--  quem edita não é staff.
-- ============================================================

CREATE POLICY "Aluno edita os próprios dados" ON alunos FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF auth_role() NOT IN ('admin','superadmin','atendimento') THEN
    NEW.email                  := OLD.email;
    NEW.nif                    := OLD.nif;
    NEW.morada                 := OLD.morada;
    NEW.cod_postal             := OLD.cod_postal;
    NEW.data_nascimento        := OLD.data_nascimento;
    NEW.faixa                  := OLD.faixa;
    NEW.grau                   := OLD.grau;
    NEW.plano_id               := OLD.plano_id;
    NEW.plano_nome             := OLD.plano_nome;
    NEW.status                 := OLD.status;
    NEW.frequencia             := OLD.frequencia;
    NEW.responsavel            := OLD.responsavel;
    NEW.responsavel_nif        := OLD.responsavel_nif;
    NEW.responsavel_email      := OLD.responsavel_email;
    NEW.responsavel_tel        := OLD.responsavel_tel;
    NEW.enc_pagamento          := OLD.enc_pagamento;
    NEW.stripe_customer_id     := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.metodo_pagamento       := OLD.metodo_pagamento;
    NEW.numerario_aprovado     := OLD.numerario_aprovado;
    NEW.numerario_aprovado_por := OLD.numerario_aprovado_por;
    NEW.data_matricula         := OLD.data_matricula;
    NEW.profile_id             := OLD.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restringir_update_aluno ON alunos;
CREATE TRIGGER trg_restringir_update_aluno
  BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION restringir_update_aluno();
