import { CheckIcon, Ico, InformationCircleIcon, ClockIcon, MapPinIcon, UsersIcon } from '@/lib/icons';
import { useEffect, useRef, useState } from 'react';
import { useAlunos, usePresencas, useTurmas } from '../../lib/useData';
import { useAulasParticularesDoAlunoQuery } from '../../hooks/useAulasParticulares';

import PortalPageHeader from './PortalPageHeader';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SkeletonList } from '../../components/common/Skeleton';
import CalendarioPresencas from '../../components/features/CalendarioPresencas';
import { TurmasCalendarView, TurmasLegend } from '../../components/features/TurmasHorario';

/** Botão "i" com explicação do cálculo da frequência, ao toque/clique. */
function InfoFrequencia() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [aberto]);

  return (
    <div
      ref={ref}
      className="inline-block relative"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Como é calculada a frequência"
        className="flex justify-center items-center p-0.5 -m-0.5 text-muted bg-transparent rounded-full border-none outline-none cursor-pointer hover:text-primary focus-visible:ring-2 focus-visible:ring-gb-red"
      >
        <Ico icon={InformationCircleIcon} sm />
      </button>
      {aberto && (
        <div className="overflow-hidden absolute right-0 top-full z-[300] mt-2 w-[min(260px,80vw)] p-3 text-left rounded-lg border normal-case border-border bg-card">
          <p className="text-[11.5px] leading-[1.5] text-secondary">
            % de dias, desde a tua matrícula (ou nos últimos 3 meses, o que for
            mais curto), em que a academia teve treinos e tu fizeste pelo menos
            um check-in. Cada dia conta uma vez, mesmo com mais de um treino.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MinhasAulas() {
  const { data: alunos } = useAlunos();
  const { user } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const { data: presencas } = usePresencas(aluno?.id, 400);
  const { data: particulares = [] } = useAulasParticularesDoAlunoQuery(aluno?.id, user?.id);
  const { data: turmas = [] } = useTurmas();
  if (!aluno) return <SkeletonList rows={4} />;

  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);
  const hoje = new Date();
  const aulasEsteMes = minhasPresencas.filter((p) => {
    const d = new Date(p.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  return (
    <div>
      <PortalPageHeader
        title="Minhas Aulas"
        description="Consulta as aulas que frequentas."
      />

      {turmas.length > 0 && (
        <Card padding="lg" className="mb-4">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Horário Semanal
          </div>
          <TurmasLegend turmas={turmas} />
          <TurmasCalendarView turmas={turmas} />
        </Card>
      )}

      <Card padding="lg" className="mb-4">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Presenças no último ano
        </div>
        <CalendarioPresencas presencas={minhasPresencas} />
      </Card>

      {particulares.length > 0 && (
        <Card padding="lg" className="mb-4">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Aulas Particulares
          </div>
          <div className="flex flex-col gap-2">
            {particulares.map(p => (
              <div key={p.id} className="py-2.5 px-3 rounded-sm bg-elevated">
                <div className="flex flex-wrap gap-2 justify-between items-start">
                  <div className="inline-flex gap-1.5 items-center text-[12.5px] font-semibold text-primary">
                    <Ico icon={ClockIcon} sm />{p.data} · {p.horaInicio}
                    {p.sala && <><span className="text-muted">·</span><Ico icon={MapPinIcon} sm />{p.sala}</>}
                  </div>
                  <Badge color={p.status === 'concluida' ? 'success' : p.status === 'cancelada' ? 'neutral' : 'warning'}>
                    {p.status === 'concluida' ? 'Concluída' : p.status === 'cancelada' ? 'Cancelada' : 'Agendada'}
                  </Badge>
                </div>
                <div className="inline-flex gap-1.5 items-center mt-1 text-[11px] text-muted">
                  <Ico icon={UsersIcon} sm />com {p.professorNome}
                  {p.ajudanteNome && ` · ajudante: ${p.ajudanteNome}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance history */}
      <Card padding="lg">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Histórico de Presenças
          </div>
          <div className="flex justify-between mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gb-red">
                {aulasEsteMes}
              </div>
              <div className="text-[10.5px] text-muted">
                aulas este mês
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gb-green">
                {aluno.frequencia}%
              </div>
              <div className="inline-flex gap-1 items-center text-[10.5px] text-muted">
                frequência
                <InfoFrequencia />
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
  );
}
