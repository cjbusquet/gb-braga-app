export type UserRole = 'superadmin' | 'admin' | 'atendimento' | 'professor' | 'aluno';

export type Belt = 'branca' | 'cinza' | 'amarela' | 'laranja' | 'verde' | 'azul' | 'roxa' | 'marrom' | 'preta' | 'vermelha';

export type PaymentStatus = 'pago' | 'pendente' | 'vencido' | 'cancelado';

export type PaymentMethod = 'stripe' | 'dinheiro' | 'transferencia';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
  matriculaCompleta?: boolean;
  telefone?: string;
  createdAt: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  dataNascimento: string;
  faixa: Belt;
  grau: number; // 0-4
  dataMatricula: string;
  plano: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  foto?: string;
  cpf?: string;
  endereco?: string;
  responsavel?: string; // for minors
  frequencia: number; // percentage
  proximaGraduacao?: string;
  stripeCustomerId?: string;
}

export interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  faixa: Belt;
  grau: number;
  turmas: string[];
  dataAdmissao: string;
  status: 'ativo' | 'inativo';
  foto?: string;
}

export interface Turma {
  id: string;
  nome: string;
  professorId: string;
  professorNome: string;
  horario: string;
  diaSemana: string[];
  sala: string;
  capacidade: number;
  inscritos: number;
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'kids' | 'all';
  tipo: 'gi' | 'nogi' | 'wrestling' | 'kids';
}

export interface Pagamento {
  id: string;
  alunoId: string;
  alunoNome: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: PaymentStatus;
  metodo?: PaymentMethod;
  plano: string;
  stripePaymentId?: string;
  descricao?: string;
}

export interface Presenca {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
  data: string;
  hora: string;
  tipo: 'checkin' | 'checkout';
  metodo: 'qrcode' | 'manual' | 'app' | 'gps';
}

export interface Mensagem {
  id: string;
  para: string; // alunoId or 'all'
  paraNome: string;
  canal: 'whatsapp' | 'sms' | 'email' | 'push';
  assunto?: string;
  corpo: string;
  status: 'enviado' | 'pendente' | 'erro' | 'lido';
  dataEnvio: string;
  remetente: string;
}

export interface Graduacao {
  id: string;
  alunoId: string;
  alunoNome: string;
  faixaAnterior: Belt;
  grauAnterior: number;
  faixaNova: Belt;
  grauNovo: number;
  data: string;
  professorId: string;
  professorNome: string;
  observacao?: string;
}

export interface Plano {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
  aulas: number | 'ilimitado';
  ativo: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  categoria?: string;
}

export interface KPIs {
  totalAlunos: number;
  alunosAtivos: number;
  receitaMensal: number;
  receitaPrevista: number;
  inadimplentes: number;
  taxaFrequencia: number;
  novosAlunos: number;
  cancelamentos: number;
  taxaRetencao: number;
}

export interface Notificacao {
  id: string;
  titulo: string;
  corpo: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  lida: boolean;
  data: string;
  link?: string;
}

export interface Contrato {
  id: string;
  alunoId: string;
  alunoNome: string;
  plano: string;
  dataInicio: string;
  dataFim?: string;
  valor: number;
  status: 'ativo' | 'cancelado' | 'expirado';
  assinado: boolean;
  dataAssinatura?: string;
}

// TOConline integration fields
export interface TocDocumento {
  id: string;
  numero: string;          // e.g. "FR 2025/1001"
  tipo: 'FR' | 'FT' | 'FS';
  dataEmissao: string;
  valorTotal: number;
  ivaTotal: number;
  valorSemIVA: number;
  pdfUrl?: string;
  stripePaymentId?: string;
  alunoNome: string;
  plano: string;
  estado: 'emitida' | 'enviada' | 'erro';
}

export interface TocConfig {
  apiUrl: string;
  oauthUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  simulationMode: boolean;
  empresaNome: string;
  empresaNIF: string;
  serieDocumentos: string;
}

// Extended Plano with real GB Braga fields
// (added to existing Plano interface via declaration merge not possible — extending here)
