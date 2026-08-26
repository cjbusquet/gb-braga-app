-- ============================================================
--  Patch 21 — Professor pode editar nome/telefone/nif/data_nascimento
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: AlunosPage.tsx's EditAlunoModal já é acessível a professor (a
--  rota 'alunos' inclui professor em App.tsx), mas "Atualizar aluno"
--  só incluía admin/superadmin/atendimento — o UPDATE ficava
--  bloqueado por completo (0 linhas afetadas), que o .single() do
--  cliente transforma no 406 "Cannot coerce the result to a single
--  JSON object" (PGRST116).
--
--  Corrigido em dois sítios, como da vez da graduação: a policy de
--  UPDATE (para o pedido sequer ser aceite) e o trigger
--  restringir_update_aluno (para nif/data_nascimento não serem
--  silenciosamente revertidos depois — nome/telefone já não eram
--  bloqueados para ninguém).
-- ============================================================

DROP POLICY IF EXISTS "Atualizar aluno" ON alunos;
CREATE POLICY "Atualizar aluno" ON alunos FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := OLD.email;

  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
    IF private.auth_role() != 'professor' THEN
      NEW.faixa           := OLD.faixa;
      NEW.grau            := OLD.grau;
      NEW.nif             := OLD.nif;
      NEW.data_nascimento := OLD.data_nascimento;
    END IF;
    NEW.morada                 := OLD.morada;
    NEW.cod_postal             := OLD.cod_postal;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
