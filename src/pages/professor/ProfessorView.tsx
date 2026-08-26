import { useState } from 'react';
import { useAlunos } from '../../lib/useData';
import {
  useMinhasAulasQuery,
  useMinhasAulasDadasQuery,
  useTurmasDoProfessorQuery,
  useAlunosDasAulasQuery,
  useAlunosDaTurmaQuery,
  useIniciarAulaMutation,
  useConcluirAulaMutation,
  type AulaComContagem,
} from '../../hooks/useAulas';
import { useAuth } from '../../lib/auth';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Ico, type HeroIcon, UsersIcon, PlayCircleIcon, CheckIcon, MartialArtsIcon, CircleIcon, MapPinIcon, ClockIcon, ArrowRightIcon } from '../../lib/icons';

const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

const STATUS_BADGE: Record<AulaComContagem['status'], { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  em_curso:  { color: 'success', label: 'Em curso' },
  concluida: { color: 'neutral', label: 'Concluída' },
  agendada:  { color: 'warning', label: 'Agendada' },
};

// Frequência recente da turma (últimos 60 dias) — substitui a antiga
// "inscrição" estática, que nunca refletiu quem realmente aparece.
function TurmaAlunosCount({ turmaId }: { turmaId: string }) {
  const { data: alunos = [] } = useAlunosDaTurmaQuery(turmaId);
  return <>{alunos.length} alunos</>;
}

// ─── Card informativo — "Minhas Turmas" (todas, não só as de hoje) ──
function TurmaInfoCard({ t }: { t: { id: string; nome: string; horario: string; diaSemana: string[]; sala: string; capacidade: number } }) {
  return (
    <Card padding="lg">
      <div className="mb-1 text-[13px] font-bold text-primary">{t.nome}</div>
      <div className="inline-flex gap-1.5 items-center mb-1 text-[11.5px] text-muted"><Ico icon={ClockIcon} sm />{t.horario} · {t.diaSemana.join(', ')}</div>
      <div className="inline-flex gap-1.5 items-center text-[11px] text-muted">
        <Ico icon={MapPinIcon} sm />{t.sala} · <TurmaAlunosCount turmaId={t.id} /> · cap. {t.capacidade}
      </div>
    </Card>
  );
}

export default function ProfessorView({ onNavigate }: { onNavigate?: (page: string, param?: string) => void }) {
  const { user } = useAuth();
  const { data: turmas = [] } = useTurmasDoProfessorQuery(user?.id);
  const { data: alunos } = useAlunos();
  const { data: alunosDasAulas = [] } = useAlunosDasAulasQuery(user?.id);
  const { data: minhasAulas = [], refetch: refetchAulas } = useMinhasAulasQuery(user?.id);
  const { data: aulasDadas = [] } = useMinhasAulasDadasQuery(user?.id);
  const iniciarAulaMutation = useIniciarAulaMutation();
  const concluirAulaMutation = useConcluirAulaMutation();
  const [tab, setTab] = useState<'turmas'|'darAula'>('turmas');
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);

  const nome = user?.nome || 'Professor';
  const candidatosGraduacao = alunos.filter(a => a.status === 'ativo' && a.frequencia >= 70);

  const hoje = new Date().toISOString().split('T')[0];
  // getDay(): 0=Domingo..6=Sábado → índice em DAYS_FULL (0=Segunda..5=Sábado).
  // Domingo (6) fica fora do array de propósito — a academia não dá aulas.
  const diaSemanaHoje = DAYS_FULL[(new Date().getDay() + 6) % 7];
  const turmasHoje = turmas.filter(t => t.diaSemana.includes(diaSemanaHoje));
  const checkinAtivo = minhasAulas.find(a => a.status === 'em_curso');

  const handleCheckin = async (turmaId: string) => {
    setCheckinLoading(turmaId);
    try {
      await iniciarAulaMutation.mutateAsync({ turmaId, data: hoje });
      refetchAulas();
    } finally {
      setCheckinLoading(null);
    }
  };

  const handleConcluir = async (aulaId: string) => {
    setCheckinLoading(aulaId);
    try {
      await concluirAulaMutation.mutateAsync(aulaId);
      refetchAulas();
    } finally {
      setCheckinLoading(null);
    }
  };

  // O professor está sempre ligado a um conjunto de turmas — "Minhas
  // Turmas" é por isso a vista principal (controlo de quais dá, não só
  // as de hoje). "Dar Aula" fica só com a ação diária (iniciar/concluir).
  // Histórico completo de aulas dadas vive na página dedicada
  // ("Minhas Aulas" na sidebar) — aqui mostramos só uma pré-visualização.
  const TABS: { id: string; icon: HeroIcon; label: string }[] = [
    { id: 'turmas',  icon: UsersIcon,       label: 'Minhas Turmas' },
    { id: 'darAula', icon: PlayCircleIcon,  label: 'Dar Aula'      },
  ];

  return (
    <div>
      {/* Profile header — no financial data */}
      <div className="flex flex-wrap gap-3 justify-between items-center py-4 px-4.5 mb-5 rounded-lg border border-border md:py-5.5 md:px-6">
        <div>
          <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Painel do Professor</div>
          <h1 className="m-0 font-display text-[22px] font-extrabold uppercase text-primary">
            Bem-vindo, {nome.split(' ')[0]}!
          </h1>
          <p className="inline-flex gap-1.5 items-center m-0 mt-1 text-[13px] text-muted">
            Gracie Barra Braga · {turmas.length} turmas · OSS! <Ico icon={MartialArtsIcon} sm />
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex justify-center items-center w-14 h-14 font-display text-2xl font-extrabold text-gb-red rounded-full border-2 shrink-0 border-gb-red/30 bg-gb-red/10">
            {nome.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-bold text-primary">{nome}</div>
            <div className="mt-px text-[11px] text-muted">Faixa Preta · Gracie Barra</div>
            <div className="inline-flex gap-1 items-center mt-px text-[11px] font-semibold text-gb-green"><Ico icon={CircleIcon} className="w-2 h-2" />Ativo</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-0.5 mb-[18px] border-b border-border [scrollbar-width:none]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={[
              'flex gap-1.5 items-center py-2.5 px-2.5 -mb-px min-h-11 sm:min-h-0 text-xs whitespace-nowrap shrink-0 bg-none border-none border-b-2 cursor-pointer transition-colors duration-200 md:px-3.5 md:text-[13px]',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
              tab === t.id ? 'font-bold border-gb-red text-primary' : 'font-normal border-transparent text-muted hover:text-primary active:text-primary',
            ].join(' ')}>
            <Ico icon={t.icon} sm /> {t.label}
          </button>
        ))}
      </div>

      {/* ── MINHAS TURMAS — controlo de a que turmas o professor está ligado ── */}
      {tab === 'turmas' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-[18px] md:grid-cols-4">
            {[
              { label: 'Minhas Turmas',        value: turmas.length },
              { label: 'Alunos nas Minhas Aulas', value: alunosDasAulas.length },
              { label: 'Aulas Dadas',           value: aulasDadas.length },
              { label: 'Candidatos Grad.',      value: candidatosGraduacao.length },
            ].map(s => (
              <div key={s.label} className="py-3.5 px-4 rounded-md border border-border bg-card">
                <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
                <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">As Minhas Turmas</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 mb-6">
            {turmas.length === 0 ? (
              <div className="py-6 text-[13px] text-center text-muted col-span-full">Ainda não tens turmas atribuídas.</div>
            ) : turmas.map(t => <TurmaInfoCard key={t.id} t={t} />)}
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            {/* Belt distribution — só alunos que passaram por aulas deste professor */}
            <Card padding="lg">
              <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
              {alunosDasAulas.length === 0 ? (
                <div className="py-4 text-[13px] text-center text-muted">Ainda sem presenças nas tuas aulas.</div>
              ) : (Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][]).map(([faixa, cfg]) => {
                const count = alunosDasAulas.filter(a => a.faixa === faixa).length;
                if (!count) return null;
                return (
                  <div key={faixa} className="flex gap-2 items-center mb-2">
                    <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: cfg.bg, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                    <span className="w-12 text-[11.5px] capitalize text-secondary">{cfg.label}</span>
                    <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                      <div className="h-full" style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, width: `${(count / alunosDasAulas.length) * 100}%` }}/>
                    </div>
                    <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
                  </div>
                );
              })}
            </Card>

            {/* Aulas recentes — atalho para a página dedicada */}
            <Card padding="lg">
              <div className="flex justify-between items-center mb-3.5">
                <div className="text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Aulas Recentes</div>
                {checkinAtivo && <Badge color="success"><Ico icon={CircleIcon} className="w-2 h-2" />Em curso</Badge>}
              </div>
              {aulasDadas.length === 0 ? (
                <div className="py-4 text-[13px] text-center text-muted">Ainda não deste nenhuma aula.</div>
              ) : (
                <div className="flex flex-col gap-1.5 mb-3">
                  {aulasDadas.slice(0, 5).map(a => (
                    <button key={a.id} onClick={() => onNavigate?.('aula-detalhe', a.id)}
                      className="flex justify-between items-center py-2 px-2.5 w-full text-left rounded-sm cursor-pointer transition-colors duration-200 outline-none hover:bg-elevated active:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset"
                    >
                      <div className="min-w-0">
                        <div className="overflow-hidden text-[12.5px] font-semibold whitespace-nowrap text-ellipsis text-primary">{a.turmaNome}</div>
                        <div className="text-[10.5px] text-muted">{a.data}</div>
                      </div>
                      <Badge color={STATUS_BADGE[a.status].color}>{STATUS_BADGE[a.status].label}</Badge>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="secondary" fullWidth size="sm" onClick={() => onNavigate?.('aulas')}>
                Ver todas as aulas <Ico icon={ArrowRightIcon} sm />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ── DAR AULA (check-in do professor) ── */}
      {tab === 'darAula' && (
        <div>
          {checkinAtivo && (
            <div className="flex flex-wrap gap-3 justify-between items-center py-3.5 px-[18px] mb-[18px] rounded-md border-[1.5px] border-gb-green/30 bg-gb-green/[0.08]">
              <div className="flex gap-2.5 items-center">
                <span className="inline-block w-2.5 h-2.5 bg-gb-green rounded-full shrink-0"/>
                <div>
                  <div className="text-[13px] font-bold text-gb-green">Aula em curso: {checkinAtivo.turmaNome}</div>
                  <div className="mt-px text-[11.5px] text-muted">Início: {checkinAtivo.horaInicio} · {checkinAtivo.data}</div>
                </div>
              </div>
              <button
                onClick={() => handleConcluir(checkinAtivo.id)}
                disabled={checkinLoading === checkinAtivo.id}
                className={[
                  'py-2 px-4 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none bg-gb-green transition-all duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-green focus-visible:ring-offset-2',
                  checkinLoading === checkinAtivo.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100 hover:bg-gb-green-dark active:scale-[0.98]',
                ].join(' ')}
              >
                {checkinLoading === checkinAtivo.id ? 'A concluir...' : 'Concluir aula'}
              </button>
            </div>
          )}

          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Aulas de Hoje ({diaSemanaHoje})</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-6">
            {turmasHoje.length === 0 && (
              <div className="py-6 text-[13px] text-center text-muted col-span-full">Não tens turmas agendadas para hoje.</div>
            )}
            {turmasHoje.map(t => {
              const aulaHoje = minhasAulas.find(a => a.turmaId === t.id && a.data === hoje);
              const estaAtiva = aulaHoje?.status === 'em_curso';
              const jaConcluida = aulaHoje?.status === 'concluida';
              return (
                <Card key={t.id} padding="lg" className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="mb-1 text-[13px] font-bold text-primary">{t.nome}</div>
                    <div className="mb-2.5 text-[11.5px] text-muted">{t.horario} · {t.diaSemana.join(', ')}</div>
                    <div className="inline-flex gap-1.5 items-center mb-3.5 text-[11px] text-muted">
                      <Ico icon={MapPinIcon} sm />{t.sala} · <TurmaAlunosCount turmaId={t.id} />
                    </div>
                  </div>
                  {estaAtiva ? (
                    <Badge color="success"><Ico icon={CircleIcon} className="w-2 h-2" />Em curso</Badge>
                  ) : jaConcluida ? (
                    <Badge color="neutral"><Ico icon={CheckIcon} sm />Concluída hoje</Badge>
                  ) : (
                    <Button
                      variant="primary" fullWidth size="sm"
                      disabled={!!checkinLoading || !!checkinAtivo}
                      onClick={() => handleCheckin(t.id)}
                    >
                      {checkinLoading === t.id ? 'A registar...' : 'Iniciar aula'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
