import { useAuth } from '../../lib/auth';
import { useAulasResumoQuery } from '../../hooks/useAulas';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import { Ico, TrophyIcon } from '../../lib/icons';

const GENERO_LABEL: Record<string, string> = { feminino: 'Feminino', masculino: 'Masculino', outro: 'Outro' };
const GENERO_COR: Record<string, string> = { feminino: '#DB2777', masculino: '#2563EB', outro: '#9333EA' };

// ─── Página "Resumo" (professor) — estatísticas agregadas de todas as aulas dadas ──
export default function ResumoAulasPage() {
  const { user } = useAuth();
  const { data: resumo } = useAulasResumoQuery(user?.id);

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
      <PageHeader eyebrow="Professor" title="Resumo" subtitle="Estatísticas agregadas das tuas aulas dadas" />

      {!resumo || resumo.totalAulas === 0 ? (
        <div className="py-16 text-[13px] text-center text-muted">Ainda não há dados suficientes para um resumo.</div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-[18px] md:grid-cols-4">
            {[
              { label: 'Aulas Dadas',        value: resumo.totalAulas },
              { label: 'Total Check-ins',    value: resumo.totalCheckins },
              { label: 'Média Pessoas/Aula', value: resumo.mediaPessoas },
              { label: 'Turma Mais Frequente', value: resumo.turmaMaisFrequente?.nome ?? '-', small: true },
            ].map(s => (
              <div key={s.label} className="py-3.5 px-4 rounded-xl border border-border bg-card">
                <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
                <div className={s.small ? 'text-[13px] font-bold leading-tight text-primary' : 'text-2xl font-extrabold text-primary'}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card padding="lg">
              <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
              <div className="mb-2 text-[11px] text-muted">Ponderada por check-in: quem vem mais, pesa mais.</div>
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
            <div className="flex gap-2.5 items-center py-3 px-4 mt-4 rounded-xl border-[1.5px] border-gb-red/20 bg-gb-red/[0.05]">
              <Ico icon={TrophyIcon} className="text-gb-red" />
              <div className="text-[13px] text-secondary">
                A tua turma mais frequente é <strong className="text-primary">{resumo.turmaMaisFrequente.nome}</strong>, com {resumo.turmaMaisFrequente.count} aulas dadas.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
