-- ============================================================
--  Patch 12 — Hide auth_role()/my_aluno_id() from the exposed API
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Aviso do Supabase Studio → Advisors: "Public Can Execute
--  SECURITY DEFINER Function" / "Signed-In Users Can Execute
--  SECURITY DEFINER Function" em public.auth_role() e
--  public.my_aluno_id(). Ao contrário das outras funções já tratadas
--  no patch 11, estas duas não podem simplesmente perder o EXECUTE
--  de anon/authenticated — são chamadas de DENTRO de todas as RLS
--  policies deste schema, avaliadas com o papel de quem faz a
--  query, por isso ambos os papéis têm mesmo de conseguir chamá-las
--  ou a RLS inteira para de funcionar.
--
--  Fix real (não uma exceção aceite): mover as duas para um schema
--  "private" que não está na lista de schemas expostos pelo
--  PostgREST (Project Settings → API → Exposed schemas — por
--  omissão só "public"). Um schema fora dessa lista nunca ganha
--  endpoint /rest/v1/rpc/<fn>, mas continua totalmente utilizável
--  a partir de RLS policies em "public" (que passam a chamar
--  private.auth_role() / private.my_aluno_id() pelo nome
--  qualificado). Resultado: RLS continua a funcionar exatamente
--  igual, mas as duas funções deixam de ser alcançáveis via API.
--
--  Ordem importa: cria-se o schema + as novas funções primeiro,
--  depois todas as policies (e o trigger restringir_update_aluno)
--  são atualizadas via ALTER POLICY para apontar para as novas
--  funções, e só no fim se apaga a versão antiga em "public" — nessa
--  altura já não tem nenhuma policy dependente.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

CREATE FUNCTION private.auth_role() RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE FUNCTION private.my_aluno_id() RETURNS UUID AS $$
  SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.auth_role()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.my_aluno_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.auth_role()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.my_aluno_id() TO anon, authenticated;

-- PLANOS
ALTER POLICY "Ver planos"            ON planos USING (ativo = true OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin insere planos"   ON planos WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Admin atualiza planos" ON planos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Admin apaga planos"    ON planos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- PROFILES
ALTER POLICY "Perfil próprio"      ON profiles USING (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin insere perfis" ON profiles WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Atualizar perfil" ON profiles
  USING (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- ALUNOS
ALTER POLICY "Aluno vê dados" ON alunos USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
ALTER POLICY "Aluno auto-registo" ON alunos WITH CHECK (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
ALTER POLICY "Atualizar aluno" ON alunos
  USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'))
  WITH CHECK (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin apaga alunos" ON alunos USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- TURMAS ("Ver turmas" doesn't reference auth_role/my_aluno_id, untouched)
ALTER POLICY "Admin cria turmas"     ON turmas WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin atualiza turmas" ON turmas USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin apaga turmas"    ON turmas USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- INSCRIÇÕES EM TURMA
ALTER POLICY "Aluno vê a própria inscrição" ON inscricoes_turma USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
ALTER POLICY "Admin cria inscrições"     ON inscricoes_turma WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin atualiza inscrições" ON inscricoes_turma USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
ALTER POLICY "Admin apaga inscrições"    ON inscricoes_turma USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- PAGAMENTOS
ALTER POLICY "Aluno vê pagamentos" ON pagamentos USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Aluno insere pagamento" ON pagamentos WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
ALTER POLICY "Admin atualiza pagamentos" ON pagamentos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Admin apaga pagamentos"    ON pagamentos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- PRESENÇAS
ALTER POLICY "Ver presenças"     ON presencas USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento'));
ALTER POLICY "Registar presença" ON presencas WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento'));

-- CONTRATOS
ALTER POLICY "Ver contrato" ON contratos USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Aluno insere contrato" ON contratos WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
ALTER POLICY "Admin atualiza contratos" ON contratos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
ALTER POLICY "Admin apaga contratos"    ON contratos USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- TOConline
ALTER POLICY "Ver faturas" ON toc_documentos USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- NUMERÁRIO
ALTER POLICY "Aluno vê o próprio pedido de numerario" ON pedidos_numerario USING (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
ALTER POLICY "Aluno submete numerario" ON pedidos_numerario WITH CHECK (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
ALTER POLICY "Superadmin atualiza numerario" ON pedidos_numerario USING ((SELECT private.auth_role()) = 'superadmin');
ALTER POLICY "Superadmin apaga numerario"   ON pedidos_numerario USING ((SELECT private.auth_role()) = 'superadmin');

-- MENSAGENS
ALTER POLICY "Admin gere mensagens" ON mensagens USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- ACCESS_LOGS
ALTER POLICY "Admin vê access_logs" ON access_logs USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- Agora que nenhuma policy/trigger depende da versão antiga, apagar
-- as funções públicas — isto é o que efetivamente remove os
-- endpoints /rest/v1/rpc/auth_role e /rest/v1/rpc/my_aluno_id.
DROP FUNCTION IF EXISTS public.auth_role();
DROP FUNCTION IF EXISTS public.my_aluno_id();
