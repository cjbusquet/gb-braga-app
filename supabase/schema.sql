-- ============================================================
--  Gracie Barra Braga — Supabase Schema v1.0
--  Tribo Laurada Lda. · NIF 518948471
--  Rua Nova Santa Cruz 11, 4710-409 Braga
--  Executar no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('superadmin','admin','atendimento','professor','aluno');
-- Inclui a progressão infantil bicolor (cinza/amarela/laranja/verde
-- com variantes -branca/-preta) e a vermelha honorária de adulto —
-- ambas usadas pelo frontend (src/types/index.ts Belt, alunoDomain.ts
-- FAIXAS_KIDS/FAIXAS_ADULTO) mas em falta aqui, o que fazia qualquer
-- graduação para uma faixa infantil intermédia falhar com "invalid
-- input value for enum belt_type".
CREATE TYPE belt_type       AS ENUM (
  'branca','azul','roxa','marrom','preta','vermelha',
  'cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta'
);
CREATE TYPE payment_status  AS ENUM ('pago','pendente','vencido','cancelado');
CREATE TYPE payment_method  AS ENUM ('stripe','numerario','transferencia');
CREATE TYPE aluno_status    AS ENUM ('ativo','inativo','suspenso');
CREATE TYPE genero_type     AS ENUM ('feminino','masculino','outro');
CREATE TYPE turma_nivel     AS ENUM ('iniciante','intermediario','avancado','kids','all');
CREATE TYPE turma_tipo      AS ENUM ('gi','nogi','wrestling','kids');
CREATE TYPE msg_canal       AS ENUM ('whatsapp','sms','email','push');
CREATE TYPE msg_status      AS ENUM ('enviado','pendente','erro','lido');
CREATE TYPE contrato_status AS ENUM ('ativo','cancelado','expirado');

-- ── PROFILES (ligado ao Supabase Auth) ───────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  role               user_role NOT NULL DEFAULT 'aluno',
  telefone           TEXT,
  matricula_completa BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url         TEXT,
  -- Campos de equipa (staff) — geridos em Config. > Equipa
  -- (src/hooks/useProfile.ts, src/pages/admin/ConfigPage.tsx StaffCard).
  -- Nunca chegaram a esta tabela apesar do frontend já os usar, o que
  -- fazia a lista de equipa falhar sempre com "column profiles.nif
  -- does not exist" e nunca sair de "A carregar equipa...".
  nif                TEXT,
  morada             TEXT,
  faixa              belt_type,
  ativo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: criar profile automaticamente quando utilizador regista
-- Se já existe uma linha em alunos com este email (ex.: staff criou o
-- aluno via "Nova Matrícula" antes de ele próprio ter conta), a
-- matrícula já está feita — sem isto, o primeiro login empurrava
-- sempre para o FluxoMatricula (ecrã de "Nova Matrícula"/enrollment)
-- outra vez, mesmo já tendo ficha/plano criados pelo staff.
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
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'),
    v_ja_matriculado
  );

  -- Liga o registo pré-criado pelo staff (sem profile_id, sem conta de
  -- login) à conta agora criada. TEM de vir DEPOIS do INSERT acima:
  -- alunos.profile_id tem FK para profiles(id), e NEW.id só passa a
  -- existir em profiles nesse INSERT. sincronizar_ban_aluno() (mais
  -- abaixo) só actua "IF NEW.profile_id IS NOT NULL" — sem isto,
  -- Suspender/Tornar Inativo fica permanentemente sem efeito nestas
  -- contas, porque não há nenhum auth.users para bloquear.
  IF v_ja_matriculado THEN
    UPDATE alunos SET profile_id = NEW.id WHERE email = NEW.email AND profile_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── PLANOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planos (
  id                   TEXT PRIMARY KEY,
  nome                 TEXT NOT NULL,
  valor                NUMERIC(8,2) NOT NULL,
  descricao            TEXT,
  categoria            TEXT NOT NULL CHECK (categoria IN ('adulto','kids','familia','fundador')),
  ativo                BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_product_id    TEXT,
  stripe_price_id_live TEXT,
  stripe_price_id_test TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO planos (id, nome, valor, descricao, categoria) VALUES
  ('pl-adulto-plus',    'Jiu-Jitsu Adulto Plus',         62,  'Aulas ilimitadas · IVA 23% incl.',    'adulto'),
  ('pl-adulto-fundador','Jiu-Jitsu Adulto Fundador',      53,  'Preço sócio fundador adulto',         'fundador'),
  ('pl-estudante',      'Jiu-Jitsu Estudante (Univ.)',    53,  'Com cartão universitário válido',     'adulto'),
  ('pl-kids-plus',      'Jiu-Jitsu Kids Plus',            53,  'Programa Kids — até 13 anos',         'kids'),
  ('pl-kids-fundador',  'Jiu-Jitsu Kids Fundador',        45,  'Preço sócio fundador kids',           'fundador'),
  ('pl-familia-2',      'Família 2 membros',             115,  '2 membros da mesma família',          'familia'),
  ('pl-familia-3',      'Família 3 membros',             165,  '3 membros da mesma família',          'familia'),
  ('pl-familia-3-kids', 'Família 3 (Kids incluído)',     150,  'Família com kids incluído',           'familia'),
  ('pl-familia-4',      'Família 4 membros',             200,  '4 membros da mesma família',          'familia'),
  ('pl-familia-2-fund', 'Família 2 Fundador',            109,  'Preço fundador família 2',            'fundador'),
  ('pl-familia-3-fund', 'Família 3 Fundador',            157,  'Preço fundador família 3',            'fundador'),
  ('pl-familia-4-fund', 'Família 4 Fundador',            190,  'Preço fundador família 4',            'fundador')
ON CONFLICT (id) DO NOTHING;

-- ── ALUNOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alunos (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nome                   TEXT NOT NULL,
  email                  TEXT NOT NULL UNIQUE,
  telefone               TEXT,
  whatsapp               TEXT,
  data_nascimento        DATE NOT NULL,
  nif                    TEXT,
  morada                 TEXT,
  cod_postal             TEXT,
  faixa                  belt_type NOT NULL DEFAULT 'branca',
  grau                   SMALLINT NOT NULL DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
  genero                 genero_type,
  data_matricula         DATE NOT NULL DEFAULT CURRENT_DATE,
  plano_id               TEXT REFERENCES planos(id) ON DELETE SET NULL,
  plano_nome             TEXT,
  status                 aluno_status NOT NULL DEFAULT 'ativo',
  frequencia             SMALLINT NOT NULL DEFAULT 0,
  responsavel            TEXT,
  responsavel_nif        TEXT,
  responsavel_email      TEXT,
  responsavel_tel        TEXT,
  enc_pagamento          TEXT DEFAULT 'aluno',
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  metodo_pagamento       payment_method NOT NULL DEFAULT 'stripe',
  numerario_aprovado     BOOLEAN NOT NULL DEFAULT FALSE,
  numerario_aprovado_por UUID REFERENCES profiles(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alunos_email      ON alunos(email);
CREATE INDEX idx_alunos_status     ON alunos(status);
CREATE INDEX idx_alunos_plano      ON alunos(plano_id);
CREATE INDEX idx_alunos_profile    ON alunos(profile_id);
CREATE INDEX idx_alunos_aprovado_por ON alunos(numerario_aprovado_por);

-- ── TURMAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turmas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           TEXT NOT NULL,
  professor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome TEXT,
  horario        TEXT NOT NULL,
  dias_semana    TEXT[] NOT NULL DEFAULT '{}',
  sala           TEXT,
  capacidade     SMALLINT NOT NULL DEFAULT 20,
  nivel          turma_nivel NOT NULL DEFAULT 'all',
  tipo           turma_tipo NOT NULL DEFAULT 'gi',
  ativa          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_turmas_professor ON turmas(professor_id);

INSERT INTO turmas (nome, professor_nome, horario, dias_semana, sala, capacidade, tipo, nivel) VALUES
  ('Jiu-Jitsu Adultos — Manhã',   'Prof. João Santos', '07:00-08:30', ARRAY['Segunda','Terça','Quarta','Quinta','Sexta'], 'Sala Principal', 20, 'gi', 'all'),
  ('Jiu-Jitsu Adultos — Noite 1', 'Prof. João Santos', '18:30-20:00', ARRAY['Segunda','Quarta','Sexta'], 'Sala Principal', 25, 'gi', 'iniciante'),
  ('Jiu-Jitsu Adultos — Noite 2', 'Prof. João Santos', '20:00-21:30', ARRAY['Segunda','Quarta','Sexta'], 'Sala Principal', 25, 'gi', 'intermediario'),
  ('Jiu-Jitsu Avançado',          'Prof. João Santos', '19:00-20:30', ARRAY['Terça','Quinta'], 'Sala Principal', 15, 'gi', 'avancado'),
  ('No-Gi / Wrestling',           'Prof. João Santos', '20:30-22:00', ARRAY['Terça','Quinta'], 'Sala Principal', 20, 'nogi', 'all'),
  ('Kids — Tarde',                'Prof. João Santos', '17:00-18:00', ARRAY['Segunda','Quarta','Sexta'], 'Sala Pequena', 15, 'kids', 'kids'),
  ('Open Mat',                    'Prof. João Santos', '09:30-12:30', ARRAY['Sábado'], 'Sala Principal', 30, 'gi', 'all')
ON CONFLICT DO NOTHING;

-- ── PAGAMENTOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagamentos (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id           UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_nome         TEXT NOT NULL,
  plano_id           TEXT REFERENCES planos(id),
  plano_nome         TEXT,
  valor              NUMERIC(8,2) NOT NULL,
  vencimento         DATE NOT NULL,
  data_pagamento     TIMESTAMPTZ,
  status             payment_status NOT NULL DEFAULT 'pendente',
  metodo             payment_method,
  stripe_payment_id  TEXT UNIQUE,
  stripe_invoice_id  TEXT,
  toc_numero         TEXT,
  descricao          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_aluno   ON pagamentos(aluno_id);
CREATE INDEX idx_pagamentos_status  ON pagamentos(status);
CREATE INDEX idx_pagamentos_vencimento ON pagamentos(vencimento);
CREATE INDEX idx_pagamentos_plano   ON pagamentos(plano_id);

-- ── PRESENÇAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presencas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id    UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_nome  TEXT NOT NULL,
  turma_id    UUID REFERENCES turmas(id) ON DELETE SET NULL,
  turma_nome  TEXT,
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  hora        TIME NOT NULL DEFAULT CURRENT_TIME,
  tipo        TEXT NOT NULL DEFAULT 'checkin',
  metodo      TEXT NOT NULL DEFAULT 'gps',
  gps_lat     NUMERIC(10,7),
  gps_lng     NUMERIC(10,7),
  gps_dist_m  NUMERIC(6,1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_presencas_aluno_data ON presencas(aluno_id, data);
CREATE INDEX idx_presencas_data       ON presencas(data);
CREATE INDEX idx_presencas_turma      ON presencas(turma_id);

-- Um aluno só pode fazer check-in uma vez por dia na MESMA turma —
-- WHERE turma_id IS NOT NULL porque NULL nunca é igual a NULL numa
-- unique index, por isso "treino livre" (turma_id NULL) fica de fora
-- de propósito e continua sem limite. Diferentes turmas no mesmo dia
-- continuam permitidas (é só a mesma aula 2x que fica bloqueada).
CREATE UNIQUE INDEX ux_presencas_aluno_turma_dia
  ON presencas(aluno_id, turma_id, data)
  WHERE turma_id IS NOT NULL AND tipo = 'checkin';

-- ── PROFESSOR CHECKINS ───────────────────────────────────────
-- Referenciada pelo frontend (useProfessorCheckins, registrarProfessorCheckin,
-- concluirCheckinProfessor em useData.ts) mas nunca tinha sido criada —
-- toda a chamada falhava com "relation does not exist".
CREATE TABLE IF NOT EXISTS professor_checkins (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome TEXT NOT NULL,
  turma_id       UUID REFERENCES turmas(id) ON DELETE SET NULL,
  turma_nome     TEXT,
  data           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio    TIME NOT NULL DEFAULT CURRENT_TIME,
  hora_fim       TIME,
  status         TEXT NOT NULL DEFAULT 'ativa',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_professor_checkins_professor ON professor_checkins(professor_id);
CREATE INDEX idx_professor_checkins_turma     ON professor_checkins(turma_id);

-- ── AULAS ────────────────────────────────────────────────────
-- Ocorrência concreta de uma turma num dia (ex: "Jiu-Jitsu Manhã" de
-- 17/08), distinta do horário-modelo semanal em `turmas`. Materializada
-- automaticamente por qualquer check-in ou pelo professor a dar aula —
-- ver obter_ou_criar_aula / iniciar_aula / concluir_aula mais abaixo.
CREATE TABLE IF NOT EXISTS aulas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turma_id       UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  turma_nome     TEXT NOT NULL,
  professor_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome TEXT,
  data           DATE NOT NULL,
  horario        TEXT,               -- horário agendado (copiado da turma, ex: "07:00-08:30")
  hora_inicio    TIME,               -- hora real em que o professor iniciou
  hora_fim       TIME,               -- hora real em que o professor concluiu
  sala           TEXT,
  status         TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','em_curso','concluida')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turma_id, data)
);

CREATE INDEX idx_aulas_professor ON aulas(professor_id);
CREATE INDEX idx_aulas_data      ON aulas(data);

ALTER TABLE presencas ADD COLUMN aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL;
CREATE INDEX idx_presencas_aula ON presencas(aula_id);

-- ── CONTRATOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id         UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_nome       TEXT NOT NULL,
  aluno_nif        TEXT,
  plano_id         TEXT REFERENCES planos(id),
  plano_nome       TEXT,
  valor            NUMERIC(8,2) NOT NULL,
  data_inicio      DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim         DATE,
  status           contrato_status NOT NULL DEFAULT 'ativo',
  assinado         BOOLEAN NOT NULL DEFAULT FALSE,
  data_assinatura  TIMESTAMPTZ,
  assinatura_img   TEXT,        -- base64 PNG da assinatura canvas
  aceita_imagem    BOOLEAN NOT NULL DEFAULT FALSE,
  aceita_rgpd      BOOLEAN NOT NULL DEFAULT FALSE,
  aceita_contrato  BOOLEAN NOT NULL DEFAULT FALSE,
  enc_pagamento    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contratos_aluno ON contratos(aluno_id);
CREATE INDEX idx_contratos_plano ON contratos(plano_id);

-- ── GRADUAÇÕES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS graduacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id        UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_nome      TEXT NOT NULL,
  faixa_anterior  belt_type NOT NULL,
  grau_anterior   SMALLINT NOT NULL,
  faixa_nova      belt_type NOT NULL,
  grau_novo       SMALLINT NOT NULL,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  professor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professor_nome  TEXT,
  observacao      TEXT,
  notificado_wa   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_graduacoes_aluno     ON graduacoes(aluno_id);
CREATE INDEX idx_graduacoes_professor ON graduacoes(professor_id);

-- ── MENSAGENS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensagens (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  para_id        TEXT NOT NULL,
  para_nome      TEXT NOT NULL,
  canal          msg_canal NOT NULL,
  assunto        TEXT,
  corpo          TEXT NOT NULL,
  status         msg_status NOT NULL DEFAULT 'pendente',
  remetente      TEXT NOT NULL,
  agendado_para  TIMESTAMPTZ,
  enviado_em     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TEMPLATES DE MENSAGEM ────────────────────────────────────
-- Referenciada por useTemplates/criarTemplate/apagarTemplate
-- (useData.ts) e usada em ComunicacaoPage.tsx — nunca tinha sido
-- criada.
CREATE TABLE IF NOT EXISTS templates_mensagem (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  canal      msg_canal NOT NULL,
  assunto    TEXT,
  corpo      TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHAT DIRETO (aluno ↔ staff) ──────────────────────────────
-- Distinto de `mensagens` (log de campanhas/broadcast para
-- segmentos) — esta é uma conversa 1:1 por aluno, usada por
-- ChatPage.tsx (staff) e pages/aluno/Mensagens.tsx (aluno).
CREATE TABLE IF NOT EXISTS mensagens_chat (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id       UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  remetente_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remetente_role user_role NOT NULL,
  corpo          TEXT NOT NULL CHECK (length(trim(corpo)) > 0),
  lida           BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_chat_aluno   ON mensagens_chat(aluno_id, created_at);
CREATE INDEX idx_mensagens_chat_remetente ON mensagens_chat(remetente_id);

-- ── NOTIFICAÇÕES IN-APP ──────────────────────────────────────
-- Uma linha por destinatário (fan-out feito por trigger, não pelo
-- frontend) — mantém a policy de SELECT/UPDATE trivial: "é minha ou
-- não é".
CREATE TABLE IF NOT EXISTS notificacoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo     TEXT NOT NULL,
  corpo      TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','sucesso','aviso','erro')),
  link       TEXT,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_profile ON notificacoes(profile_id, lida, created_at DESC);

-- ── CONFIGURAÇÕES ────────────────────────────────────────────
-- Referenciada por useConfiguracoes.ts e useModulos.tsx (secao
-- 'modulos') — nunca tinha sido criada, o que quebrava o toggle de
-- módulos em ConfigPage.tsx para qualquer secao.
CREATE TABLE IF NOT EXISTS configuracoes (
  secao      TEXT PRIMARY KEY,
  dados      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ── RESPONSÁVEIS (encarregados de educação de alunos menores) ─
-- Referenciadas por useResponsaveis/criarResponsavel/
-- vincularResponsavel/desvincularResponsavel (useData.ts), usadas em
-- AlunosPage.tsx (ResponsaveisSection) — nunca tinham sido criadas.
CREATE TABLE IF NOT EXISTS responsaveis (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       TEXT NOT NULL,
  email      TEXT,
  telefone   TEXT,
  nif        TEXT,
  aluno_id   UUID REFERENCES alunos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aluno_responsaveis (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id             UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  responsavel_id       UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  tipo_relacao         TEXT NOT NULL DEFAULT 'outro',
  pode_checkin         BOOLEAN NOT NULL DEFAULT TRUE,
  e_titular_financeiro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responsaveis_aluno            ON responsaveis(aluno_id);
CREATE INDEX idx_aluno_responsaveis_aluno      ON aluno_responsaveis(aluno_id);
CREATE INDEX idx_aluno_responsaveis_responsavel ON aluno_responsaveis(responsavel_id);

-- ── PROFESSORES ──────────────────────────────────────────────
-- useProfessores() (useData.ts, usada em ProfessoresPage.tsx) faz
-- select('*') a uma tabela "professores" que nunca existiu. Em vez de
-- duplicar nome/email/telefone de profiles (violaria a regra de
-- Single Source of Truth), professor_extras guarda só os campos
-- específicos de professor (faixa, grau, turmas, ...) e "professores"
-- é uma VIEW só de leitura que junta profiles + professor_extras —
-- não há nenhuma mutação de escrita nesta tabela no frontend hoje.
CREATE TABLE IF NOT EXISTS professor_extras (
  id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  faixa         belt_type NOT NULL DEFAULT 'preta',
  grau          SMALLINT NOT NULL DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
  turmas        TEXT[] NOT NULL DEFAULT '{}',
  data_admissao DATE,
  status        TEXT NOT NULL DEFAULT 'ativo',
  foto          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TOConline ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS toc_documentos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero            TEXT NOT NULL UNIQUE,
  tipo              TEXT NOT NULL DEFAULT 'FR',
  data_emissao      DATE NOT NULL DEFAULT CURRENT_DATE,
  aluno_id          UUID REFERENCES alunos(id) ON DELETE SET NULL,
  aluno_nome        TEXT NOT NULL,
  plano_nome        TEXT,
  valor_total       NUMERIC(8,2) NOT NULL,
  iva_total         NUMERIC(8,2) NOT NULL,
  valor_sem_iva     NUMERIC(8,2) NOT NULL,
  pagamento_id      UUID REFERENCES pagamentos(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  pdf_url           TEXT,
  estado            TEXT NOT NULL DEFAULT 'emitida',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_toc_documentos_aluno     ON toc_documentos(aluno_id);
CREATE INDEX idx_toc_documentos_pagamento ON toc_documentos(pagamento_id);

-- ── PEDIDOS NUMERÁRIO ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos_numerario (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id       UUID REFERENCES alunos(id) ON DELETE CASCADE,
  nome_aluno     TEXT NOT NULL,
  email          TEXT NOT NULL,
  telefone       TEXT,
  plano_id       TEXT REFERENCES planos(id),
  plano_nome     TEXT,
  valor          NUMERIC(8,2),
  status         TEXT NOT NULL DEFAULT 'pendente',
  nota_admin     TEXT,
  aprovado_por   UUID REFERENCES profiles(id),
  aprovado_em    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pedidos_numerario_aluno    ON pedidos_numerario(aluno_id);
CREATE INDEX idx_pedidos_numerario_plano    ON pedidos_numerario(plano_id);
CREATE INDEX idx_pedidos_numerario_aprovado ON pedidos_numerario(aprovado_por);

-- ── LOGS DE ACESSO (segurança) ────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email  TEXT,
  role        TEXT,
  action      TEXT NOT NULL,
  details     JSONB,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user ON access_logs(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_chat    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsaveis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluno_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_extras  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_numerario ENABLE ROW LEVEL SECURITY;
ALTER TABLE toc_documentos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs       ENABLE ROW LEVEL SECURITY;

-- Schema não exposto pelo PostgREST (api.schemas só lista public e
-- graphql_public) — funções aqui dentro nunca ganham um endpoint
-- /rest/v1/rpc/<fn>, mesmo continuando totalmente chamáveis a partir
-- de RLS policies em "public". Isto é o que separa "a RLS precisa de
-- chamar isto" de "qualquer um pode chamar isto via API".
CREATE SCHEMA IF NOT EXISTS private;

-- Helper: role do utilizador atual
CREATE OR REPLACE FUNCTION private.auth_role() RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Helper: aluno_id do utilizador atual
-- Devolve NULL para quem está suspenso/inativo: é o ponto único usado
-- pelas policies de self-service (presencas, pagamentos, chat,
-- aluno_responsaveis, professor_checkins, ...), por
-- isso bloquear aqui bloqueia tudo isso de uma vez quando "Suspender"
-- ou "Tornar Inativo" (AlunosPage.tsx) muda o status.
CREATE OR REPLACE FUNCTION private.my_aluno_id() RETURNS UUID AS $$
  SELECT id FROM alunos
  WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND status = 'ativo';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- PLANOS policies
-- Um único policy por ação (nunca FOR ALL a par de outro policy na
-- mesma tabela) — várias policies permissivas para a mesma
-- ação+role são reavaliadas todas a cada query (Advisor: "Multiple
-- Permissive Policies").
CREATE POLICY "Ver planos"          ON planos FOR SELECT USING (ativo = true OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin insere planos" ON planos FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin atualiza planos" ON planos FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga planos"  ON planos FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- PROFILES policies
CREATE POLICY "Perfil próprio"      ON profiles FOR SELECT USING (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
-- Inclui id = auth.uid() (não só admin/superadmin): é o fallback que
-- auth.tsx's loadProfile() usa quando handle_new_user() não criou o
-- perfil (ex.: sessão órfã depois de o utilizador subjacente ser
-- recriado) — sem isto, quem cai nesse caminho fica preso para
-- sempre em "Profile not found", sem forma de recuperar.
CREATE POLICY "Inserir perfil" ON profiles FOR INSERT WITH CHECK (
  id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Atualizar perfil" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- ALUNOS policies
CREATE POLICY "Aluno vê dados" ON alunos FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
-- 'professor' incluído: NovaMatriculaModal.tsx (o botão "+ Nova
-- Matrícula" em AlunosPage.tsx, cuja rota já inclui professor) chama
-- db.criarAluno() → INSERT direto nesta tabela, que ficava bloqueado
-- por completo com "new row violates row-level security policy".
CREATE POLICY "Aluno auto-registo" ON alunos FOR INSERT WITH CHECK (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
);
-- 'professor' incluído: AlunosPage.tsx's EditAlunoModal (nome/telefone/
-- nif/dataNascimento) já é acessível a professor (rota 'alunos' inclui
-- professor), mas o UPDATE ficava bloqueado por completo — 0 linhas
-- afetadas, sem erro visível além do 406/PGRST116 do .single().
-- Auto-edição exige status='ativo': um aluno suspenso/inativo não
-- pode editar o próprio registo (staff continua a poder sempre, é
-- como reativa/edita quem está bloqueado).
CREATE POLICY "Atualizar aluno" ON alunos FOR UPDATE
  USING (
    (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) AND status = 'ativo')
    OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
  )
  WITH CHECK (
    (email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) AND status = 'ativo')
    OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor')
  );
CREATE POLICY "Admin apaga alunos" ON alunos FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- RLS is row-scoped, not column-scoped: the policy above would let a
-- student UPDATE any column on their own row (faixa, status,
-- numerario_aprovado, ...) via a direct API call, not just the
-- nome/telefone/whatsapp fields the "Minha Conta" form exposes. Lock
-- non-staff updates down to those columns; everything else reverts to OLD.
CREATE OR REPLACE FUNCTION restringir_update_aluno() RETURNS TRIGGER AS $$
BEGIN
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
    -- to OLD) and nif/data_nascimento (the fields AlunosPage.tsx's
    -- EditAlunoModal sends alongside nome/telefone, which are never
    -- blocked for anyone). Without this, "editing a student" from a
    -- professor screen would silently drop those two fields even once
    -- the RLS policy itself allows the UPDATE through.
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

CREATE TRIGGER trg_restringir_update_aluno
  BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION restringir_update_aluno();

-- "Suspender"/"Tornar Inativo" (AlunosPage.tsx changeStatus()) devem
-- bloquear o login de facto, não só mudar uma etiqueta. Sincroniza
-- auth.users.banned_until com alunos.status — é o GoTrue (servidor de
-- auth) que passa a recusar login/refresh de token.
-- NOTA: 'infinity'::timestamptz não serve — o GoTrue (Go) lê
-- banned_until para um time.Time nativo, que não sabe representar o
-- valor especial "infinity" do Postgres. Isto falha com 500 "Database
-- error querying schema" no login do próprio aluno banido, e também
-- em qualquer chamada da Admin API que percorra auth.users (ex.:
-- admin.auth.admin.listUsers(), usado por seed.mjs). Usa-se uma data
-- bem distante em vez disso.
CREATE OR REPLACE FUNCTION sincronizar_ban_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE auth.users
    SET banned_until = CASE WHEN NEW.status = 'ativo' THEN NULL ELSE (now() + interval '100 years') END
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sincronizar_ban_aluno
  AFTER UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION sincronizar_ban_aluno();

-- TURMAS policies
CREATE POLICY "Ver turmas" ON turmas FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Admin cria turmas"    ON turmas FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin atualiza turmas" ON turmas FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin apaga turmas"   ON turmas FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- AULAS policies
-- Visibilidade do horário/agenda não é sensível — mesmo critério que
-- "Ver turmas". Sem policies de INSERT/UPDATE diretas: toda a escrita
-- passa por obter_ou_criar_aula/iniciar_aula/concluir_aula (SECURITY
-- DEFINER), que decidem o professor a partir de quem chama.
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver aulas" ON aulas FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- PAGAMENTOS policies
CREATE POLICY "Aluno vê pagamentos" ON pagamentos FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Aluno insere pagamento" ON pagamentos FOR INSERT WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Admin atualiza pagamentos" ON pagamentos FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga pagamentos"   ON pagamentos FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- PRESENÇAS policies
CREATE POLICY "Ver presenças"    ON presencas FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento'));
-- 'aluno' estava em falta: o self-checkin em MeuCheckin.tsx faz este
-- INSERT como o próprio aluno, e sem esta condição a RLS bloqueava-o
-- por completo — ninguém conseguia fazer check-in a partir do portal.
CREATE POLICY "Registar presença" ON presencas FOR INSERT WITH CHECK (
  aluno_id = (SELECT private.my_aluno_id())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','professor','atendimento')
);

-- PROFESSOR_CHECKINS policies
-- "professor_id = auth.uid()" sozinho não chega: qualquer utilizador
-- autenticado tem auth.uid() igual ao seu próprio id, por isso sem
-- verificar também o role, um aluno podia inserir-se a si próprio
-- como professor_id e auto-nomear-se professor para efeitos desta
-- tabela.
CREATE POLICY "Ver checkins de professor" ON professor_checkins FOR SELECT USING (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Professor regista checkin" ON professor_checkins FOR INSERT WITH CHECK (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Professor conclui checkin" ON professor_checkins FOR UPDATE USING (
  (professor_id = (SELECT auth.uid()) AND (SELECT private.auth_role()) = 'professor')
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);

-- CONTRATOS policies
CREATE POLICY "Ver contrato" ON contratos FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Aluno insere contrato" ON contratos FOR INSERT WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())))
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Admin atualiza contratos" ON contratos FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin apaga contratos"   ON contratos FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- GRADUAÇÕES policies
-- RLS estava ativo mas sem nenhuma policy — por omissão isso nega
-- acesso a toda a gente (staff incluído) exceto o dono da tabela.
-- Acesso alinhado com a route guard da app (App.tsx: rota "graduacao"
-- só para superadmin/admin/professor — atendimento não gere graduações).
CREATE POLICY "Ver graduações" ON graduacoes FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin','professor'));
CREATE POLICY "Registar graduação" ON graduacoes FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','professor'));

-- Graduar um aluno é 2 escritas que têm de acontecer juntas ou nenhuma:
-- registar o histórico (graduacoes) e atualizar a faixa/grau correntes
-- (alunos). Feito como 2 chamadas REST separadas do cliente, uma podia
-- ter sucesso e a outra falhar (ex.: RLS), deixando o histórico a
-- mostrar uma promoção que nunca chegou a aplicar-se ao aluno. Uma
-- função só faz commit se chegar ao fim sem exceção, por isso as duas
-- escritas ficam atómicas de graça. SECURITY DEFINER para poder
-- escrever em alunos independentemente das policies de UPDATE dessa
-- tabela (professor não está em "Admin gere alunos") — a autorização
-- de quem pode graduar é feita explicitamente aqui dentro.
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

-- ── obter_ou_criar_aula ────────────────────────────────────────
-- Chamada por qualquer check-in (aluno/kiosk/staff) para materializar
-- a aula do dia; usa o professor por omissão da turma.
CREATE OR REPLACE FUNCTION obter_ou_criar_aula(p_turma_id UUID, p_data DATE)
RETURNS UUID AS $$
DECLARE
  v_turma turmas%ROWTYPE;
  v_aula_id UUID;
BEGIN
  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala)
  VALUES (v_turma.id, v_turma.nome, v_turma.professor_id, v_turma.professor_nome, p_data, v_turma.horario, v_turma.sala)
  ON CONFLICT (turma_id, data) DO NOTHING
  RETURNING id INTO v_aula_id;

  IF v_aula_id IS NULL THEN
    SELECT id INTO v_aula_id FROM aulas WHERE turma_id = p_turma_id AND data = p_data;
  END IF;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION obter_ou_criar_aula(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obter_ou_criar_aula(UUID, DATE) TO authenticated;

-- ── iniciar_aula ─────────────────────────────────────────────
-- Só um professor pode iniciar; fica registado como o professor desta
-- aula (suporta substituições face ao professor por omissão da turma).
CREATE OR REPLACE FUNCTION iniciar_aula(p_turma_id UUID, p_data DATE)
RETURNS UUID AS $$
DECLARE
  v_role TEXT := private.auth_role();
  v_turma turmas%ROWTYPE;
  v_professor_nome TEXT;
  v_aula_id UUID;
BEGIN
  IF v_role <> 'professor' THEN
    RAISE EXCEPTION 'Só um professor pode iniciar uma aula' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_turma FROM turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada' USING ERRCODE = 'P0002';
  END IF;

  SELECT nome INTO v_professor_nome FROM profiles WHERE id = auth.uid();

  INSERT INTO aulas (turma_id, turma_nome, professor_id, professor_nome, data, horario, sala, status, hora_inicio)
  VALUES (v_turma.id, v_turma.nome, auth.uid(), COALESCE(v_professor_nome, 'Professor'), p_data, v_turma.horario, v_turma.sala, 'em_curso', NOW()::TIME(0))
  ON CONFLICT (turma_id, data) DO UPDATE SET
    professor_id   = auth.uid(),
    professor_nome = COALESCE(v_professor_nome, 'Professor'),
    status         = 'em_curso',
    hora_inicio    = NOW()::TIME(0)
  RETURNING id INTO v_aula_id;

  RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION iniciar_aula(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION iniciar_aula(UUID, DATE) TO authenticated;

-- ── concluir_aula ────────────────────────────────────────────
-- Só o professor da aula ou admin/superadmin.
CREATE OR REPLACE FUNCTION concluir_aula(p_aula_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role TEXT := private.auth_role();
  v_aula aulas%ROWTYPE;
BEGIN
  SELECT * INTO v_aula FROM aulas WHERE id = p_aula_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF NOT ((v_aula.professor_id = auth.uid() AND v_role = 'professor') OR v_role IN ('admin','superadmin')) THEN
    RAISE EXCEPTION 'Sem permissão para concluir esta aula' USING ERRCODE = '42501';
  END IF;

  UPDATE aulas SET status = 'concluida', hora_fim = NOW()::TIME(0) WHERE id = p_aula_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION concluir_aula(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION concluir_aula(UUID) TO authenticated;

-- TOConline policies
-- "Admin vê faturas" e "Aluno vê as suas faturas" eram 2 policies de
-- SELECT sobrepostas — fundidas numa só.
CREATE POLICY "Ver faturas" ON toc_documentos FOR SELECT USING (aluno_id = (SELECT private.my_aluno_id()) OR (SELECT private.auth_role()) IN ('admin','superadmin'));

-- NUMERÁRIO policies
-- "Atendimento vê numerario" e o SELECT implícito de "Superadmin gere
-- numerario" (FOR ALL) eram inteiramente subsumidos por "Aluno vê o
-- próprio pedido de numerario" (já inclui admin/superadmin/atendimento) —
-- removidos como redundantes. UPDATE/DELETE continuam restritos a
-- superadmin, tal como o FOR ALL original.
CREATE POLICY "Aluno vê o próprio pedido de numerario" ON pedidos_numerario FOR SELECT USING (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
CREATE POLICY "Aluno submete numerario" ON pedidos_numerario FOR INSERT WITH CHECK (
  email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid()))
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
CREATE POLICY "Superadmin atualiza numerario" ON pedidos_numerario FOR UPDATE USING ((SELECT private.auth_role()) = 'superadmin');
CREATE POLICY "Superadmin apaga numerario"   ON pedidos_numerario FOR DELETE USING ((SELECT private.auth_role()) = 'superadmin');

-- MENSAGENS policies
-- Única policy na tabela — FOR ALL não sobrepõe nada aqui, ao
-- contrário das tabelas acima.
CREATE POLICY "Admin gere mensagens" ON mensagens FOR ALL USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- TEMPLATES_MENSAGEM policies (só criar/apagar são usados pelo
-- frontend hoje — sem policy de UPDATE)
CREATE POLICY "Ver templates" ON templates_mensagem FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Staff insere templates" ON templates_mensagem FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));
CREATE POLICY "Staff apaga templates" ON templates_mensagem FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- MENSAGENS_CHAT policies
-- Sem policy de UPDATE/DELETE — "marcar como lida" passa só pela RPC
-- marcar_chat_lida() (SECURITY DEFINER), nunca por UPDATE direto do
-- cliente (ver função mais abaixo).
CREATE POLICY "Ver conversa" ON mensagens_chat FOR SELECT USING (
  aluno_id = (SELECT private.my_aluno_id())
  OR (SELECT private.auth_role()) IN ('admin','superadmin','atendimento')
);
CREATE POLICY "Enviar mensagem de chat" ON mensagens_chat FOR INSERT WITH CHECK (
  remetente_id = (SELECT auth.uid())
  AND (
    ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento') AND remetente_role = (SELECT private.auth_role())::user_role)
    OR (aluno_id = (SELECT private.my_aluno_id()) AND remetente_role = 'aluno')
  )
);

-- NOTIFICACOES policies
-- Sem policy de INSERT: as linhas só são criadas pelo trigger
-- notificar_nova_mensagem_chat() (SECURITY DEFINER) — um aluno pode
-- inserir em mensagens_chat mas não tem (nem deve ter) permissão
-- direta de escrever notificações para outros perfis (ex.: staff).
CREATE POLICY "Ver próprias notificações" ON notificacoes FOR SELECT USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Marcar própria notificação como lida" ON notificacoes FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- CONFIGURACOES policies — só 'academia' (GPS fence, lido por
-- MeuCheckin/KioskMode/CheckinPage) e 'modulos' (ModulosProvider,
-- envolve a app inteira) precisam de SELECT amplo. As restantes
-- secoes (toconline/stripe/whatsapp/email/compliance) guardam
-- credenciais de integrações e nunca devem ser legíveis por
-- 'aluno'/'professor'/'atendimento' — antes disto, qualquer
-- utilizador autenticado conseguia ler Client Secret/sk_/whsec_/
-- token WhatsApp diretamente via supabase.from('configuracoes').
CREATE POLICY "Ver configuracoes" ON configuracoes FOR SELECT USING (
  (secao IN ('academia','modulos') AND (SELECT auth.uid()) IS NOT NULL)
  OR (SELECT private.auth_role()) IN ('admin','superadmin')
);
CREATE POLICY "Admin insere configuracoes" ON configuracoes FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin'));
CREATE POLICY "Admin atualiza configuracoes" ON configuracoes FOR UPDATE USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- RESPONSÁVEIS policies
-- 'professor' incluído no INSERT também: NovaMatriculaModal.tsx cria
-- e vincula um responsável no mesmo fluxo que criarAluno() quando o
-- novo aluno é menor — bloquear só o INSERT em alunos deixaria este
-- segundo passo a falhar a seguir, com o mesmo tipo de erro.
CREATE POLICY "Ver responsaveis" ON responsaveis FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Staff insere responsaveis" ON responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));

CREATE POLICY "Ver vinculos responsaveis" ON aluno_responsaveis FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Staff vincula responsavel" ON aluno_responsaveis FOR INSERT WITH CHECK ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Staff desvincula responsavel" ON aluno_responsaveis FOR DELETE USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- PROFESSOR_EXTRAS policies — sem policy de escrita: nenhuma
-- mutação existe no frontend hoje, view "professores" é só leitura.
CREATE POLICY "Ver professor_extras" ON professor_extras FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin','atendimento'));

-- ACCESS_LOGS policies
-- Sem policy de INSERT/UPDATE/DELETE: só o backend (service role, que
-- ignora RLS) deve escrever aqui. Nenhum papel de cliente pode gravar.
CREATE POLICY "Admin vê access_logs" ON access_logs FOR SELECT USING ((SELECT private.auth_role()) IN ('admin','superadmin'));

-- ── TRIGGERS updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_alunos_upd   BEFORE UPDATE ON alunos   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SYNC nome (alunos ↔ profiles) ──────────────────────────────
-- alunos.nome and profiles.nome are two independent columns for the
-- same person. "Minha Conta" (PortalAluno.tsx) only writes
-- alunos.nome; "O meu Perfil" (PerfilPage.tsx) only writes
-- profiles.nome — with nothing keeping them in sync, editing one
-- left the other (and everything reading from it) stale. SECURITY
-- DEFINER matters here beyond convention: e.g. atendimento can
-- update alunos.nome via AlunosPage.tsx but is NOT in the
-- "Atualizar perfil" policy's staff list, so without bypassing RLS
-- the cascading write to profiles would silently affect 0 rows.
-- AFTER UPDATE OF nome + the IS DISTINCT FROM guard on each side
-- stops this from looping between the two triggers.
CREATE OR REPLACE FUNCTION sync_aluno_nome_to_profile() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE profiles SET nome = NEW.nome WHERE id = NEW.profile_id AND nome IS DISTINCT FROM NEW.nome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_profile_nome_to_aluno() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE alunos SET nome = NEW.nome WHERE profile_id = NEW.id AND nome IS DISTINCT FROM NEW.nome;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sync_aluno_nome   AFTER UPDATE OF nome ON alunos   FOR EACH ROW EXECUTE FUNCTION sync_aluno_nome_to_profile();
CREATE TRIGGER trg_sync_profile_nome AFTER UPDATE OF nome ON profiles FOR EACH ROW EXECUTE FUNCTION sync_profile_nome_to_aluno();

REVOKE EXECUTE ON FUNCTION sync_aluno_nome_to_profile()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION sync_profile_nome_to_aluno()   FROM PUBLIC;

-- ── CHAT: marcar como lida (RPC, não UPDATE direto) ──────────
-- Centraliza a mutação num único RPC em vez de dar ao cliente uma
-- policy de UPDATE em mensagens_chat: evita ter de restringir, via
-- RLS, QUAIS colunas podem mudar (RLS só controla linhas, não
-- colunas) — o RPC só toca lida/lida_em, nunca o corpo da mensagem.
-- Marca como lidas as mensagens do "outro lado" da conversa: staff
-- marca as do aluno, o aluno marca as do staff.
CREATE OR REPLACE FUNCTION marcar_chat_lida(p_aluno_id UUID)
RETURNS VOID AS $$
BEGIN
  IF (SELECT private.auth_role()) IN ('admin','superadmin','atendimento') THEN
    UPDATE mensagens_chat SET lida = TRUE, lida_em = NOW()
    WHERE aluno_id = p_aluno_id AND remetente_role = 'aluno' AND lida = FALSE;
  ELSIF p_aluno_id = (SELECT private.my_aluno_id()) THEN
    UPDATE mensagens_chat SET lida = TRUE, lida_em = NOW()
    WHERE aluno_id = p_aluno_id AND remetente_role != 'aluno' AND lida = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION marcar_chat_lida(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION marcar_chat_lida(UUID) TO authenticated;

-- ── CHAT → NOTIFICAÇÕES (fan-out) ────────────────────────────
-- Um aluno pode inserir em mensagens_chat mas NÃO tem policy de
-- INSERT em notificacoes (nem deveria — teria de escrever para
-- perfis de staff que não são o seu). SECURITY DEFINER é
-- obrigatório aqui pelo mesmo motivo do sync de nome acima: sem
-- bypassar RLS, o fan-out para staff a partir de uma mensagem
-- enviada por um aluno afetaria silenciosamente 0 linhas.
CREATE OR REPLACE FUNCTION notificar_nova_mensagem_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_aluno_nome TEXT;
  v_snippet    TEXT;
BEGIN
  SELECT nome INTO v_aluno_nome FROM alunos WHERE id = NEW.aluno_id;
  v_snippet := left(NEW.corpo, 80);

  -- link guarda o id de página usado por Layout.tsx/onNavigate (ver
  -- NAV_ITEMS em src/components/layout/Layout.tsx), não um URL —
  -- esta app navega por id de página, não por rota.
  IF NEW.remetente_role = 'aluno' THEN
    INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
    SELECT id, 'Nova mensagem de ' || COALESCE(v_aluno_nome, 'aluno'), v_snippet, 'info', 'chat'
    FROM profiles WHERE role IN ('admin','superadmin','atendimento');
  ELSE
    INSERT INTO notificacoes (profile_id, titulo, corpo, tipo, link)
    SELECT profile_id, 'Nova mensagem da academia', v_snippet, 'info', 'mensagens'
    FROM alunos WHERE id = NEW.aluno_id AND profile_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notificar_nova_mensagem_chat
  AFTER INSERT ON mensagens_chat
  FOR EACH ROW EXECUTE FUNCTION notificar_nova_mensagem_chat();

REVOKE EXECUTE ON FUNCTION notificar_nova_mensagem_chat() FROM PUBLIC;

-- ── VIEW: KPIs dashboard ─────────────────────────────────────
CREATE OR REPLACE VIEW v_kpis WITH (security_invoker = true) AS
SELECT
  COUNT(a.id)                                                            AS total_alunos,
  COUNT(a.id) FILTER (WHERE a.status = 'ativo')                         AS alunos_ativos,
  COALESCE(SUM(p.valor) FILTER (WHERE p.status = 'pago'
    AND p.data_pagamento >= DATE_TRUNC('month', NOW())), 0)              AS receita_mensal,
  COALESCE(SUM(p.valor) FILTER (WHERE p.status = 'pendente'
    AND p.vencimento >= DATE_TRUNC('month', NOW())), 0)                  AS receita_prevista,
  COUNT(a.id) FILTER (WHERE a.data_matricula >= NOW() - INTERVAL '30 days') AS novos_alunos,
  COUNT(DISTINCT p.aluno_id) FILTER (WHERE p.status IN ('pendente','vencido')) AS inadimplentes
FROM alunos a
LEFT JOIN pagamentos p ON p.aluno_id = a.id;

-- ── VIEW: professores (profiles + professor_extras) ───────────
-- Read-only, sem duplicar nome/email/telefone — ver comentário junto
-- à criação de professor_extras.
CREATE OR REPLACE VIEW professores WITH (security_invoker = true) AS
SELECT
  p.id, p.nome, p.email, p.telefone,
  COALESCE(pe.faixa, 'preta')  AS faixa,
  COALESCE(pe.grau, 0)         AS grau,
  COALESCE(pe.turmas, '{}')    AS turmas,
  pe.data_admissao,
  COALESCE(pe.status, 'ativo') AS status,
  pe.foto
FROM profiles p
LEFT JOIN professor_extras pe ON pe.id = p.id
WHERE p.role = 'professor';

-- ── FUNCTION: calcular frequência ────────────────────────────
CREATE OR REPLACE FUNCTION calcular_frequencia(p_aluno_id UUID, p_meses INT DEFAULT 3)
RETURNS INT AS $$
DECLARE total_aulas INT; aulas_aluno INT;
BEGIN
  -- Total unique class days offered (any student checked in)
  SELECT COUNT(DISTINCT data) INTO total_aulas FROM presencas
  WHERE created_at >= NOW() - (p_meses || ' months')::INTERVAL AND tipo = 'checkin';
  -- Student's unique days present (multiple check-ins same day count as 1)
  SELECT COUNT(DISTINCT data) INTO aulas_aluno FROM presencas
  WHERE aluno_id = p_aluno_id AND tipo = 'checkin'
  AND created_at >= NOW() - (p_meses || ' months')::INTERVAL;
  IF total_aulas = 0 THEN RETURN 0; END IF;
  RETURN LEAST(100, ROUND((aulas_aluno::NUMERIC / total_aulas) * 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-update alunos.frequencia after every check-in
CREATE OR REPLACE FUNCTION atualizar_frequencia_aluno()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE alunos SET frequencia = calcular_frequencia(NEW.aluno_id) WHERE id = NEW.aluno_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_atualizar_frequencia ON presencas;
CREATE TRIGGER trg_atualizar_frequencia
  AFTER INSERT ON presencas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_frequencia_aluno();

-- ── FUNCTION EXECUTE PRIVILEGES ───────────────────────────────
-- Postgres grants EXECUTE on every new function to PUBLIC by
-- default, which means anon/authenticated could call any of these
-- directly via /rest/v1/rpc/<function>, not just through the
-- trigger/RLS paths they were written for (Advisor: "Public Can
-- Execute SECURITY DEFINER Function").
--
-- Trigger functions (handle_new_user, restringir_update_aluno,
-- set_updated_at, atualizar_frequencia_aluno) are invoked internally
-- when their trigger fires — that doesn't check the calling
-- session's EXECUTE privilege — so revoking EXECUTE from everyone
-- is safe and doesn't affect any app behaviour.
--
-- calcular_frequencia() is not a trigger and is never called from
-- the frontend (no .rpc() usage in src/), yet took an arbitrary
-- p_aluno_id with no ownership check — anyone, including anon,
-- could call it directly and read any specific student's attendance
-- percentage. Revoking public EXECUTE closes that; the only real
-- caller (atualizar_frequencia_aluno, itself SECURITY DEFINER) still
-- works because it runs as the function owner, who always retains
-- EXECUTE on their own functions regardless of this revoke.
REVOKE EXECUTE ON FUNCTION handle_new_user()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION restringir_update_aluno()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION sincronizar_ban_aluno()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION set_updated_at()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION calcular_frequencia(UUID, INT)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION atualizar_frequencia_aluno()    FROM PUBLIC;

-- auth_role() and my_aluno_id() are the odd ones out: they're called
-- from INSIDE every RLS policy in this file, evaluated under the
-- querying session's own role — so anon and authenticated both need
-- to be able to call them, or RLS itself stops working. That's
-- incompatible with fully locking down EXECUTE the way the other
-- five functions above are. Instead, both live in the "private"
-- schema (created above), which isn't in PostgREST's exposed schema
-- list (api.schemas in config.toml locally; Project Settings → API →
-- Exposed schemas on a hosted project) — so PostgREST never creates
-- a /rest/v1/rpc/auth_role or /rest/v1/rpc/my_aluno_id endpoint for
-- them at all, while RLS policies inside "public" can still call
-- them by their schema-qualified name.
GRANT USAGE ON SCHEMA private TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.auth_role()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.my_aluno_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.auth_role()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.my_aluno_id() TO anon, authenticated;

-- ── REALTIME ─────────────────────────────────────────────────
-- supabase_realtime starts with no tables attached — useModulos.tsx's
-- postgres_changes subscription on "configuracoes" would silently
-- never fire without this, even though .subscribe() itself succeeds.
ALTER PUBLICATION supabase_realtime ADD TABLE configuracoes;
-- ChatPage.tsx / aluno Mensagens.tsx (mensagens_chat) and the header
-- notification bell (notificacoes) both rely on postgres_changes.
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;

-- ── STORAGE: avatars ─────────────────────────────────────────
-- useUploadAvatar (src/hooks/useProfile.ts) uploads to a bucket that
-- was never provisioned — every avatar upload failed with "Bucket
-- not found". Path convention is "<user_id>/avatar.<ext>", so the
-- first path segment is the owner's own auth.uid().
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatares são publicamente legíveis" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Utilizador faz upload do próprio avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Utilizador substitui o próprio avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (SELECT auth.uid())::text = (storage.foldername(name))[1]);

-- ============================================================
-- Schema completo: 21 tabelas, RLS em todas, 3 views, 5 funções
-- Pronto para produção GB Braga
-- ============================================================
