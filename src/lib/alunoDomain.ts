import type { Aluno, Belt } from '../types';

/**
 * Progressão completa de faixas, da branca à preta, na ordem em que são
 * conquistadas. Exclui a vermelha (faixa honorária, atribuída fora do
 * fluxo normal de graduação).
 */
export const FAIXAS_PROGRESSAO: Belt[] = [
  'branca',
  'cinza-branca', 'cinza', 'cinza-preta',
  'amarela-branca', 'amarela', 'amarela-preta',
  'laranja-branca', 'laranja', 'laranja-preta',
  'verde-branca', 'verde', 'verde-preta',
  'azul', 'roxa', 'marrom', 'preta',
];

/** Faixas kids/juvenil — branca + toda a progressão infantil bicolor, até verde/preta. */
const FAIXAS_KIDS: Belt[] = [
  'branca',
  'cinza-branca', 'cinza', 'cinza-preta',
  'amarela-branca', 'amarela', 'amarela-preta',
  'laranja-branca', 'laranja', 'laranja-preta',
  'verde-branca', 'verde', 'verde-preta',
];

/** Faixas adulto — progressão regulamentar (sem faixas infantis intermédias). */
const FAIXAS_ADULTO: Belt[] = ['branca', 'azul', 'roxa', 'marrom', 'preta', 'vermelha'];

/** Idade (em anos completos) a partir da qual se aplica a progressão de faixas de adulto. */
export const IDADE_LIMITE_KIDS = 16;

export function calcularIdade(dataNascimento: string | undefined | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

/**
 * Devolve o conjunto de faixas válidas para o escalão etário do aluno.
 * Sem data de nascimento conhecida, assume-se o escalão adulto (caso mais comum
 * para staff/professores, que normalmente não têm dataNascimento preenchida).
 */
export function getBeltSystemForAge(dataNascimento: string | undefined | null): Belt[] {
  const idade = calcularIdade(dataNascimento);
  if (idade === null || idade >= IDADE_LIMITE_KIDS) return FAIXAS_ADULTO;
  return FAIXAS_KIDS;
}

/** Aluno cuja matrícula ainda aguarda confirmação (pedido de pagamento em numerário por aprovar). */
export function isMatriculaPendente(aluno: Pick<Aluno, 'metodoPagamento' | 'numerarioAprovado'> | undefined | null): boolean {
  if (!aluno) return false;
  return aluno.metodoPagamento === 'numerario' && aluno.numerarioAprovado !== true;
}
