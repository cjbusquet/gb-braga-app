/**
 * Placeholders de carregamento padronizados — usar em vez de texto "A carregar..."
 * ou de listas vazias, para evitar o flick visual de dados/layout a piscar
 * antes do conteúdo real chegar. Mantêm a mesma altura/estrutura do conteúdo
 * final para não causar reflow quando os dados carregam.
 */

interface SkeletonProps {
  className?: string;
}

/** Bloco genérico — compor com className para controlar tamanho/forma. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={['rounded-sm animate-pulse bg-elevated', className].join(' ')} />;
}

/** Linha de texto — largura por omissão simula uma frase curta. */
export function SkeletonText({ className = 'w-32 h-3.5' }: SkeletonProps) {
  return <Skeleton className={['rounded-full', className].join(' ')} />;
}

/** Uma linha de lista — avatar circular + duas linhas de texto, como as linhas reais das listas de alunos/turmas/etc. */
export function SkeletonRow() {
  return (
    <div className="flex gap-3.5 items-center py-3.5 px-[18px] rounded-lg border border-border bg-card">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <SkeletonText className="mb-2 w-1/3 h-3.5" />
        <SkeletonText className="w-1/2 h-3" />
      </div>
      <Skeleton className="w-16 h-5 rounded-full shrink-0" />
    </div>
  );
}

/** Lista de N linhas — substituto directo de "A carregar..." em listagens (alunos, turmas, graduações, ...). */
export function SkeletonList({ rows = 5, className = '' }: SkeletonProps & { rows?: number }) {
  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

/** Cartão retangular — para KPIs/estatísticas enquanto carregam. */
export function SkeletonCard({ className = 'h-20' }: SkeletonProps) {
  return <Skeleton className={['rounded-md', className].join(' ')} />;
}
