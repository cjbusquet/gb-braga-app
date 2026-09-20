import { useRankingFrequenciaQuery } from '../hooks/useAnalytics';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import BeltBadge from '../components/common/BeltBadge';
import { SkeletonList } from '../components/common/Skeleton';
import { Ico, TrophyIcon } from '../lib/icons';

const MEDALHA = ['#D4AF37', '#A8A8A8', '#B08D57'];

/** Ranking de frequência — in-app, qualquer utilizador autenticado (ranking_frequencia() RPC). */
export default function RankingPage() {
  const { data: ranking = [], isLoading } = useRankingFrequenciaQuery();

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Rank de Frequência" subtitle="Os alunos com mais treinos nos últimos meses" />

      {isLoading ? (
        <SkeletonList rows={8} />
      ) : ranking.length === 0 ? (
        <div className="py-16 text-[13px] text-center text-muted">Ainda sem dados de frequência.</div>
      ) : (
        <Card padding="none">
          {ranking.map((r, i) => (
            <div key={`${r.nome}-${i}`}
              className={[
                'flex gap-3 items-center py-3 px-4',
                i > 0 ? 'border-t border-border-subtle' : '',
              ].join(' ')}
            >
              <div className="flex justify-center items-center w-7 text-[13px] font-extrabold shrink-0 text-muted">
                {i < 3 ? <Ico icon={TrophyIcon} style={{ color: MEDALHA[i] }} /> : `${i + 1}º`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="overflow-hidden text-[13px] font-semibold whitespace-nowrap text-ellipsis text-primary">{r.nome}</div>
                <BeltBadge faixa={r.faixa} grau={0} size="sm" />
              </div>
              <div className="text-right shrink-0">
                <div className="text-[15px] font-extrabold tabular-nums text-gb-red">{r.treinos}</div>
                <div className="text-[10px] text-muted">{r.treinos === 1 ? 'treino' : 'treinos'}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
