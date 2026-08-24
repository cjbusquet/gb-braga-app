import { useAulaQuery, useAulaStatsQuery } from '../../hooks/useAulas';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import BeltBadge from '../../components/common/BeltBadge';
import { Ico, ArrowLeftIcon, ClockIcon, MapPinIcon, ArrowPathIcon } from '../../lib/icons';

const STATUS_BADGE: Record<'agendada' | 'em_curso' | 'concluida', { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  em_curso:  { color: 'success', label: 'Em curso' },
  concluida: { color: 'neutral', label: 'Concluída' },
  agendada:  { color: 'warning', label: 'Agendada' },
};

// ─── Detalhe de uma aula — página própria, chegada via deep-link (onNavigate('aula-detalhe', aulaId)) ──
export default function AulaDetalhePage({ aulaId, onNavigate }: { aulaId?: string; onNavigate?: (page: string) => void }) {
  const { data: aula, isLoading: aulaLoading } = useAulaQuery(aulaId);
  const { data: presentes = [], isLoading: presentesLoading } = useAulaStatsQuery(aulaId);

  const voltar = () => onNavigate?.('aulas');

  if (aulaLoading) {
    return (
      <div className="flex justify-center items-center py-16 text-muted">
        <Ico icon={ArrowPathIcon} />
      </div>
    );
  }

  if (!aula) {
    return (
      <div>
        <button onClick={voltar} className="flex gap-1.5 items-center mb-4 py-2 min-h-11 sm:min-h-0 text-[13px] bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
          <Ico icon={ArrowLeftIcon} sm /> Voltar a Minhas Aulas
        </button>
        <div className="py-10 text-[13px] text-center text-muted">Aula não encontrada.</div>
      </div>
    );
  }

  const porFaixa = (Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][])
    .map(([faixa, cfg]) => ({ faixa, cfg, count: presentes.filter(p => p.faixa === faixa).length }))
    .filter(f => f.count > 0);

  return (
    <div>
      <button onClick={voltar} className="flex gap-1.5 items-center mb-4 py-2 min-h-11 sm:min-h-0 text-[13px] bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
        <Ico icon={ArrowLeftIcon} sm /> Voltar a Minhas Aulas
      </button>

      <Card padding="lg" className="mb-4">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className="mb-1.5 text-lg font-bold text-primary">{aula.turmaNome}</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge color={STATUS_BADGE[aula.status].color}>{STATUS_BADGE[aula.status].label}</Badge>
              <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={ClockIcon} sm />{aula.horario || '—'}</span>
              {aula.sala && <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={MapPinIcon} sm />{aula.sala}</span>}
            </div>
            <div className="mt-1.5 text-xs text-muted">{aula.data}</div>
          </div>
          <div className="py-3 px-[18px] text-right rounded-sm bg-elevated">
            <div className="text-2xl font-extrabold text-primary">{presentes.length}</div>
            <div className="text-[11px] text-muted">presentes</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
        <Card padding="lg">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
          {presentesLoading ? (
            <div className="py-4 text-[13px] text-center text-muted">A carregar...</div>
          ) : porFaixa.length === 0 ? (
            <div className="py-4 text-[13px] text-center text-muted">Sem presenças registadas nesta aula.</div>
          ) : porFaixa.map(({ faixa, cfg, count }) => (
            <div key={faixa} className="flex gap-2 items-center mb-2">
              <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: cfg.bg, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
              <span className="w-12 text-[11.5px] capitalize text-secondary">{cfg.label}</span>
              <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                <div className="h-full" style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, width: `${(count / presentes.length) * 100}%` }}/>
              </div>
              <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
            </div>
          ))}
        </Card>

        <Card padding="lg">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Presentes</div>
          {presentesLoading ? (
            <div className="py-4 text-[13px] text-center text-muted">A carregar...</div>
          ) : presentes.length === 0 ? (
            <div className="py-4 text-[13px] text-center text-muted">Ninguém fez check-in nesta aula.</div>
          ) : presentes.map(p => (
            <div key={p.alunoId} className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-[13px] text-primary">{p.nome}</span>
              <BeltBadge faixa={p.faixa as Belt} grau={p.grau} size="sm" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
