-- ============================================================
--  Patch 33 — Professor por aula (substituições self-service)
--  Aplicar em: Supabase Dashboard → SQL Editor
--
--  O "professor de uma aula" estava meio-feito:
--
--    turmas.professor_id  — titular da turma (conta). Agora editável
--                           no admin (TurmasPage), antes só via seed.
--    aulas.professor_id    — quem dá ESTA ocorrência. Materializada por
--                           obter_ou_criar_aula (1º check-in → titular)
--                           ou iniciar_aula (reivindicar hoje).
--
--  iniciar_aula() sobrescrevia à força e só servia para "hoje". Não
--  havia forma de o titular se retirar, de escolher um substituto,
--  nem de outro professor assumir uma aula que ficou sem ninguém —
--  e nada disto para dias futuros.
--
--  definir_professor_aula() cobre os 3 casos, para hoje e futuro:
--    • titular retira-se          → p_professor_id = NULL
--    • titular escolhe substituto  → p_professor_id = <outro>
--    • professor assume vaga       → p_professor_id = auth.uid(), só
--                                    se a aula estiver sem professor
--                                    (ou já for dele / for o titular)
--  Tirar um professor NOMEADO de uma aula fica reservado a admin.
--
--  listar_professores_ativos() existe porque a policy "Perfil próprio"
--  impede um professor de ler o perfil de outro — sem isto o seletor
--  de substituto não teria dados.
--
--  iniciar_aula()/concluir_aula() deixam de ser usadas pelo frontend
--  (ficam no schema; remoção futura).
-- ============================================================

-- ── listar_professores_ativos ────────────────────────────────
-- SECURITY DEFINER: contorna "Perfil próprio" (SELECT em profiles só
-- devolve o próprio perfil a quem não é admin). Só id/nome/faixa,
-- nada sensível.
CREATE OR REPLACE FUNCTION listar_professores_ativos()
RETURNS TABLE(id UUID, nome TEXT, faixa belt_type) AS $$
  SELECT p.id, p.nome, COALESCE(pe.faixa, 'preta')
  FROM profiles p
  LEFT JOIN professor_extras pe ON pe.id = p.id
  WHERE p.role = 'professor'
  ORDER BY p.nome;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

REVOKE EXECUTE ON FUNCTION listar_professores_ativos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION listar_professores_ativos() TO authenticated;

-- ── definir_professor_aula ───────────────────────────────────
-- Materializa a aula (turma_id, data) se ainda não existe e define
-- o seu professor. p_professor_id NULL = aula sem professor.
-- Só mexe no professor: status/hora_inicio/presenças ficam intactos.
CREATE OR REPLACE FUNCTION definir_professor_aula(
  p_turma_id UUID,
  p_data DATE,
  p_professor_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_role  TEXT := private.auth_role();
  v_uid   UUID := auth.uid();
  v_turma turmas%ROWTYPE;
  v_aula  aulas%ROWTYPE;
  v_aula_existe BOOLEAN;
  v_atual UUID;          -- professor efetivo atual da ocorrência
  v_nome  TEXT;
  v_alvo_role TEXT;
  v_aula_id UUID;
BEGIN
  IF v_role NOT IN ('professor','admin','superadmin') THEN
    RAISE EXCEPTION 'Sem permissão para definir o professor de uma aula' USING ERRCODE = '42501';
  END IF;

  IF p_data < CURRENT_DATE THEN
    RAISE EXCEPTION 'Não é possível alterar o professor de uma aula passada' USING ERRCODE = '22007';
  END IF;

  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- Professor efetivo atual: se a linha de `aulas` já existe, é o dela
  -- (NULL = aula explicitamente sem professor, pode ser assumida por
  -- qualquer um). Se ainda não existe, herda o titular da turma.
  SELECT * INTO v_aula FROM aulas WHERE turma_id = p_turma_id AND data = p_data;
  v_aula_existe := FOUND;
  v_atual := CASE WHEN v_aula_existe THEN v_aula.professor_id ELSE v_turma.professor_id END;

  IF p_professor_id IS NOT NULL THEN
    SELECT role, nome INTO v_alvo_role, v_nome FROM profiles WHERE id = p_professor_id;
    IF v_alvo_role IS DISTINCT FROM 'professor' THEN
      RAISE EXCEPTION 'O substituto tem de ser um professor' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- Autorização para professores (admin/superadmin passam sempre).
  IF v_role = 'professor' THEN
    IF p_professor_id = v_uid THEN
      -- assumir a aula: só se estiver livre, já for minha, ou eu for o titular
      IF NOT (v_atual IS NULL OR v_atual = v_uid OR v_uid = v_turma.professor_id) THEN
        RAISE EXCEPTION 'Esta aula já tem um professor atribuído' USING ERRCODE = '42501';
      END IF;
    ELSIF p_professor_id IS NULL THEN
      -- retirar: só o professor atual ou o titular
      IF NOT (v_uid = v_atual OR v_uid = v_turma.professor_id) THEN
        RAISE EXCEPTION 'Só o professor da aula ou o titular da turma pode libertá-la' USING ERRCODE = '42501';
      END IF;
    ELSE
      -- escolher substituto: só o titular ou o professor atual
      IF NOT (v_uid = v_turma.professor_id OR v_uid = v_atual) THEN
        RAISE EXCEPTION 'Só o titular da turma ou o professor da aula pode escolher um substituto' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala)
  VALUES (v_turma.id, v_turma.nome, p_professor_id, v_nome, p_data, v_turma.horario, v_turma.sala)
  ON CONFLICT (turma_id, data) DO UPDATE SET
    professor_id   = EXCLUDED.professor_id,
    professor_nome = EXCLUDED.professor_nome
  RETURNING id INTO v_aula_id;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION definir_professor_aula(UUID, DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION definir_professor_aula(UUID, DATE, UUID) TO authenticated;

-- ── Anti-desync: mudar o titular da turma ────────────────────
-- Quando o admin troca turmas.professor_id, as aulas FUTURAS ainda
-- agendadas que herdaram o titular antigo (ou nenhum) passam a
-- apontar o novo. Aulas com substituto já escolhido, em curso ou
-- passadas ficam intactas. Guardado com IS DISTINCT FROM.
CREATE OR REPLACE FUNCTION sincronizar_titular_aulas_futuras() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.professor_id IS DISTINCT FROM OLD.professor_id THEN
    UPDATE aulas SET
      professor_id   = NEW.professor_id,
      professor_nome = NEW.professor_nome
    WHERE turma_id = NEW.id
      AND data >= CURRENT_DATE
      AND status = 'agendada'
      AND professor_id IS NOT DISTINCT FROM OLD.professor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION sincronizar_titular_aulas_futuras() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sync_titular_aulas ON turmas;
CREATE TRIGGER trg_sync_titular_aulas
  AFTER UPDATE OF professor_id ON turmas
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_titular_aulas_futuras();
