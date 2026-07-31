import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';

export type BeltBarSize = 'sm' | 'md' | 'lg';

interface BeltBarProps {
  belt: Belt;
  degrees: number;
  size?: BeltBarSize;
  className?: string;
}

const HEIGHT: Record<BeltBarSize, number> = { sm: 14, md: 18, lg: 24 };
const WIDTH: Record<BeltBarSize, number> = { sm: 64, md: 88, lg: 120 };

/**
 * Faixa de BJJ desenhada como barra horizontal: corpo na cor da faixa +
 * ponteira (preta, ou vermelha na faixa preta para haver contraste) com as
 * listras/graus (0-4) marcadas a branco.
 */
export default function BeltBar({ belt, degrees, size = 'md', className = '' }: BeltBarProps) {
  const cfg = beltConfig[belt] || { bg: '#888', text: '#fff', label: belt };
  const height = HEIGHT[size];
  const width = WIDTH[size];
  const tipColor = belt === 'preta' ? '#7A0E1F' : '#111111';
  const grausVisiveis = Math.max(0, Math.min(4, degrees));

  return (
    <div
      role="img"
      aria-label={`Faixa ${cfg.label}, grau ${grausVisiveis}`}
      className={['inline-flex overflow-hidden shrink-0 border border-black/10', className].join(` `)}
      style={{ width, height }}
    >
      <div className="flex-1 h-full" style={{ background: cfg.bg, border: belt === 'branca' ? '1px solid #d8d6d2' : 'none' }} />
      <div
        className="flex gap-[3px] sm:gap-[2px] justify-center items-center h-full shrink-0"
        style={{ width: Math.round(width * 0.28), background: tipColor }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 2,
              height: height,
              background: i < grausVisiveis ? '#ffffff' : 'rgba(255,255,255,0.18)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
