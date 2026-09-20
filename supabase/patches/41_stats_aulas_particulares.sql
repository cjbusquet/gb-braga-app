-- ============================================================
--  Patch 41 — Aulas particulares entram nas estatísticas
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  Pedido explícito: quando uma aula particular é marcada "concluída",
--  os alunos participantes (e o ajudante, se for aluno) devem ver isso
--  refletido nas suas próprias estatísticas (frequência, ranking,
--  calendário de presenças) — não é só um registo à parte.
--
--  Implementação: gerar uma linha em `presencas` por participante (e
--  pelo ajudante-aluno) quando `status` passa a 'concluida'. Reutiliza
--  toda a maquinaria já existente (calcular_frequencia, ranking_treinos,
--  CalendarioPresencas) em vez de as reescrever para também olhar para
--  `aulas_particulares` — `turma_id`/`aula_id` ficam NULL (não é uma
--  turma de grupo), `turma_nome` fica "Aula Particular" para aparecer
--  identificável no histórico do aluno.
--
--  Correção necessária em calcular_frequencia(): o denominador ("quantos
--  dias a academia teve treino") contava QUALQUER presença, incluindo
--  agora particulares — o que inflacionaria a frequência de TODOS OS
--  OUTROS alunos por causa de uma aula que só um teve. Uma particular
--  continua a contar a favor do próprio aluno (numerador), só deixa de
--  contar para o denominador partilhado.
--
--  Bug pré-existente encontrado ao testar o ponto acima (não é
--  específico de aulas particulares — afeta TODO check-in real):
--  restringir_update_aluno() reverte `frequencia` para OLD.frequencia
--  sempre que quem fez o pedido não é admin/superadmin/atendimento —
--  incluindo quando é o PRÓPRIO SISTEMA a recalculá-la
--  (atualizar_frequencia_aluno(), disparada a cada INSERT em
--  `presencas`). Um aluno a fazer self-check-in, ou um professor a
--  marcar presença manual, correm como o seu próprio role — nenhum dos
--  dois está na lista de staff — por isso esse UPDATE interno era
--  sempre silenciosamente anulado antes de gravar. `alunos.frequencia`
--  só ficava correta quando recalculada manualmente (ex.: patch 36) ou
--  por uma ação direta de staff. Confirmado em testes: uma presença
--  nova mudava calcular_frequencia() ao vivo mas não a coluna
--  guardada. Corrigido com uma flag de bypass local à transação — o
--  mesmo tipo de exceção que já existe (comentário mais abaixo) para
--  faixa/grau em registrar_graduacao().
-- ============================================================

CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
  -- Recontagens internas (atualizar_frequencia_aluno(), abaixo) correm
  -- com o role de quem despoletou o INSERT em `presencas` — sem este
  -- bypass, a frequência nunca reflete presenças novas fora de uma ação
  -- direta de admin/superadmin/atendimento (ver nota acima).
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION calcular_frequencia(p_aluno_id UUID, p_meses INT DEFAULT 3)
RETURNS INT AS $$
DECLARE total_aulas INT; aulas_aluno INT; desde TIMESTAMPTZ;
BEGIN
  SELECT GREATEST(a.data_matricula::TIMESTAMPTZ, NOW() - (p_meses || ' months')::INTERVAL)
    INTO desde
  FROM alunos a WHERE a.id = p_aluno_id;
  IF desde IS NULL THEN RETURN 0; END IF;

  -- Só dias de turma (aula de grupo) contam para o denominador — uma
  -- particular não é uma oportunidade de treino aberta a todo o cohort.
  SELECT COUNT(DISTINCT data) INTO total_aulas FROM presencas
  WHERE created_at >= desde AND tipo = 'checkin' AND turma_id IS NOT NULL;
  -- Numerador continua a incluir tudo — uma particular conta a favor
  -- do próprio aluno.
  SELECT COUNT(DISTINCT data) INTO aulas_aluno FROM presencas
  WHERE aluno_id = p_aluno_id AND tipo = 'checkin' AND created_at >= desde;
  IF total_aulas = 0 THEN RETURN 0; END IF;
  RETURN LEAST(100, ROUND((aulas_aluno::NUMERIC / total_aulas) * 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ativa o bypass acima só à volta do UPDATE interno — is_local=true
-- confina a flag à transação corrente (limpa sozinha no fim), mas
-- repõe-se explicitamente já a seguir por defesa em profundidade quando
-- várias presenças são inseridas na mesma transação (ex.: uma aula
-- particular com vários alunos, cada INSERT dispara este trigger).
CREATE OR REPLACE FUNCTION atualizar_frequencia_aluno()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.bypass_restricao_aluno', 'on', true);
  UPDATE alunos SET frequencia = calcular_frequencia(NEW.aluno_id) WHERE id = NEW.aluno_id;
  PERFORM set_config('app.bypass_restricao_aluno', 'off', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Gera presenças a partir de uma aula particular concluída — participantes
-- e, se o ajudante for um aluno, também o ajudante.
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
      VALUES (v_participante.aluno_id, v_participante.aluno_nome, 'Aula Particular', NEW.data, NEW.hora_inicio, 'checkin', 'particular');
    END LOOP;

    IF NEW.ajudante_tipo = 'aluno' THEN
      SELECT id INTO v_ajudante_aluno_id FROM alunos WHERE profile_id = NEW.ajudante_id;
      IF v_ajudante_aluno_id IS NOT NULL THEN
        INSERT INTO presencas (aluno_id, aluno_nome, turma_nome, data, hora, tipo, metodo)
        VALUES (v_ajudante_aluno_id, NEW.ajudante_nome, 'Aula Particular (ajudante)', NEW.data, NEW.hora_inicio, 'checkin', 'particular');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_presenca_aula_particular ON aulas_particulares;
CREATE TRIGGER trg_presenca_aula_particular
  AFTER INSERT OR UPDATE OF status ON aulas_particulares
  FOR EACH ROW
  EXECUTE FUNCTION registar_presenca_aula_particular();

REVOKE EXECUTE ON FUNCTION registar_presenca_aula_particular() FROM PUBLIC;
