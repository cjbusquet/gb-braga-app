import { useAlunosAbaixoMetaQuery, useAlunosProximosGraduacaoQuery } from '../../hooks/useAnalytics';
import BeltBadge from '../../components/common/BeltBadge';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { SkeletonList } from '../../components/common/Skeleton';
import { Ico, ExclamationTriangleIcon, TrophyIcon } from '../../lib/icons';

/**
 * Dashboards de leitura direta (pull) — sem cron nem push. Cada secção
 * é só um SELECT a uma view (v_alunos_abaixo_meta /
 * v_alunos_proximos_graduacao), refrescado ao entrar na página.
 */
export default function AlertasPage() {
  const { data: abaixoMeta = [], isLoading: loadingMeta } = useAlunosAbaixoMetaQuery();
  const { data: proximosGrad = [], isLoading: loadingGrad } = useAlunosProximosGraduacaoQuery();

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Alertas" subtitle="Frequência abaixo da meta e alunos perto da próxima graduação" />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex gap-3 items-center py-3.5 px-4 rounded-xl border border-border bg-card">
          <div className="flex justify-center items-center w-9 h-9 rounded-full shrink-0 text-amber-500 bg-amber-500/10">
            <Ico icon={ExclamationTriangleIcon} />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-none text-primary">{abaixoMeta.length}</div>
            <div className="mt-1 text-[10.5px] text-muted">Abaixo da meta</div>
          </div>
        </div>
        <div className="flex gap-3 items-center py-3.5 px-4 rounded-xl border border-border bg-card">
          <div className="flex justify-center items-center w-9 h-9 rounded-full text-gb-green shrink-0 bg-gb-green/10">
            <Ico icon={TrophyIcon} />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold leading-none text-primary">{proximosGrad.length}</div>
            <div className="mt-1 text-[10.5px] text-muted">Perto de graduar</div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Abaixo da Meta</div>
      {loadingMeta ? <SkeletonList rows={4} /> : abaixoMeta.length === 0 ? (
        <div className="py-10 text-[13px] text-center text-muted">Todos os alunos ativos cumprem a meta de 2 dias/semana.</div>
      ) : (
        <Card padding="none" className="mb-6">
          {abaixoMeta.map((a, i) => (
            <div key={a.id} className={['flex flex-wrap gap-2 justify-between items-center py-3 px-4', i > 0 ? 'border-t border-border-subtle' : ''].join(' ')}>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-primary">{a.nome}</div>
                <BeltBadge faixa={a.faixa} grau={0} size="sm" />
              </div>
              <Badge color="warning">{a.diasUltimos7}/7 dias esta semana</Badge>
            </div>
          ))}
        </Card>
      )}

      <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Perto de Graduar</div>
      {loadingGrad ? <SkeletonList rows={4} /> : proximosGrad.length === 0 ? (
        <div className="py-10 text-[13px] text-center text-muted">Ninguém dentro do limiar configurado de momento.</div>
      ) : (
        <Card padding="none">
          {proximosGrad.map((a, i) => (
            <div key={a.id} className={['flex flex-wrap gap-2 justify-between items-center py-3 px-4', i > 0 ? 'border-t border-border-subtle' : ''].join(' ')}>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-primary">{a.nome}</div>
                <BeltBadge faixa={a.faixa} grau={a.grau} size="sm" />
              </div>
              <div className="text-right">
                <Badge color="success">{a.proximoEFaixa ? 'Próxima faixa' : 'Próximo grau'}</Badge>
                <div className="mt-1 text-[10.5px] text-muted">{a.mesesNoNivel} meses no nível · {a.frequencia}% freq.</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
