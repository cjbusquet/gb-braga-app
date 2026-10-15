-- ============================================================
--  Patch 45 — Correções de segurança da revisão de código (out/2026)
--  Aplicar em: Supabase Dashboard → SQL Editor (de uma vez, por ordem)
--
--  1. profiles: um utilizador deixa de poder mudar o próprio `role`
--     (ex.: aluno → superadmin), `email` ou `ativo`. Só admin/superadmin
--     (e a service role) mudam papéis, e só superadmin mexe em superadmin.
--  2. handle_new_user(): o papel deixa de vir de user_metadata (que o
--     próprio utilizador controla no signUp público). Passa a vir de
--     app_metadata (só a service role escreve) e, por omissão, 'aluno'.
--     A invite-staff já faz upsert do role com a service role — continua
--     a funcionar sem alterações.
--  3. alunos (auto-registo): um aluno que cria a própria ficha não pode
--     marcar-se como pago (subscrição Stripe, numerário aprovado,
--     grupo familiar, transferência).
--  4. Check-in só para quem tem o pagamento em dia — mesma regra que o
--     frontend já aplicava (auth.tsx pagamentoPendente), agora na BD:
--       • Stripe individual: precisa de stripe_subscription_id
--       • Stripe família:    grupo_familiar com status 'ativo'
--       • Numerário:         numerario_aprovado = true
--     Ler os próprios dados (Meu Financeiro, contratos, faturas) continua
--     permitido para poderem concluir o pagamento.
--  5. pagamentos.stripe_invoice_id único — evita faturas duplicadas na
--     AT quando o Stripe reenvia o mesmo evento (ver api/stripe-webhook.ts).
--  6. grupos_familiares: professor deixa de ver NIF/email de faturação.
--  7. ranking_treinos(): alunos veem só "Nome I." dos colegas (RGPD,
--     inclui menores). Staff continua a ver o nome completo.
--  8. email_existe(): limite de pedidos por IP (anti-enumeração) e
--     função registar_tentativa() para limitar a matrícula família.
--  9. Aula particular concluída → agendada → concluída já não duplica
--     presenças.
-- 10. (2.ª revisão) alunos.grupo_familiar_id só muda por admin/atendimento;
--     aluno só insere pagamentos 'pendente' sem ids Stripe; limite do
--     email_existe também para utilizadores autenticados e com o IP real.
-- 11. Produção (verificado a 15/10/2026): remove políticas antigas que
--     existem na BD mas não no repositório e que contornariam as regras
--     acima — sobretudo "Aluno regista presença própria", que deixava
--     fazer check-in sem verificar o pagamento. As políticas são
--     permissivas (OR): basta UMA antiga para reabrir a porta.
-- ============================================================

-- ── 0. Pré-verificação: duplicados que impediriam o índice único ──────
-- Não apagamos registos financeiros automaticamente: se existirem
-- duplicados, o patch pára aqui e lista-os para tratar à mão.
DO $$
DECLARE
  v_dups TEXT;
BEGIN
  SELECT string_agg(stripe_invoice_id || ' (' || n || 'x)', ', ')
  INTO v_dups
  FROM (
    SELECT stripe_invoice_id, COUNT(*) AS n
    FROM pagamentos
    WHERE stripe_invoice_id IS NOT NULL
    GROUP BY stripe_invoice_id
    HAVING COUNT(*) > 1
  ) d;
  IF v_dups IS NOT NULL THEN
    RAISE EXCEPTION 'Existem pagamentos duplicados por stripe_invoice_id: %. Resolver antes de aplicar o patch 45.', v_dups;
  END IF;
END $$;

-- ── 1. profiles: proteger role / email / ativo ─────────────────────────
CREATE OR REPLACE FUNCTION private.proteger_profile() RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := private.auth_role();
BEGIN
  -- Sem JWT (service role, GoTrue a correr handle_new_user, SQL Editor):
  -- confiança total, como antes.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Fallback de auto-criação (auth.tsx loadProfile): só o próprio
    -- perfil, sempre como aluno e com o email real da sessão.
    IF COALESCE(v_role, '') NOT IN ('admin', 'superadmin') THEN
      NEW.role := 'aluno';
      NEW.email := COALESCE(auth.jwt() ->> 'email', NEW.email);
      NEW.ativo := TRUE;
    ELSIF NEW.role = 'superadmin' AND v_role <> 'superadmin' THEN
      RAISE EXCEPTION 'Só um superadmin pode criar superadmins' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF COALESCE(v_role, '') NOT IN ('admin', 'superadmin') THEN
    NEW.id    := OLD.id;
    NEW.role  := OLD.role;
    NEW.email := OLD.email;
    NEW.ativo := OLD.ativo;
  ELSIF v_role = 'admin'
        AND NEW.role IS DISTINCT FROM OLD.role
        AND 'superadmin' IN (NEW.role::TEXT, OLD.role::TEXT) THEN
    RAISE EXCEPTION 'Só um superadmin pode atribuir ou retirar o papel de superadmin' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION private.proteger_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_profile ON profiles;
CREATE TRIGGER trg_proteger_profile
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION private.proteger_profile();

-- ── 2. handle_new_user: papel nunca vem do utilizador ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_ja_matriculado BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM alunos WHERE email = NEW.email) INTO v_ja_matriculado;

  INSERT INTO profiles (id, nome, email, role, matricula_completa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    -- raw_app_meta_data só é escrito pela service role; user_metadata
    -- (raw_user_meta_data) é controlado pelo próprio no signUp público.
    COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'aluno'),
    v_ja_matriculado
  );

  IF v_ja_matriculado THEN
    UPDATE alunos SET profile_id = NEW.id WHERE email = NEW.email AND profile_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 3. alunos: auto-registo não se pode marcar como pago ───────────────
CREATE OR REPLACE FUNCTION private.proteger_insert_aluno() RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := COALESCE(private.auth_role(), '');
BEGIN
  IF auth.uid() IS NULL OR v_role IN ('admin', 'superadmin', 'atendimento') THEN
    RETURN NEW;
  END IF;

  -- Professor (Nova Matrícula) e auto-registo: nunca nascem "pagos".
  -- status fica como o fluxo o pediu ('ativo' Stripe / 'inativo' numerário):
  -- o acesso ao check-in depende só dos campos de pagamento abaixo.
  NEW.metodo_pagamento       := CASE WHEN NEW.metodo_pagamento = 'numerario'
                                     THEN 'numerario'::payment_method
                                     ELSE 'stripe'::payment_method END;
  NEW.numerario_aprovado     := FALSE;
  NEW.numerario_aprovado_por := NULL;
  NEW.stripe_customer_id     := NULL;
  NEW.stripe_subscription_id := NULL;
  NEW.grupo_familiar_id      := NULL;

  IF v_role <> 'professor' THEN
    -- Auto-registo: a faixa declarada mantém-se (aluno vindo de outra
    -- academia), mas grau/frequência/antiguidade não são escolhidos pelo próprio.
    NEW.profile_id      := auth.uid();
    NEW.grau            := 0;
    NEW.frequencia      := 0;
    NEW.data_matricula  := CURRENT_DATE;
    NEW.aula_particular := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION private.proteger_insert_aluno() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_proteger_insert_aluno ON alunos;
CREATE TRIGGER trg_proteger_insert_aluno
  BEFORE INSERT ON alunos
  FOR EACH ROW EXECUTE FUNCTION private.proteger_insert_aluno();

-- ── 4. Check-in só com pagamento em dia ────────────────────────────────
CREATE OR REPLACE FUNCTION private.my_aluno_id_com_acesso() RETURNS UUID AS $$
  SELECT a.id
  FROM alunos a
  LEFT JOIN grupos_familiares g ON g.id = a.grupo_familiar_id
  WHERE a.id = private.my_aluno_id()
    AND NOT (a.metodo_pagamento = 'numerario' AND a.numerario_aprovado IS NOT TRUE)
    AND NOT (
      a.metodo_pagamento = 'stripe'
      AND CASE
            WHEN a.grupo_familiar_id IS NOT NULL THEN g.status IS DISTINCT FROM 'ativo'
            ELSE a.stripe_subscription_id IS NULL
          END
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION private.my_aluno_id_com_acesso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.my_aluno_id_com_acesso() TO authenticated;

DROP POLICY IF EXISTS "Registar presença" ON presencas;
CREATE POLICY "Registar presença" ON presencas FOR INSERT WITH CHECK (
  aluno_id = (SELECT private.my_aluno_id_com_acesso())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento')
);

-- ── 5. Uma linha de pagamento por invoice Stripe ───────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagamentos_stripe_invoice
  ON pagamentos (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- ── 6. grupos_familiares: sem acesso de professor ──────────────────────
DROP POLICY IF EXISTS "Ver grupo familiar" ON grupos_familiares;
CREATE POLICY "Ver grupo familiar" ON grupos_familiares FOR SELECT USING (
  lower(titular_email) = lower((SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR id IN (SELECT grupo_familiar_id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);

-- ── 7. Ranking: nome abreviado para quem não é staff ───────────────────
CREATE OR REPLACE FUNCTION ranking_treinos(p_meses INT DEFAULT 3)
RETURNS TABLE(nome TEXT, faixa belt_type, treinos BIGINT) AS $$
  WITH r AS (
    SELECT a.id, a.nome, a.faixa, COUNT(p.id) AS treinos
    FROM alunos a
    JOIN presencas p
      ON p.aluno_id = a.id
      AND p.tipo = 'checkin'
      AND p.created_at >= GREATEST(a.data_matricula::TIMESTAMPTZ, NOW() - (p_meses || ' months')::INTERVAL)
    WHERE a.status = 'ativo'
    GROUP BY a.id, a.nome, a.faixa
  )
  SELECT
    CASE
      WHEN COALESCE(private.auth_role(), '') IN ('admin','superadmin','atendimento','professor')
           OR r.id = private.my_aluno_id()
        THEN r.nome
      -- "Maria João Silva" → "Maria S."
      WHEN position(' ' IN trim(r.nome)) > 0
        THEN split_part(trim(r.nome), ' ', 1) || ' '
             || upper(left(regexp_replace(trim(r.nome), '^.*\s', ''), 1)) || '.'
      ELSE trim(r.nome)
    END,
    r.faixa,
    r.treinos
  FROM r
  ORDER BY r.treinos DESC, r.nome ASC
  LIMIT 50;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

-- Supabase dá EXECUTE explícito a anon por omissão — não basta PUBLIC.
REVOKE EXECUTE ON FUNCTION ranking_treinos(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION ranking_treinos(INT) TO authenticated;

-- ── 8. Limite de pedidos públicos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS private.tentativas_publicas (
  id        BIGSERIAL PRIMARY KEY,
  chave     TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tentativas_chave_data
  ON private.tentativas_publicas (chave, criado_em);

-- Regista uma tentativa e diz se ainda está dentro do limite.
CREATE OR REPLACE FUNCTION private.dentro_do_limite(p_chave TEXT, p_max INT, p_janela INTERVAL)
RETURNS BOOLEAN AS $$
DECLARE
  v_n INT;
BEGIN
  DELETE FROM private.tentativas_publicas WHERE criado_em < NOW() - INTERVAL '1 day';
  INSERT INTO private.tentativas_publicas (chave) VALUES (p_chave);
  SELECT COUNT(*) INTO v_n FROM private.tentativas_publicas
  WHERE chave = p_chave AND criado_em >= NOW() - p_janela;
  RETURN v_n <= p_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION private.dentro_do_limite(TEXT, INT, INTERVAL) FROM PUBLIC, anon, authenticated;

-- IP do pedido. Preferir os cabeçalhos que o próprio Supabase/Cloudflare
-- define (o cliente não os controla); do X-Forwarded-For usar a ÚLTIMA
-- entrada (acrescentada pelo proxy), nunca a primeira (escrita pelo cliente).
CREATE OR REPLACE FUNCTION private.ip_pedido() RETURNS TEXT AS $$
  WITH h AS (SELECT NULLIF(current_setting('request.headers', true), '')::json AS j)
  SELECT COALESCE(
    NULLIF(trim(j ->> 'cf-connecting-ip'), ''),
    NULLIF(trim(j ->> 'x-real-ip'), ''),
    NULLIF(trim(regexp_replace(j ->> 'x-forwarded-for', '^.*,', '')), ''),
    'desconhecido')
  FROM h;
$$ LANGUAGE SQL STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION private.ip_pedido() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_existe(e text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Só a service role (edge function) fica fora do limite; utilizadores
  -- autenticados contam por conta, anónimos por IP.
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF NOT private.dentro_do_limite(
         'email_existe:' || COALESCE(auth.uid()::TEXT, private.ip_pedido()),
         20, INTERVAL '1 hour') THEN
      RAISE EXCEPTION 'Demasiados pedidos. Tenta mais tarde.' USING ERRCODE = '54000';
    END IF;
  END IF;
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(e)));
END;
$$;
REVOKE ALL ON FUNCTION public.email_existe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_existe(text) TO anon, authenticated, service_role;

-- Usada pela edge function criar-matricula-familia (só service role).
CREATE OR REPLACE FUNCTION public.registar_tentativa(p_chave TEXT, p_max INT, p_janela_min INT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT private.dentro_do_limite(p_chave, p_max, make_interval(mins => p_janela_min));
$$;
REVOKE ALL ON FUNCTION public.registar_tentativa(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registar_tentativa(TEXT, INT, INT) TO service_role;

-- ── 9. Aula particular: não duplicar presenças ─────────────────────────
CREATE OR REPLACE FUNCTION registar_presenca_aula_particular() RETURNS TRIGGER AS $$
DECLARE
  v_participante RECORD;
  v_ajudante_aluno_id UUID;
BEGIN
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida') THEN
    FOR v_participante IN
      SELECT aluno_id, aluno_nome FROM aulas_particulares_alunos WHERE aula_particular_id = NEW.id
    LOOP
      INSERT INTO presencas (aluno_id, aluno_nome, turma_nome, data, hora, tipo, metodo)
      SELECT v_participante.aluno_id, v_participante.aluno_nome, 'Aula Particular', NEW.data, NEW.hora_inicio, 'checkin', 'particular'
      WHERE NOT EXISTS (
        SELECT 1 FROM presencas
        WHERE aluno_id = v_participante.aluno_id AND data = NEW.data
          AND hora IS NOT DISTINCT FROM NEW.hora_inicio AND metodo = 'particular'
      );
    END LOOP;

    IF NEW.ajudante_tipo = 'aluno' THEN
      SELECT id INTO v_ajudante_aluno_id FROM alunos WHERE profile_id = NEW.ajudante_id;
      IF v_ajudante_aluno_id IS NOT NULL THEN
        INSERT INTO presencas (aluno_id, aluno_nome, turma_nome, data, hora, tipo, metodo)
        SELECT v_ajudante_aluno_id, NEW.ajudante_nome, 'Aula Particular (ajudante)', NEW.data, NEW.hora_inicio, 'checkin', 'particular'
        WHERE NOT EXISTS (
          SELECT 1 FROM presencas
          WHERE aluno_id = v_ajudante_aluno_id AND data = NEW.data
            AND hora IS NOT DISTINCT FROM NEW.hora_inicio AND metodo = 'particular'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION registar_presenca_aula_particular() FROM PUBLIC, anon, authenticated;

-- ── 10. Brechas encontradas na 2.ª revisão ─────────────────────────────
-- 10a. Aluno/professor não mudam grupo_familiar_id (ganhava check-in e
--      via o NIF/pagamentos de uma família ativa).
CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  -- Recontagens internas (atualizar_frequencia_aluno(), disparada a cada
  -- INSERT em `presencas`) correm com o role de quem despoletou esse
  -- INSERT (aluno em self-check-in, ou professor a marcar presença
  -- manual) — nenhum dos dois é staff, por isso sem este bypass o UPDATE
  -- interno a `frequencia` era sempre revertido para OLD antes de gravar
  -- (patch 41: confirmado em testes, a coluna nunca refletia presenças
  -- novas fora de uma ação direta de admin/superadmin/atendimento).
  IF current_setting('app.bypass_restricao_aluno', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- email is unconditional, even for staff: it must always match
  -- profiles.email (several RLS policies compare the two directly), and
  -- profiles.email is itself just a mirror of the real login credential
  -- in auth.users. Changing it here would silently desync both without
  -- ever touching the actual login email — changing a user's login
  -- email is a Supabase Auth operation, not a row edit on alunos.
  NEW.email := OLD.email;

  IF private.auth_role() NOT IN ('admin','superadmin','atendimento') THEN
    -- Professor keeps: faixa/grau (registrar_graduacao() is SECURITY
    -- DEFINER and bypasses RLS for its internal UPDATE, but this trigger
    -- is unconditional on the table, so it still needs an explicit
    -- carve-out or a professor-driven graduation would silently revert
    -- to OLD), nif/data_nascimento (the fields AlunosPage.tsx's
    -- EditAlunoModal sends alongside nome/telefone, which are never
    -- blocked for anyone), and aula_particular (professor is the one
    -- tagging their own private-lesson students). Without this,
    -- "editing a student" from a professor screen would silently drop
    -- those fields even once the RLS policy itself allows the UPDATE.
    IF private.auth_role() != 'professor' THEN
      NEW.faixa           := OLD.faixa;
      NEW.grau            := OLD.grau;
      NEW.nif             := OLD.nif;
      NEW.data_nascimento := OLD.data_nascimento;
      NEW.aula_particular := OLD.aula_particular;
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
    -- patch 45: o grupo familiar decide o acesso ao check-in e dá acesso
    -- ao NIF/pagamentos do titular — só admin/atendimento o mudam.
    NEW.grupo_familiar_id      := OLD.grupo_familiar_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10b. Aluno só cria pagamentos por pagar e sem ids Stripe (os pagos
--      chegam pelo webhook ou por staff).
DROP POLICY IF EXISTS "Aluno insere pagamento" ON pagamentos;
CREATE POLICY "Aluno insere pagamento" ON pagamentos FOR INSERT WITH CHECK (
  (
    aluno_id IN (SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
    AND status = 'pendente'
    AND stripe_invoice_id IS NULL
    AND stripe_payment_id IS NULL
  )
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);

-- ── 11. Políticas antigas só existentes em produção ────────────────────
-- Equivalentes atuais: "Registar presença" (com verificação de pagamento)
-- e "Atualizar aluno" (exige status 'ativo'). Em instalações novas estas
-- políticas não existem e os DROP não fazem nada.
DROP POLICY IF EXISTS "Aluno regista presença própria" ON presencas;
DROP POLICY IF EXISTS "Aluno atualiza próprio registo" ON alunos;
-- Duplicados de "Atualizar perfil" / "Inserir perfil" — inofensivos com o
-- trigger trg_proteger_profile, mas removidos para haver UMA regra por ação.
DROP POLICY IF EXISTS "Aluno atualiza próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Utilizador cria próprio perfil" ON profiles;
