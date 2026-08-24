import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useMinhasAulasDadasQuery, useAulasResumoQuery, type AulaComContagem } from '../../hooks/useAulas';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { Ico, type HeroIcon, ClipboardDocumentCheckIcon, ChartBarIcon, ClockIcon, MapPinIcon, UsersIcon, ArrowPathIcon, CircleIcon, TrophyIcon } from '../../lib/icons';

const STATUS_BADGE: Record<AulaComContagem['status'], { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  em_curso:  { color: 'success', label: 'Em curso' },
  concluida: { color: 'neutral', label: 'Concluída' },
  agendada:  { color: 'warning', label: 'Agendada' },
};

const GENERO_LABEL: Record<string, string> = { feminino: 'Feminino', masculino: 'Masculino', outro: 'Outro' };
const GENERO_COR: Record<string, string> = { feminino: '#DB2777', masculino: '#2563EB', outro: '#9333EA' };

function formatarDia(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const label = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Página "Minhas Aulas" (professor) — lista cronológica + resumo estatístico ──
export default function MinhasAulasPage({ onNavigate }: { onNavigate?: (page: string, param?: string) => void }) {
  const { user } = useAuth();
  const { data: aulas = [], isLoading } = useMinhasAulasDadasQuery(user?.id);
  const { data: resumo } = useAulasResumoQuery(user?.id);
  const [tab, setTab] = useState<'lista' | 'resumo'>('lista');

  const TABS: { id: 'lista' | 'resumo'; icon: HeroIcon; label: string }[] = [
    { id: 'lista',  icon: ClipboardDocumentCheckIcon, label: 'Lista' },
    { id: 'resumo', icon: ChartBarIcon,                label: 'Resumo' },
  ];

  // Já vem ordenado por data desc (mais recente primeiro) — só agrupamos
  // visualmente linhas consecutivas do mesmo dia sob um único cabeçalho.
  const grupos: { data: string; aulas: AulaComContagem[] }[] = [];
  for (const a of aulas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === a.data) ultimo.aulas.push(a);
    else grupos.push({ data: a.data, aulas: [a] });
  }

  const faixaEntries = resumo
    ? (Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][])
        .map(([faixa, cfg]) => ({ faixa, cfg, count: resumo.faixaDistribuicao[faixa] ?? 0 }))
        .filter(f => f.count > 0)
    : [];
  const generoEntries = resumo
    ? Object.entries(resumo.generoDistribuicao).filter(([, c]) => c > 0)
    : [];

  return (
    <div>
      <PageHeader eyebrow="Professor" title="Minhas Aulas" subtitle="Aulas que efetivamente deste, mais recente primeiro" />

      <div className="flex overflow-x-auto gap-0.5 mb-[18px] border-b border-border [scrollbar-width:none]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={[
              'flex gap-1.5 items-center py-2.5 px-2.5 -mb-px min-h-11 sm:min-h-0 text-xs whitespace-nowrap shrink-0 bg-none border-none border-b-2 cursor-pointer transition-colors duration-200 md:px-3.5 md:text-[13px]',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
              tab === t.id ? 'font-bold border-gb-red text-primary' : 'font-normal border-transparent text-muted hover:text-primary active:text-primary',
            ].join(' ')}>
            <Ico icon={t.icon} sm /> {t.label}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      {tab === 'lista' && (
        isLoading ? (
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
                          <Ico icon={ClockIcon} sm />{a.horario || '—'}
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
        )
      )}

      {/* ── RESUMO ── */}
      {tab === 'resumo' && resumo && (
        resumo.totalAulas === 0 ? (
          <div className="py-16 text-[13px] text-center text-muted">Ainda não há dados suficientes para um resumo.</div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-[18px] md:grid-cols-4">
              {[
                { label: 'Aulas Dadas',        value: resumo.totalAulas },
                { label: 'Total Check-ins',    value: resumo.totalCheckins },
                { label: 'Média Pessoas/Aula', value: resumo.mediaPessoas },
                { label: 'Turma Mais Frequente', value: resumo.turmaMaisFrequente?.nome ?? '—', small: true },
              ].map(s => (
                <div key={s.label} className="py-3.5 px-4 rounded-md border border-border bg-card">
                  <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
                  <div className={s.small ? 'text-[13px] font-bold leading-tight text-primary' : 'text-2xl font-extrabold text-primary'}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card padding="lg">
                <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
                <div className="mb-2 text-[11px] text-muted">Ponderada por check-in — quem vem mais, pesa mais.</div>
                {faixaEntries.length === 0 ? (
                  <div className="py-4 text-[13px] text-center text-muted">Sem dados.</div>
                ) : faixaEntries.map(({ faixa, cfg, count }) => (
                  <div key={faixa} className="flex gap-2 items-center mb-2">
                    <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: cfg.bg, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                    <span className="w-12 text-[11.5px] capitalize text-secondary">{cfg.label}</span>
                    <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                      <div className="h-full" style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, width: `${(count / resumo.totalCheckins) * 100}%` }}/>
                    </div>
                    <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
                  </div>
                ))}
              </Card>

              <Card padding="lg">
                <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Género</div>
                <div className="mb-2 text-[11px] text-muted">Ponderada por check-in, tal como as faixas.</div>
                {generoEntries.length === 0 ? (
                  <div className="py-4 text-[13px] text-center text-muted">Sem dados de género registados ainda.</div>
                ) : generoEntries.map(([genero, count]) => (
                  <div key={genero} className="flex gap-2 items-center mb-2">
                    <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: GENERO_COR[genero] ?? '#888' }}/>
                    <span className="w-16 text-[11.5px] text-secondary">{GENERO_LABEL[genero] ?? genero}</span>
                    <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                      <div className="h-full" style={{ background: GENERO_COR[genero] ?? '#888', width: `${(count / resumo.totalCheckins) * 100}%` }}/>
                    </div>
                    <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
                  </div>
                ))}
              </Card>
            </div>

            {resumo.turmaMaisFrequente && (
              <div className="flex gap-2.5 items-center py-3 px-4 mt-4 rounded-md border-[1.5px] border-gb-red/20 bg-gb-red/[0.05]">
                <Ico icon={TrophyIcon} className="text-gb-red" />
                <div className="text-[13px] text-secondary">
                  A tua turma mais frequente é <strong className="text-primary">{resumo.turmaMaisFrequente.nome}</strong>, com {resumo.turmaMaisFrequente.count} aulas dadas.
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
