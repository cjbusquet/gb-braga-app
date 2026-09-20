import { useMinhasAulasDadasQuery, type AulaComContagem } from '../../hooks/useAulas';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { Ico, ClockIcon, MapPinIcon, UsersIcon, ArrowPathIcon, CircleIcon } from '../../lib/icons';

const STATUS_BADGE: Record<AulaComContagem['status'], { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  em_curso:  { color: 'success', label: 'Em curso' },
  concluida: { color: 'neutral', label: 'Concluída' },
  agendada:  { color: 'warning', label: 'Agendada' },
};

function formatarDia(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const label = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Página "Minhas Aulas" (professor) — lista cronológica das aulas dadas ──
export default function MinhasAulasPage({ onNavigate }: { onNavigate?: (page: string, param?: string) => void }) {
  const { user } = useAuth();
  const { data: aulas = [], isLoading } = useMinhasAulasDadasQuery(user?.id);

  // Já vem ordenado por data desc (mais recente primeiro) — só agrupamos
  // visualmente linhas consecutivas do mesmo dia sob um único cabeçalho.
  const grupos: { data: string; aulas: AulaComContagem[] }[] = [];
  for (const a of aulas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === a.data) ultimo.aulas.push(a);
    else grupos.push({ data: a.data, aulas: [a] });
  }

  return (
    <div>
      <PageHeader eyebrow="Professor" title="Minhas Aulas" subtitle="Aulas que efetivamente deste, mais recente primeiro" />

      {isLoading ? (
        <div className="flex justify-center items-center py-16 text-muted"><Ico icon={ArrowPathIcon} /></div>
      ) : aulas.length === 0 ? (
        <div className="py-16 text-[13px] text-center text-muted">Ainda não deste nenhuma aula.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map(g => (
            <div key={g.data}>
              <div className="mb-2 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">{formatarDia(g.data)}</div>
              <Card padding="none">
                {g.aulas.map((a, i) => (
                  <button key={a.id} onClick={() => onNavigate?.('aula-detalhe', a.id)}
                    className={[
                      'flex flex-wrap gap-3 justify-between items-center py-3.5 px-[18px] w-full text-left cursor-pointer transition-colors duration-200 outline-none',
                      'hover:bg-elevated active:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
                      i > 0 ? 'border-t border-border-subtle' : '',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-primary">{a.turmaNome}</div>
                      <div className="inline-flex gap-1.5 items-center mt-0.5 text-[11.5px] text-muted">
                        <Ico icon={ClockIcon} sm />{a.horario || '-'}
                        {a.sala && <><span>·</span><Ico icon={MapPinIcon} sm />{a.sala}</>}
                      </div>
                    </div>
                    <div className="flex gap-3 items-center shrink-0">
                      <span className="inline-flex gap-1.5 items-center text-[12.5px] font-semibold text-secondary">
                        <Ico icon={UsersIcon} sm />{a.presentesCount}
                      </span>
                      <Badge color={STATUS_BADGE[a.status].color}>
                        {a.status === 'em_curso' && <Ico icon={CircleIcon} className="w-2 h-2" />}
                        {STATUS_BADGE[a.status].label}
                      </Badge>
                    </div>
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
