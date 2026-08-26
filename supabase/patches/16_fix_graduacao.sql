-- ============================================================
--  Patch 16 — Corrigir graduação de alunos
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Bug real, não apenas RLS: o enum belt_type só tinha as 9 faixas de
--  adulto ('branca','cinza','amarela','laranja','verde','azul','roxa',
--  'marrom','preta') — sobra de uma versão anterior do schema. O
--  frontend (src/types/index.ts Belt, src/lib/alunoDomain.ts
--  FAIXAS_KIDS/FAIXAS_ADULTO) usa 18 valores, incluindo toda a
--  progressão infantil bicolor (cinza-branca, amarela-preta, etc.) e
--  a vermelha honorária. Qualquer tentativa de graduar um aluno
--  infantil para uma faixa intermédia falhava com "invalid input
--  value for enum belt_type" — provavelmente a causa mais visível do
--  "a alteração não é guardada".
--
--  Bug secundário: mesmo com o enum corrigido, um professor a
--  graduar um aluno adulto para uma faixa válida (ex.: branca->azul)
--  falhava silenciosamente — "Atualizar aluno" (patch 10) e o trigger
--  restringir_update_aluno (patch 05/15) só tratam
--  admin/superadmin/atendimento como staff; professor não estava
--  incluído, por isso o UPDATE em alunos.faixa/grau não tinha efeito
--  nenhum (0 linhas afetadas, sem erro).
--
--  Fix: (1) estender o enum; (2) permitir professor alterar
--  especificamente faixa/grau no trigger; (3) mover toda a operação
--  de graduação para uma função registrar_graduacao() que grava o
--  histórico e atualiza o aluno atomicamente (a mesma chamada RPC
--  falha ou têm sucesso as duas escritas em conjunto) e que faz a
--  própria verificação de autorização (admin/superadmin/professor),
--  correndo como SECURITY DEFINER para não depender de alargar a
--  policy de UPDATE geral de alunos a professor.
-- ============================================================

ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'vermelha';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-preta';

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := OLD.email;

  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
    IF private.auth_role() != 'professor' THEN
      NEW.faixa := OLD.faixa;
      NEW.grau  := OLD.grau;
    END IF;
    NEW.nif                    := OLD.nif;
    NEW.morada                 := OLD.morada;
    NEW.cod_postal             := OLD.cod_postal;
    NEW.data_nascimento        := OLD.data_nascimento;
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

CREATE OR REPLACE FUNCTION registrar_graduacao(
  p_aluno_id UUID,
  p_faixa_nova belt_type,
  p_grau_novo SMALLINT,
  p_observacao TEXT DEFAULT NULL
) RETURNS graduacoes AS $$
DECLARE
  v_role TEXT := private.auth_role();
  v_aluno alunos%ROWTYPE;
  v_professor_nome TEXT;
  v_graduacao graduacoes%ROWTYPE;
BEGIN
  IF v_role NOT IN ('admin','superadmin','professor') THEN
    RAISE EXCEPTION 'Sem permissão para registar graduações' USING ERRCODE = '42501';
  END IF;

  IF p_grau_novo NOT BETWEEN 0 AND 4 THEN
    RAISE EXCEPTION 'Grau inválido: tem de estar entre 0 e 4' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_aluno FROM alunos WHERE id = p_aluno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_aluno.metodo_pagamento = 'numerario' AND v_aluno.numerario_aprovado IS NOT TRUE THEN
    RAISE EXCEPTION 'Aluno com matrícula pendente de confirmação não pode ser graduado' USING ERRCODE = '22023';
  END IF;

  SELECT nome INTO v_professor_nome FROM profiles WHERE id = auth.uid();

  INSERT INTO graduacoes (
    aluno_id, aluno_nome, faixa_anterior, grau_anterior,
    faixa_nova, grau_novo, professor_id, professor_nome, observacao
  ) VALUES (
    p_aluno_id, v_aluno.nome, v_aluno.faixa, v_aluno.grau,
    p_faixa_nova, p_grau_novo, auth.uid(), COALESCE(v_professor_nome, 'Staff'), p_observacao
  ) RETURNING * INTO v_graduacao;

  UPDATE alunos SET faixa = p_faixa_nova, grau = p_grau_novo WHERE id = p_aluno_id;

  RETURN v_graduacao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION registrar_graduacao(UUID, belt_type, SMALLINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION registrar_graduacao(UUID, belt_type, SMALLINT, TEXT) TO authenticated;
