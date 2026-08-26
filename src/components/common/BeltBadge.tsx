import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import BeltBar, { type BeltBarSize } from './BeltBar';

interface BeltBadgeProps {
  faixa: string;
  grau: number;
  size?: BeltBarSize;
  className?: string;
}

// Largura fixa do texto por tamanho — sem isto, o rótulo varia de
// largura consoante o nome da faixa ("Preta" vs "Amarela/Preta") e
// consoante ter ou não o sufixo "· Gn" (grau 0 não mostra sufixo
// nenhum), o que desalinha tudo o que vem a seguir num row/lista
// (badge de estado, seta ">", botão, etc.) de linha para linha.
const LABEL_WIDTH: Record<BeltBarSize, number> = { sm: 108, md: 128, lg: 150 };

/**
 * Representação padrão de faixa+grau em toda a app: uma BeltBar (a
 * única faixa visual) mais o nome por extenso. Usar em vez de
 * recriar pills/bars coloridas ad-hoc por página.
 */
export default function BeltBadge({ faixa, grau, size = 'sm', className = '' }: BeltBadgeProps) {
  const cfg = beltConfig[faixa] || { bg: '#888', text: '#fff', label: faixa };
  return (
    <span className={['inline-flex gap-2 items-center shrink-0', className].join(' ')}>
      <BeltBar belt={faixa as Belt} degrees={grau} size={size} />
      <span
        className="overflow-hidden text-[11px] font-semibold whitespace-nowrap text-ellipsis text-secondary"
        style={{ width: LABEL_WIDTH[size] }}
      >
        {cfg.label}{grau > 0 ? ` · G${grau}` : ''}
      </span>
    </span>
  );
}
