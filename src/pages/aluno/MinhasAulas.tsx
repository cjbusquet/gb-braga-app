import { CheckIcon, Ico, MapPinIcon } from '@/lib/icons';
import { useAlunos, usePresencas } from '../../lib/useData';
import { useTurmasDoAlunoQuery } from '../../hooks/useAulas';

import PortalPageHeader from './PortalPageHeader';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SkeletonList } from '../../components/common/Skeleton';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DIAS_FULL = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

export default function MinhasAulas() {
  const { data: presencas } = usePresencas();
  const { data: alunos } = useAlunos();
  const { user } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const { data: minhasTurmas = [] } = useTurmasDoAlunoQuery(aluno?.id);
  if (!aluno) return <SkeletonList rows={4} />;

  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);

  return (
    <div>
      <PortalPageHeader
        title="Minhas Aulas"
        description="Consulta o teu horário e as aulas que frequentas."
      />

      {/* Weekly schedule */}
      <Card padding="lg" className="mb-4">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Horário Semanal
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DIAS.map((d, i) => {
            const full = DIAS_FULL[i];
            const aulas = minhasTurmas.filter((t) =>
              t.diaSemana.includes(full),
            );
            return (
              <div key={d} className="text-center">
                <div className="mb-1.5 text-[11px] font-semibold text-muted">
                  {d}
                </div>
                {aulas.length > 0 ? (
                  aulas.map((a) => (
                    <div
                      key={a.id}
                      className="py-1.5 px-1 mb-1 rounded-sm border border-gb-red/25 bg-gb-red/10"
                    >
                      <div className="text-[10.5px] font-bold text-gb-red">
                        {a.horario.split('-')[0]}
                      </div>
                      <div className="mt-0.5 text-[9.5px] text-secondary">
                        {a.nome.split(' ')[0]}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-1.5 px-1 rounded-sm opacity-40 bg-elevated">
                    <div className="text-[10px] text-muted">
                      —
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* My classes */}
        <div className="flex flex-col order-2 gap-3 md:order-1">
          {minhasTurmas.map((t) => (
            <Card key={t.id} padding="none" className="p-[18px]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-bold text-primary">
                    {t.nome}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    Prof. {t.professorNome}
                  </div>
                </div>
                <Badge color="success">ATIVA</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="py-2 px-2.5 rounded-sm bg-elevated">
                  <div className="mb-0.5 text-[10px] text-muted">
                    Horário
                  </div>
                  <div className="font-mono text-[13px] font-bold text-primary">
                    {t.horario}
                  </div>
                </div>
                <div className="py-2 px-2.5 rounded-sm bg-elevated">
                  <div className="mb-0.5 text-[10px] text-muted">
                    Dias
                  </div>
                  <div className="text-[11px] font-semibold text-primary">
                    {t.diaSemana.join(' · ')}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 text-[11px] text-muted">
                <span className="inline-flex gap-1 items-center"><Ico icon={MapPinIcon} sm />{t.sala}</span>
              </div>
            </Card>
          ))}
        </div>
        {/* Attendance history */}
        <Card padding="lg" className="order-1 md:order-2">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Histórico de Presenças
          </div>
          <div className="flex justify-between mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gb-red">
                {minhasPresencas.length}
              </div>
              <div className="text-[10.5px] text-muted">
                aulas este mês
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gb-green">
                {aluno.frequencia}%
              </div>
              <div className="text-[10.5px] text-muted">
                frequência
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gb-red">
                12
              </div>
              <div className="text-[10.5px] text-muted">
                meta mensal
              </div>
            </div>
          </div>
          <div className="overflow-hidden mb-4 h-2 rounded-full bg-elevated">
            <div
              className={['h-full', aluno.frequencia >= 80 ? 'bg-gb-green' : 'bg-gb-red'].join(' ')}
              style={{ width: `${Math.min(aluno.frequencia, 100)}%` }}
            />
          </div>
          {minhasPresencas.length > 0 ? (
            minhasPresencas.map((p) => (
              <div
                key={p.id}
                className="flex gap-2.5 items-center py-2 border-b border-border-subtle"
              >
                <div className="flex justify-center items-center w-[26px] h-[26px] text-[8px] text-gb-green rounded-full border shrink-0 border-gb-green/20 bg-gb-green/10">
                  <Ico icon={CheckIcon} />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-primary">
                    {p.turmaNome || 'Treino livre'}
                  </div>
                  <div className="text-[10.5px] text-muted">
                    {p.data} · {p.hora}
                  </div>
                </div>
                <span className="py-0.5 px-1.5 font-mono text-[10px] rounded bg-elevated text-muted">
                  {p.metodo}
                </span>
              </div>
            ))
          ) : (
            <p className="mt-5 text-[13px] text-center text-muted">
              Sem presenças registadas
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
