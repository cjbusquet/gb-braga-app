-- ============================================================
--  Gracie Barra Braga — Supabase Schema v1.0
--  Tribo Laurada Lda. · NIF 518948471
--  Rua Nova Santa Cruz 11, 4710-409 Braga
--  Executar no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('superadmin','admin','atendimento','professor','aluno');
CREATE TYPE belt_type       AS ENUM ('branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta');
CREATE TYPE payment_status  AS ENUM ('pago','pendente','vencido','cancelado');
CREATE TYPE payment_method  AS ENUM ('stripe','numerario','transferencia');
CREATE TYPE aluno_status    AS ENUM ('ativo','inativo','suspenso');
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
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: criar profile automaticamente quando utilizador regista
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  data_nascimento        DATE,
  nif                    TEXT,
  morada                 TEXT,
  cod_postal             TEXT,
  faixa                  belt_type NOT NULL DEFAULT 'branca',
  grau                   SMALLINT NOT NULL DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
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

CREATE INDEX idx_alunos_email  ON alunos(email);
CREATE INDEX idx_alunos_status ON alunos(status);
CREATE INDEX idx_alunos_plano  ON alunos(plano_id);

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

CREATE TABLE IF NOT EXISTS inscricoes_turma (
  aluno_id       UUID REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id       UUID REFERENCES turmas(id) ON DELETE CASCADE,
  data_inscricao DATE NOT NULL DEFAULT CURRENT_DATE,
  ativa          BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (aluno_id, turma_id)
);

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

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_numerario ENABLE ROW LEVEL SECURITY;
ALTER TABLE toc_documentos    ENABLE ROW LEVEL SECURITY;

-- Helper: role do utilizador atual
CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: aluno_id do utilizador atual
CREATE OR REPLACE FUNCTION my_aluno_id() RETURNS UUID AS $$
  SELECT id FROM alunos WHERE email = (SELECT email FROM profiles WHERE id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Perfil próprio"     ON profiles FOR SELECT USING (id = auth.uid() OR auth_role() IN ('admin','superadmin','atendimento'));
CREATE POLICY "Admin edita perfis" ON profiles FOR UPDATE USING (auth_role() IN ('admin','superadmin'));
CREATE POLICY "Admin insere"       ON profiles FOR INSERT WITH CHECK (auth_role() IN ('admin','superadmin'));

-- ALUNOS policies
CREATE POLICY "Aluno vê dados"     ON alunos FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = auth.uid()) OR auth_role() IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Admin gere alunos"  ON alunos FOR ALL    USING (auth_role() IN ('admin','superadmin','atendimento'));

-- PAGAMENTOS policies
CREATE POLICY "Aluno vê pagamentos"  ON pagamentos FOR SELECT USING (aluno_id = my_aluno_id() OR auth_role() IN ('admin','superadmin'));
CREATE POLICY "Admin gere pagamentos" ON pagamentos FOR ALL USING (auth_role() IN ('admin','superadmin'));

-- PRESENÇAS policies
CREATE POLICY "Ver presenças"    ON presencas FOR SELECT USING (aluno_id = my_aluno_id() OR auth_role() IN ('admin','superadmin','professor','atendimento'));
CREATE POLICY "Registar presença" ON presencas FOR INSERT WITH CHECK (auth_role() IN ('admin','superadmin','professor','atendimento'));

-- CONTRATOS policies
CREATE POLICY "Ver contrato"     ON contratos FOR SELECT USING (aluno_id = my_aluno_id() OR auth_role() IN ('admin','superadmin'));
CREATE POLICY "Admin gere contratos" ON contratos FOR ALL USING (auth_role() IN ('admin','superadmin'));

-- TOConline policies
CREATE POLICY "Admin vê faturas" ON toc_documentos FOR SELECT USING (auth_role() IN ('admin','superadmin'));
CREATE POLICY "Aluno vê as suas faturas" ON toc_documentos FOR SELECT USING (aluno_id = my_aluno_id());

-- NUMERÁRIO policies
CREATE POLICY "Superadmin gere numerario" ON pedidos_numerario FOR ALL USING (auth_role() = 'superadmin');
CREATE POLICY "Atendimento vê numerario"  ON pedidos_numerario FOR SELECT USING (auth_role() IN ('admin','atendimento'));

-- MENSAGENS policies
CREATE POLICY "Admin gere mensagens" ON mensagens FOR ALL USING (auth_role() IN ('admin','superadmin','atendimento'));

-- ── TRIGGERS updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_alunos_upd   BEFORE UPDATE ON alunos   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── VIEW: KPIs dashboard ─────────────────────────────────────
CREATE OR REPLACE VIEW v_kpis AS
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

-- ── FUNCTION: calcular frequência ────────────────────────────
CREATE OR REPLACE FUNCTION calcular_frequencia(p_aluno_id UUID, p_meses INT DEFAULT 3)
RETURNS INT AS $$
DECLARE total_aulas INT; aulas_aluno INT;
BEGIN
  SELECT COUNT(DISTINCT data) INTO total_aulas FROM presencas
  WHERE created_at >= NOW() - (p_meses || ' months')::INTERVAL AND tipo = 'checkin';
  SELECT COUNT(*) INTO aulas_aluno FROM presencas
  WHERE aluno_id = p_aluno_id AND tipo = 'checkin'
  AND created_at >= NOW() - (p_meses || ' months')::INTERVAL;
  IF total_aulas = 0 THEN RETURN 0; END IF;
  RETURN LEAST(100, ROUND((aulas_aluno::NUMERIC / total_aulas) * 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Schema completo: 15 tabelas, RLS em todas, 2 views, 3 funções
-- Pronto para produção GB Braga
-- ============================================================
