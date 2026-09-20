import type { Pagamento } from '../types';

// Situação financeira de um aluno, derivada dos seus pagamentos. Regra central
// partilhada pelo portal e pela página "Meu Financeiro": um pagamento só conta
// como "a pagar" quando está vencido ou quando é pendente e a data de
// vencimento já chegou — um pendente ainda a vencer (mês seguinte) é apenas
// informação, não um alerta.

export type EstadoFinanceiro = 'em_dia' | 'a_vencer' | 'em_atraso';

export interface SituacaoFinanceira {
  estado: EstadoFinanceiro;
  /** Pagamentos a regularizar já, do mais antigo para o mais recente. */
  emAberto: Pagamento[];
  totalEmAberto: number;
  /** O primeiro a pagar (o mais antigo em aberto). */
  aRegularizar?: Pagamento;
  /** Próxima mensalidade ainda a vencer — pendente com vencimento futuro. */
  proximaCobranca?: Pagamento;
  /** Dias até (+) ou desde (−) o vencimento de `aRegularizar ?? proximaCobranca`. 0 = hoje. */
  dias?: number;
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const porVencimento = (a: Pagamento, b: Pagamento): number =>
  a.vencimento.localeCompare(b.vencimento);

export function classificarFinanceiro(
  pagamentos: Pagamento[],
  hoje: Date = new Date(),
): SituacaoFinanceira {
  const h = iso(hoje);

  const emAberto = pagamentos
    .filter(p => p.status === 'vencido' || (p.status === 'pendente' && p.vencimento <= h))
    .sort(porVencimento);
  const proximaCobranca = pagamentos
    .filter(p => p.status === 'pendente' && p.vencimento > h)
    .sort(porVencimento)[0];

  const aRegularizar = emAberto[0];
  const estado: EstadoFinanceiro = !aRegularizar
    ? 'em_dia'
    : aRegularizar.status === 'vencido' || aRegularizar.vencimento < h
      ? 'em_atraso'
      : 'a_vencer';

  const alvo = aRegularizar ?? proximaCobranca;
  const dias = alvo
    ? Math.round((Date.parse(alvo.vencimento) - Date.parse(h)) / 86_400_000)
    : undefined;

  return {
    estado,
    emAberto,
    totalEmAberto: emAberto.reduce((s, p) => s + p.valor, 0),
    aRegularizar,
    proximaCobranca,
    dias,
  };
}

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Data ISO → "5 ago 2026". Devolve o input se não for data válida. */
export function fmtData(dataIso: string): string {
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime())) return dataIso;
  return `${d.getUTCDate()} ${MESES_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Rótulo + cor do estado de um pagamento individual (um pendente já vencido → "Em atraso"). */
export function rotuloPagamento(
  p: Pagamento,
  hoje: Date = new Date(),
): { label: string; cor: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (p.status === 'pago') return { label: 'Pago', cor: 'success' };
  if (p.status === 'cancelado') return { label: 'Cancelado', cor: 'neutral' };
  if (p.status === 'vencido' || p.vencimento < iso(hoje)) return { label: 'Em atraso', cor: 'danger' };
  return { label: 'Pendente', cor: 'warning' };
}
