-- ============================================================
--  Patch 15 — Lock alunos.email at the DB layer
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug: AlunosPage.tsx (admin) allowed editing alunos.email freely.
--  That column is never the login credential (auth.users.email is),
--  and profiles.email is a mirror of it — several RLS policies
--  ("Aluno vê dados", "Atualizar aluno", "Aluno vê o próprio pedido
--  de numerario", ...) match rows on alunos.email = profiles.email.
--  Editing alunos.email without touching auth.users/profiles both
--  desyncs the student's displayed email from their real login AND
--  can lock them out of their own alunos row once the two no longer
--  match. A UI-only fix (disabling the field) doesn't stop a direct
--  API call from doing the same thing, so this is enforced in the
--  restringir_update_aluno trigger instead — unconditionally, even
--  for staff. Changing a user's login email is a Supabase Auth
--  operation, not a row edit on alunos.
-- ============================================================

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := OLD.email;

  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
