import type { Aluno, Professor, Turma, Pagamento, Presenca, Mensagem, Graduacao, Plano, KPIs, Contrato, User, TocDocumento, TocConfig } from '../types';

// ─── DADOS REAIS — Gracie Barra Braga ────────────────────────────────────────
// Fonte: gbbraga.com | Morada: Rua Nova Santa Cruz 11, 4710-409 Braga
// Tel: +351 927 773 854 | Email: atendimento@gbbraga.com

export const ACADEMIA = {
  nome:       'Gracie Barra Braga',
  nomeCompleto: 'Gracie Barra Braga — Brazilian Jiu-Jitsu',
  morada:     'Rua Nova Santa Cruz 11, 4710-409, Braga, Portugal',
  tel:        '+351 927 773 854',
  whatsapp:   '+351927773854',
  email:      'atendimento@gbbraga.com',
  website:    'https://gbbraga.com',
  instagram:  'https://www.instagram.com/graciebarrabraga/',
  linkedin:   'https://www.linkedin.com/company/gracie-barra-braga',
  horarios: {
    semana: 'Segunda a Sexta: 18h00 – 22h00',
    sabado: 'Sábado: 10h00 – 13h00',
    domingo: 'Encerrado',
  },
  nif:   '512345678',     // ← SUBSTITUIR pelo NIF real
  ipdj:  'AL-XXXXX',     // ← SUBSTITUIR pelo alvará IPDJ real
  stripe_pk: 'pk_live_', // ← SUBSTITUIR pela chave Stripe real
};

// ─── PLANOS REAIS (valores a confirmar pelo Carlos) ───────────────────────────
// A página central-de-pagamento usa Stripe embedded — os valores exatos
// devem ser confirmados pelo Carlos e os Stripe Price IDs inseridos aqui.
export const mockPlanos: Plano[] = [
  // ── PLANOS ADULTO ──
  {
    id: 'pl-adulto-plus',
    nome: 'Jiu-Jitsu Adulto Plus',
    valor: 62,
    descricao: 'Plano mensal individual adulto — aulas ilimitadas',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'adulto',
    stripePriceId: 'price_adulto_plus',
  },
  {
    id: 'pl-adulto-fundador',
    nome: 'Jiu-Jitsu Adulto Fundador',
    valor: 53,
    descricao: 'Preço especial para sócios fundadores adulto',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'fundador',
    stripePriceId: 'price_adulto_fundador',
  },
  {
    id: 'pl-estudante',
    nome: 'Jiu-Jitsu Estudante (Cartão Universitário)',
    valor: 53,
    descricao: 'Plano mensal com desconto para estudantes universitários',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'adulto',
    stripePriceId: 'price_estudante',
  },
  // ── PLANOS KIDS ──
  {
    id: 'pl-kids-plus',
    nome: 'Jiu-Jitsu Kids Plus',
    valor: 53,
    descricao: 'Plano mensal para crianças e jovens',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'kids',
    stripePriceId: 'price_kids_plus',
  },
  {
    id: 'pl-kids-fundador',
    nome: 'Jiu-Jitsu Kids Fundador',
    valor: 45,
    descricao: 'Preço especial sócio fundador — kids',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'fundador',
    stripePriceId: 'price_kids_fundador',
  },
  // ── PLANOS FAMÍLIA ──
  {
    id: 'pl-familia-2',
    nome: 'Família 2 membros',
    valor: 115,
    descricao: 'Plano mensal para 2 membros da mesma família',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'familia',
    stripePriceId: 'price_familia_2',
  },
  {
    id: 'pl-familia-3',
    nome: 'Família 3 membros',
    valor: 165,
    descricao: 'Plano mensal para 3 membros da mesma família',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'familia',
    stripePriceId: 'price_familia_3',
  },
  {
    id: 'pl-familia-3-kids',
    nome: 'Família 3 membros (Kids incluído)',
    valor: 150,
    descricao: 'Plano mensal para família com kids incluído',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'familia',
    stripePriceId: 'price_familia_3_kids',
  },
  {
    id: 'pl-familia-4',
    nome: 'Família 4 membros',
    valor: 200,
    descricao: 'Plano mensal para 4 membros da mesma família',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'familia',
    stripePriceId: 'price_familia_4',
  },
  // ── PLANOS FAMÍLIA FUNDADOR ──
  {
    id: 'pl-familia-2-fund',
    nome: 'Família 2 Fundador',
    valor: 109,
    descricao: 'Preço especial sócio fundador — família 2 membros',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'fundador',
    stripePriceId: 'price_familia_2_fund',
  },
  {
    id: 'pl-familia-3-fund',
    nome: 'Família 3 Fundador',
    valor: 157,
    descricao: 'Preço especial sócio fundador — família 3 membros',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'fundador',
    stripePriceId: 'price_familia_3_fund',
  },
  {
    id: 'pl-familia-4-fund',
    nome: 'Família 4 Fundador',
    valor: 190,
    descricao: 'Preço especial sócio fundador — família 4 membros',
    aulas: 'ilimitado',
    ativo: true,
    categoria: 'fundador',
    stripePriceId: 'price_familia_4_fund',
  },
];


// ─── UTILIZADORES DEMO ────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'u1', nome: 'Carlos Silva',   email: 'superadmin@gbbraga.com', role: 'superadmin', telefone: '+351927773854', createdAt: '2023-01-01' },
  { id: 'u2', nome: 'Ana Ferreira',   email: 'admin@gbbraga.com',      role: 'admin',      telefone: '+351912345679', createdAt: '2023-01-15' },
  { id: 'u3', nome: 'Marco Costa',    email: 'recepcao@gbbraga.com',   role: 'atendimento',telefone: '+351912345680', createdAt: '2023-02-01' },
  { id: 'u4', nome: 'Prof. João Santos', email: 'joao@gbbraga.com',    role: 'professor',  telefone: '+351912345681', createdAt: '2022-06-01' },
  { id: 'u5', nome: 'Lucas Oliveira', email: 'lucas@gmail.com',        role: 'aluno',      telefone: '+351912345682', createdAt: '2024-01-10', matriculaCompleta: true },
  { id: 'u6', nome: 'Novo Aluno',      email: 'novo@gbbraga.com',        role: 'aluno',      telefone: '',                createdAt: '2025-05-13', matriculaCompleta: false },
];

// ─── ALUNOS DEMO ──────────────────────────────────────────────────────────────
export const mockAlunos: Aluno[] = [
  { id: 'a1', nome: 'Lucas Oliveira', email: 'lucas@gmail.com',  telefone: '+351912345682', whatsapp: '+351912345682', dataNascimento: '1995-03-15', faixa: 'azul',   grau: 2, dataMatricula: '2024-01-10', plano: 'Jiu-Jitsu Adulto Plus', status: 'ativo',   frequencia: 87, stripeCustomerId: 'cus_demo001' },
  { id: 'a2', nome: 'Maria Santos',   email: 'maria@gmail.com',  telefone: '+351912345683', whatsapp: '+351912345683', dataNascimento: '1998-07-22', faixa: 'branca',  grau: 4, dataMatricula: '2024-03-01', plano: 'Jiu-Jitsu Adulto Plus', status: 'ativo',   frequencia: 92, stripeCustomerId: 'cus_demo002' },
  { id: 'a3', nome: 'Pedro Alves',    email: 'pedro@gmail.com',  telefone: '+351912345684', dataNascimento:            '1990-11-08', faixa: 'roxa',   grau: 1, dataMatricula: '2021-05-20', plano: 'Jiu-Jitsu Adulto Fundador', status: 'ativo',   frequencia: 76, stripeCustomerId: 'cus_demo003' },
  { id: 'a4', nome: 'Ana Lima',       email: 'ana@gmail.com',    telefone: '+351912345685', whatsapp: '+351912345685', dataNascimento: '2002-02-14', faixa: 'amarela', grau: 3, dataMatricula: '2023-09-01', plano: 'Jiu-Jitsu Adulto Plus', status: 'ativo',   frequencia: 95, stripeCustomerId: 'cus_demo004' },
  { id: 'a5', nome: 'Rafael Costa',   email: 'rafael@gmail.com', telefone: '+351912345686', dataNascimento:            '1988-06-30', faixa: 'azul',   grau: 0, dataMatricula: '2023-11-15', plano: 'Jiu-Jitsu Adulto Plus', status: 'inativo',  frequencia: 34 },
  { id: 'a6', nome: 'Sofia Mendes',   email: 'sofia@gmail.com',  telefone: '+351912345687', whatsapp: '+351912345687', dataNascimento: '1996-09-25', faixa: 'verde',   grau: 2, dataMatricula: '2022-08-10', plano: 'Jiu-Jitsu Adulto Plus',  status: 'ativo',   frequencia: 88, stripeCustomerId: 'cus_demo005' },
  { id: 'a7', nome: 'Diogo Ferreira', email: 'diogo@gmail.com',  telefone: '+351912345688', dataNascimento:            '2010-04-12', faixa: 'cinza',  grau: 4, dataMatricula: '2023-06-01', plano: 'Família 2 membros',    status: 'ativo',   frequencia: 91, responsavel: 'Paulo Ferreira' },
  { id: 'a8', nome: 'Carla Nunes',    email: 'carla@gmail.com',  telefone: '+351912345689', dataNascimento:            '1993-12-03', faixa: 'laranja', grau: 1, dataMatricula: '2023-04-15', plano: 'Jiu-Jitsu Adulto Plus', status: 'suspenso', frequencia: 22 },
];

// ─── PROFESSORES DEMO (Carlos vai fornecer os reais) ─────────────────────────
export const mockProfessores: Professor[] = [
  { id: 'p1', nome: 'Carlos Silva',     email: 'carlos@gbbraga.com',    telefone: '+351927773854', faixa: 'preta',  grau: 1, turmas: ['t1','t2','t3'], dataAdmissao: '2023-01-01', status: 'ativo' },
  { id: 'p2', nome: 'João Santos',      email: 'joao@gbbraga.com',      telefone: '+351912345681', faixa: 'preta',  grau: 1, turmas: ['t4','t5'],      dataAdmissao: '2023-01-01', status: 'ativo' },
  { id: 'p3', nome: 'Fernanda Rocha',   email: 'fernanda@gbbraga.com',  telefone: '+351912345690', faixa: 'marrom', grau: 3, turmas: ['t6'],            dataAdmissao: '2023-06-01', status: 'ativo' },
];

// ─── TURMAS (horários reais do site) ─────────────────────────────────────────
// Horários reais: Seg-Sex 18h-22h · Sáb 10h-13h
export const mockTurmas: Turma[] = [
  { id: 't1', nome: 'Jiu-Jitsu Adultos — Noite 1', professorId: 'p1', professorNome: 'Carlos Silva',   horario: '18:00-19:30', diaSemana: ['Segunda','Quarta','Sexta'],   sala: 'Tatame Principal', capacidade: 20, inscritos: 15, nivel: 'all',          tipo: 'gi' },
  { id: 't2', nome: 'Jiu-Jitsu Adultos — Noite 2', professorId: 'p1', professorNome: 'Carlos Silva',   horario: '19:30-21:00', diaSemana: ['Segunda','Quarta','Sexta'],   sala: 'Tatame Principal', capacidade: 20, inscritos: 18, nivel: 'all',          tipo: 'gi' },
  { id: 't3', nome: 'Jiu-Jitsu Avançado',          professorId: 'p1', professorNome: 'Carlos Silva',   horario: '21:00-22:00', diaSemana: ['Terça','Quinta'],             sala: 'Tatame Principal', capacidade: 15, inscritos: 10, nivel: 'avancado',     tipo: 'gi' },
  { id: 't4', nome: 'No-Gi / Wrestling',            professorId: 'p2', professorNome: 'João Santos',   horario: '20:00-21:30', diaSemana: ['Terça','Quinta'],             sala: 'Tatame Principal', capacidade: 15, inscritos: 11, nivel: 'all',          tipo: 'nogi' },
  { id: 't5', nome: 'Kids Jiu-Jitsu',              professorId: 'p2', professorNome: 'João Santos',   horario: '18:00-19:00', diaSemana: ['Terça','Quinta'],             sala: 'Tatame Principal', capacidade: 20, inscritos: 14, nivel: 'kids',         tipo: 'kids' },
  { id: 't6', nome: 'Open Mat — Sábado',           professorId: 'p3', professorNome: 'Fernanda Rocha',horario: '10:00-12:30', diaSemana: ['Sábado'],                     sala: 'Tatame Principal', capacidade: 30, inscritos: 20, nivel: 'all',          tipo: 'gi'   },
];

// ─── PAGAMENTOS DEMO ──────────────────────────────────────────────────────────
export const mockPagamentos: Pagamento[] = [
  { id: 'pg1', alunoId: 'a1', alunoNome: 'Lucas Oliveira', valor: 62,  vencimento: '2025-05-05', pagamento: '2025-05-03', status: 'pago',     metodo: 'stripe', plano: 'Jiu-Jitsu Adulto Plus',        stripePaymentId: 'pi_demo001' },
  { id: 'pg1b',alunoId: 'a1', alunoNome: 'Lucas Oliveira', valor: 62,  vencimento: '2025-06-05',                         status: 'pendente',                   plano: 'Jiu-Jitsu Adulto Plus' },
  { id: 'pg2', alunoId: 'a2', alunoNome: 'Maria Santos',   valor: 62,  vencimento: '2025-05-05',                         status: 'pendente',                   plano: 'Jiu-Jitsu Adulto Plus' },
  { id: 'pg3', alunoId: 'a3', alunoNome: 'Pedro Alves',    valor: 53,  vencimento: '2025-05-01', pagamento: '2025-04-28', status: 'pago',     metodo: 'stripe', plano: 'Jiu-Jitsu Adulto Fundador',    stripePaymentId: 'pi_demo002' },
  { id: 'pg4', alunoId: 'a4', alunoNome: 'Ana Lima',       valor: 62,  vencimento: '2025-04-25',                         status: 'vencido',                    plano: 'Jiu-Jitsu Adulto Plus' },
  { id: 'pg5', alunoId: 'a5', alunoNome: 'Rafael Costa',   valor: 62,  vencimento: '2025-05-10',                         status: 'pendente',                   plano: 'Jiu-Jitsu Adulto Plus' },
  { id: 'pg6', alunoId: 'a6', alunoNome: 'Sofia Mendes',   valor: 115, vencimento: '2025-05-05', pagamento: '2025-05-02', status: 'pago',     metodo: 'stripe', plano: 'Família 2 membros',             stripePaymentId: 'pi_demo003' },
  { id: 'pg7', alunoId: 'a7', alunoNome: 'Diogo Ferreira', valor: 53,  vencimento: '2025-05-05',                         status: 'pendente',                   plano: 'Jiu-Jitsu Kids Plus' },
  { id: 'pg8', alunoId: 'a8', alunoNome: 'Carla Nunes',    valor: 62,  vencimento: '2025-03-05',                         status: 'vencido',                    plano: 'Jiu-Jitsu Adulto Plus' },
];


export const mockPresencas: Presenca[] = [
  { id: 'pr1', alunoId: 'a1', alunoNome: 'Lucas Oliveira', turmaId: 't1', turmaNome: 'Jiu-Jitsu Adultos — Noite 1', data: '2025-05-05', hora: '18:05', tipo: 'checkin', metodo: 'qrcode' },
  { id: 'pr2', alunoId: 'a2', alunoNome: 'Maria Santos',   turmaId: 't1', turmaNome: 'Jiu-Jitsu Adultos — Noite 1', data: '2025-05-05', hora: '18:02', tipo: 'checkin', metodo: 'app'    },
  { id: 'pr3', alunoId: 'a4', alunoNome: 'Ana Lima',       turmaId: 't1', turmaNome: 'Jiu-Jitsu Adultos — Noite 1', data: '2025-05-05', hora: '18:10', tipo: 'checkin', metodo: 'manual' },
  { id: 'pr4', alunoId: 'a6', alunoNome: 'Sofia Mendes',   turmaId: 't4', turmaNome: 'No-Gi / Wrestling',           data: '2025-05-05', hora: '20:03', tipo: 'checkin', metodo: 'qrcode' },
  { id: 'pr5', alunoId: 'a1', alunoNome: 'Lucas Oliveira', turmaId: 't1', turmaNome: 'Jiu-Jitsu Adultos — Noite 1', data: '2025-05-07', hora: '18:01', tipo: 'checkin', metodo: 'qrcode' },
];

export const mockMensagens: Mensagem[] = [
  { id: 'm1', para: 'a2', paraNome: 'Maria Santos',  canal: 'whatsapp', corpo: 'Olá Maria! A tua mensalidade de Maio vence em 3 dias. Paga aqui: gbbraga.com/central-de-pagamento', status: 'enviado', dataEnvio: '2025-05-02T10:30:00', remetente: 'Sistema' },
  { id: 'm2', para: 'all',paraNome: 'Todos os Alunos',canal: 'email',   assunto: 'Seminário Especial — Junho 2025', corpo: 'Temos o prazer de anunciar um seminário especial...', status: 'enviado', dataEnvio: '2025-04-28T09:00:00', remetente: 'Admin' },
  { id: 'm3', para: 'a4', paraNome: 'Ana Lima',       canal: 'whatsapp', corpo: 'Ana, a tua mensalidade está vencida há 10 dias. Contacta-nos: +351 927 773 854', status: 'enviado', dataEnvio: '2025-05-04T14:00:00', remetente: 'Sistema' },
  { id: 'm4', para: 'a8', paraNome: 'Carla Nunes',    canal: 'sms',      corpo: 'GB Braga: A sua conta está suspensa por inadimplência. Contacte-nos: +351927773854', status: 'enviado', dataEnvio: '2025-05-01T10:00:00', remetente: 'Sistema' },
];

export const mockGraduacoes: Graduacao[] = [
  { id: 'g1', alunoId: 'a1', alunoNome: 'Lucas Oliveira', faixaAnterior: 'azul',   grauAnterior: 1, faixaNova: 'azul',   grauNovo: 2, data: '2025-03-15', professorId: 'p1', professorNome: 'Carlos Silva' },
  { id: 'g2', alunoId: 'a4', alunoNome: 'Ana Lima',       faixaAnterior: 'amarela',grauAnterior: 2, faixaNova: 'amarela',grauNovo: 3, data: '2025-03-15', professorId: 'p1', professorNome: 'Carlos Silva' },
  { id: 'g3', alunoId: 'a2', alunoNome: 'Maria Santos',   faixaAnterior: 'branca', grauAnterior: 3, faixaNova: 'branca', grauNovo: 4, data: '2025-01-20', professorId: 'p1', professorNome: 'Carlos Silva', observacao: 'Excelente progresso técnico' },
];

export const mockKPIs: KPIs = {
  totalAlunos:    127,
  alunosAtivos:   112,
  receitaMensal:  7840,
  receitaPrevista:8500,
  inadimplentes:  2,
  taxaFrequencia: 78,
  novosAlunos:    3,
  cancelamentos:  1,
  taxaRetencao:   89,
};

export const mockContratos: Contrato[] = [
  { id: 'c1', alunoId: 'a1', alunoNome: 'Lucas Oliveira', plano: 'Jiu-Jitsu Adulto Plus',   dataInicio: '2024-01-10', valor: 89, status: 'ativo',     assinado: true, dataAssinatura: '2024-01-10' },
  { id: 'c2', alunoId: 'a2', alunoNome: 'Maria Santos',   plano: 'Jiu-Jitsu Adulto Plus',   dataInicio: '2024-03-01', valor: 89, status: 'ativo',     assinado: true, dataAssinatura: '2024-03-01' },
  { id: 'c3', alunoId: 'a3', alunoNome: 'Pedro Alves',    plano: 'Jiu-Jitsu Adulto Fundador',dataInicio:'2023-05-01', valor: 69, status: 'ativo',     assinado: true, dataAssinatura: '2023-05-01' },
  { id: 'c4', alunoId: 'a5', alunoNome: 'Rafael Costa',   plano: 'Jiu-Jitsu Adulto Plus',   dataInicio: '2023-11-15', valor: 89, status: 'cancelado', assinado: true, dataAssinatura: '2023-11-15' },
];

export const revenueHistory = [
  { mes: 'Dez', valor: 6920 },
  { mes: 'Jan', valor: 7210 },
  { mes: 'Fev', valor: 7380 },
  { mes: 'Mar', valor: 7650 },
  { mes: 'Abr', valor: 7720 },
  { mes: 'Mai', valor: 7840 },
];

export const beltColors: Record<string, string> = {
  branca: '#F0EEFF', cinza: '#6B7280', amarela: '#EAB308', laranja: '#EA580C',
  verde: '#16A34A', azul: '#1D4ED8', roxa: '#7C3AED', marrom: '#7C4A35',
  preta: '#111111', vermelha: '#C8102E',
};

export const mockTocDocumentos: TocDocumento[] = [
  { id: 'toc_1001', numero: 'FR 2025/1001', tipo: 'FR', dataEmissao: '2025-05-03', valorTotal: 62,  ivaTotal: 11.59, valorSemIVA: 50.41, pdfUrl: 'https://integration.toconline.pt/pdf/1001', stripePaymentId: 'pi_demo001', alunoNome: 'Lucas Oliveira', plano: 'Jiu-Jitsu Adulto Plus', estado: 'enviada' },
  { id: 'toc_1002', numero: 'FR 2025/1002', tipo: 'FR', dataEmissao: '2025-04-28', valorTotal: 53,  ivaTotal:  9.91, valorSemIVA: 43.09, pdfUrl: 'https://integration.toconline.pt/pdf/1002', stripePaymentId: 'pi_demo002', alunoNome: 'Pedro Alves',    plano: 'Jiu-Jitsu Adulto Fundador', estado: 'enviada' },
  { id: 'toc_1003', numero: 'FR 2025/1003', tipo: 'FR', dataEmissao: '2025-01-02', valorTotal: 115, ivaTotal: 21.50, valorSemIVA: 93.50,pdfUrl: 'https://integration.toconline.pt/pdf/1003', stripePaymentId: 'pi_demo003', alunoNome: 'Sofia Mendes',   plano: 'Jiu-Jitsu Adulto Plus', estado: 'enviada' },
];

export const defaultTocConfig: TocConfig = {
  apiUrl:         'https://app.toconline.pt',
  oauthUrl:       'https://app.toconline.pt',
  clientId:       '',
  clientSecret:   '',
  simulationMode: true,
  empresaNome:    'Gracie Barra Braga',
  empresaNIF:     '512345678',       // ← CONFIRMAR
  serieDocumentos:'GB2025',
};
