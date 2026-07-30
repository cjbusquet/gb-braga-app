import { useState } from 'react';
import { useTurmas, useAlunos, usePresencas, useGraduacoes, useProfessorCheckins, db } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Ico, type HeroIcon, Squares2X2Icon, PlayCircleIcon, CalendarDaysIcon, UsersIcon, CheckIcon, MedalIcon, MartialArtsIcon, CircleIcon, MapPinIcon, ArrowRightIcon } from '../../lib/icons';

const DAYS_ABR = ['Seg','Ter','Qua','Qui','Sex','Sáb'];
const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

const TH_CLASS = 'py-2.5 px-3.5 text-[10.5px] font-semibold tracking-[0.5px] text-left uppercase text-muted';
const TD_CLASS = 'py-2.5 px-3.5';

export default function ProfessorView() {
  const { data: turmas } = useTurmas();
  const { data: alunos } = useAlunos();
  const { data: presencas } = usePresencas();
  const { data: graduacoes } = useGraduacoes();
  const { user } = useAuth();
  const { data: meuCheckins, refetch: refetchCheckins } = useProfessorCheckins(user?.id);
  const [tab, setTab] = useState<'overview'|'classes'|'students'|'attendance'|'graduation'|'darAula'>('overview');
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);

  const nome = user?.nome || 'Professor';
  const allAlunos = alunos.filter(a => a.status === 'ativo');
  const allPresencas = presencas;
  const candidatosGraduacao = allAlunos.filter(a => a.frequencia >= 70);

  const hoje = new Date().toISOString().split('T')[0];
  const checkinAtivo = meuCheckins.find(c => c.status === 'ativa');

  const handleCheckin = async (turmaId: string, turmaNome: string) => {
    setCheckinLoading(turmaId);
    try {
      await db.registarProfessorCheckin({ professorId: user?.id || '', professorNome: user?.nome || '', turmaId, turmaNome });
      refetchCheckins();
    } finally {
      setCheckinLoading(null);
    }
  };

  const handleConcluir = async (id: string) => {
    setCheckinLoading(id);
    try {
      await db.concluirCheckinProfessor(id);
      refetchCheckins();
    } finally {
      setCheckinLoading(null);
    }
  };

  const TABS: { id: string; icon: HeroIcon; label: string }[] = [
    { id: 'overview',    icon: Squares2X2Icon,  label: 'Visão Geral' },
    { id: 'darAula',     icon: PlayCircleIcon,  label: 'Dar Aula'     },
    { id: 'classes',     icon: CalendarDaysIcon,label: 'Turmas'       },
    { id: 'students',    icon: UsersIcon,       label: 'Alunos'       },
    { id: 'attendance',  icon: CheckIcon,       label: 'Presenças'    },
    { id: 'graduation',  icon: MedalIcon,       label: 'Graduação'    },
  ];

  return (
    <div>
      {/* Profile header — no financial data */}
      <div
        className="flex flex-wrap gap-3 justify-between items-center py-4 px-[18px] mb-5 rounded-lg border shadow-xs border-border md:py-[22px] md:px-6"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,0.06) 0%, transparent 60%)' }}
      >
        <div>
          <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Painel do Professor</div>
          <h1 className="m-0 font-display text-[22px] font-extrabold uppercase text-primary">
            Bem-vindo, {nome.split(' ')[0]}!
          </h1>
          <p className="inline-flex gap-1.5 items-center m-0 mt-1 text-[13px] text-muted">
            Gracie Barra Braga · {allAlunos.length} alunos · {turmas.length} turmas · OSS! <Ico icon={MartialArtsIcon} sm />
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex justify-center items-center w-14 h-14 font-display text-2xl font-extrabold text-gb-red rounded-full border-2 shrink-0 border-gb-red/30 bg-gb-red/10">
            {nome.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-bold text-primary">{nome}</div>
            <div className="mt-px text-[11px] text-muted">Faixa Preta · Gracie Barra</div>
            <div className="inline-flex gap-1 items-center mt-px text-[11px] font-semibold text-green-600"><Ico icon={CircleIcon} className="w-2 h-2" />Ativo</div>
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

      {/* ── DAR AULA (check-in do professor) ── */}
      {tab === 'darAula' && (
        <div>
          {checkinAtivo && (
            <div className="flex flex-wrap gap-3 justify-between items-center py-3.5 px-[18px] mb-[18px] rounded-md border-[1.5px] border-green-600/30 bg-green-600/[0.08]">
              <div className="flex gap-2.5 items-center">
                <span className="inline-block w-2.5 h-2.5 bg-green-600 rounded-full shrink-0"/>
                <div>
                  <div className="text-[13px] font-bold text-green-600">Aula em curso: {checkinAtivo.turmaNome}</div>
                  <div className="mt-px text-[11.5px] text-muted">Início: {checkinAtivo.horaInicio} · {checkinAtivo.data}</div>
                </div>
              </div>
              <button
                onClick={() => handleConcluir(checkinAtivo.id)}
                disabled={checkinLoading === checkinAtivo.id}
                className={[
                  'py-2 px-4 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none bg-green-600 transition-all duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
                  checkinLoading === checkinAtivo.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100 hover:bg-green-700 active:scale-[0.98]',
                ].join(' ')}
              >
                {checkinLoading === checkinAtivo.id ? 'A concluir...' : 'Concluir aula'}
              </button>
            </div>
          )}

          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Minhas Turmas — Hoje</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 mb-6">
            {turmas.map(t => {
              const jaFezCheckin = meuCheckins.some(c => c.turmaId === t.id && c.data === hoje);
              const estaAtiva = checkinAtivo?.turmaId === t.id;
              return (
                <Card key={t.id} padding="lg">
                  <div className="mb-1 text-[13px] font-bold text-primary">{t.nome}</div>
                  <div className="mb-2.5 text-[11.5px] text-muted">{t.horario} · {t.diaSemana.join(', ')}</div>
                  <div className="inline-flex gap-1.5 items-center mb-3.5 text-[11px] text-muted"><Ico icon={MapPinIcon} sm />{t.sala} · {t.inscritos} alunos</div>
                  {estaAtiva ? (
                    <Badge color="success"><Ico icon={CircleIcon} className="w-2 h-2" />Em curso</Badge>
                  ) : jaFezCheckin ? (
                    <Badge color="neutral"><Ico icon={CheckIcon} sm />Concluída hoje</Badge>
                  ) : (
                    <button
                      onClick={() => handleCheckin(t.id, t.nome)}
                      disabled={!!checkinLoading || !!checkinAtivo}
                      className={[
                        'py-1.5 px-3.5 w-full min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none bg-gb-red transition-all duration-200',
                        'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                        (checkinLoading || checkinAtivo) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100 hover:bg-gb-red-dark active:scale-[0.98]',
                      ].join(' ')}
                    >
                      {checkinLoading === t.id ? 'A registar...' : 'Iniciar aula'}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Histórico de Check-ins</div>
          <Card padding="none">
            {meuCheckins.length === 0 ? (
              <div className="p-6 text-[13px] text-center text-muted">Nenhum check-in registado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-elevated">
                    {['Turma','Data','Início','Fim','Estado'].map(h => (
                      <th key={h} className={TH_CLASS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meuCheckins.map(c => (
                    <tr key={c.id} className="border-b border-border-subtle">
                      <td className={[TD_CLASS, 'text-[13px] font-semibold text-primary'].join(' ')}>{c.turmaNome}</td>
                      <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{c.data}</td>
                      <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{c.horaInicio}</td>
                      <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{c.horaFim || '—'}</td>
                      <td className={TD_CLASS}>
                        {c.status === 'ativa'
                          ? <Badge color="success"><Ico icon={CircleIcon} className="w-2 h-2" />Ativa</Badge>
                          : <Badge color="neutral">Concluída</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── OVERVIEW — NO FINANCIAL DATA ── */}
      {tab === 'overview' && (
        <div>
          {/* KPIs — only non-financial */}
          <div className="grid grid-cols-2 gap-3 mb-[18px] md:grid-cols-4">
            {[
              { label: 'Minhas Turmas',     value: turmas.length,           accent: 'var(--gb-red)' },
              { label: 'Alunos Ativos',     value: allAlunos.length,            accent: '#2563EB' },
              { label: 'Check-ins (mês)',   value: allPresencas.length,         accent: '#16A34A' },
              { label: 'Candidatos Grad.', value: candidatosGraduacao.length,  accent: '#7C3AED' },
            ].map(s => (
              <div key={s.label} className="py-3.5 px-4 rounded-md border shadow-xs border-border bg-card">
                <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
                <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            {/* Weekly schedule */}
            <Card padding="lg">
              <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Horário Semanal</div>
              <div className="grid grid-cols-6 gap-1.5">
                {DAYS_ABR.map((d, i) => {
                  const dayTurmas = turmas.filter(t => t.diaSemana.includes(DAYS_FULL[i]));
                  return (
                    <div key={d} className="text-center">
                      <div className={['mb-1 text-[10.5px] font-semibold', dayTurmas.length ? 'text-primary' : 'text-muted'].join(' ')}>{d}</div>
                      {dayTurmas.length > 0 ? dayTurmas.map((t, ti) => (
                        <div key={ti} className="py-0.5 px-1 mb-1 rounded border border-gb-red/[0.18] bg-gb-red/[0.07]">
                          <div className="text-[8.5px] font-bold leading-tight text-gb-red">{t.horario.split('-')[0]}</div>
                        </div>
                      )) : (
                        <div className="py-0.5 px-1 rounded opacity-40 bg-elevated">
                          <div className="text-[9px] text-muted">—</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Belt distribution */}
            <Card padding="lg">
              <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
              {(Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][]).map(([faixa, cfg]) => {
                const count = allAlunos.filter(a => a.faixa === faixa).length;
                if (!count) return null;
                return (
                  <div key={faixa} className="flex gap-2 items-center mb-2">
                    <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: cfg.bg, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                    <span className="w-12 text-[11.5px] capitalize text-secondary">{cfg.label}</span>
                    <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                      <div className="h-full" style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, width: `${(count / allAlunos.length) * 100}%` }}/>
                    </div>
                    <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Recent check-ins */}
          <Card padding="lg">
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Últimas Presenças</div>
              <Badge color="success"><Ico icon={CircleIcon} className="w-2 h-2" />AO VIVO</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {allPresencas.slice(0, 9).map(p => (
                <div key={p.id} className="flex gap-2 items-center py-2 px-2.5 rounded-sm bg-elevated">
                  <div className="flex justify-center items-center w-6 h-6 text-[10px] font-bold text-green-600 rounded-full border shrink-0 border-green-600/20 bg-green-600/10"><Ico icon={CheckIcon} className="w-3 h-3" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="overflow-hidden text-xs font-medium whitespace-nowrap text-ellipsis text-primary">{p.alunoNome}</div>
                    <div className="text-[10.5px] text-muted">{p.hora}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── CLASSES ── */}
      {tab === 'classes' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {turmas.map(t => {
            const ocupacao = Math.round((t.inscritos / t.capacidade) * 100);
            return (
              <Card key={t.id} padding="lg">
                <div className="mb-1 text-sm font-bold text-primary">{t.nome}</div>
                <div className="inline-flex gap-1.5 items-center mb-3.5 text-[11.5px] text-muted"><Ico icon={MapPinIcon} sm />{t.sala}</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="py-2 px-2.5 rounded-sm bg-elevated">
                    <div className="mb-0.5 text-[9.5px] text-muted">HORÁRIO</div>
                    <div className="font-mono text-xs font-bold text-primary">{t.horario}</div>
                  </div>
                  <div className="py-2 px-2.5 rounded-sm bg-elevated">
                    <div className="mb-0.5 text-[9.5px] text-muted">ALUNOS</div>
                    <div className="text-xs font-bold text-primary">{t.inscritos}/{t.capacidade}</div>
                  </div>
                </div>
                <div className="mb-2 text-[11px] text-muted">{t.diaSemana.join(' · ')}</div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10.5px] text-muted">Ocupação</span>
                    <span className={['text-[10.5px] font-bold', ocupacao >= 90 ? 'text-red-500' : 'text-green-600'].join(' ')}>{ocupacao}%</span>
                  </div>
                  <div className="overflow-hidden h-[5px] rounded-full bg-elevated">
                    <div className={['h-full', ocupacao >= 90 ? 'bg-red-500' : 'bg-green-600'].join(' ')} style={{ width: `${ocupacao}%` }}/>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── STUDENTS ── */}
      {tab === 'students' && (
        <Card padding="none">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-elevated">
                {['Aluno', 'Faixa / Grau', 'Frequência', 'Estado', 'Grad. Possível'].map(h => (
                  <th key={h} className={TH_CLASS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAlunos.map(a => {
                const bc = beltConfig[a.faixa];
                const podeGraduar = a.frequencia >= 70 && a.grau < 4;
                return (
                  <tr key={a.id} className="border-b border-border-subtle hover:bg-elevated">
                    <td className={[TD_CLASS, 'py-2.5'].join(' ')}>
                      <div className="flex gap-2 items-center">
                        <div className="flex justify-center items-center w-8 h-8 text-xs font-bold rounded-full shrink-0" style={{ background: (bc?.bg || '#888') + '20', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || 'var(--gb-red)') }}>{a.nome.charAt(0)}</div>
                        <div>
                          <div className="text-[13px] font-semibold text-primary">{a.nome}</div>
                          <div className="text-[11px] text-muted">{a.dataMatricula}</div>
                        </div>
                      </div>
                    </td>
                    <td className={TD_CLASS}>
                      <div className="flex gap-1.5 items-center">
                        <div className="w-5 h-[7px] rounded-sm" style={{ background: bc?.bg || '#888', border: a.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                        <span className="text-xs capitalize text-secondary">{bc?.label} · {a.grau}° grau</span>
                      </div>
                    </td>
                    <td className={TD_CLASS}>
                      <div className="flex gap-2 items-center">
                        <div className="overflow-hidden w-[60px] h-[5px] rounded-full bg-elevated">
                          <div className={['h-full', a.frequencia >= 80 ? 'bg-green-600' : a.frequencia >= 60 ? 'bg-amber-600' : 'bg-gb-red'].join(' ')} style={{ width: `${a.frequencia}%` }}/>
                        </div>
                        <span className={['text-xs font-bold', a.frequencia >= 80 ? 'text-green-600' : a.frequencia >= 60 ? 'text-amber-600' : 'text-gb-red'].join(' ')}>{a.frequencia}%</span>
                      </div>
                    </td>
                    <td className={TD_CLASS}>
                      <Badge color={a.status === 'ativo' ? 'success' : 'danger'}>{a.status}</Badge>
                    </td>
                    <td className={TD_CLASS}>
                      {podeGraduar
                        ? <Badge color="brand"><Ico icon={CheckIcon} sm />Elegível</Badge>
                        : <span className="text-[11px] text-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {/* ── ATTENDANCE ── */}
      {tab === 'attendance' && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total este mês',    value: allPresencas.length },
              { label: 'Média por aula',    value: Math.round(allPresencas.length / 5) || 12 },
              { label: 'Taxa de presença',  value: '78%' },
            ].map(s => (
              <div key={s.label} className="py-3.5 px-4 rounded-md border shadow-xs border-border bg-card">
                <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
                <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              </div>
            ))}
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-elevated">
                  {['Aluno', 'Turma', 'Data', 'Hora', 'Método'].map(h => (
                    <th key={h} className={TH_CLASS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPresencas.map(p => (
                  <tr key={p.id} className="border-b border-border-subtle hover:bg-elevated">
                    <td className={[TD_CLASS, 'text-[13px] font-semibold text-primary'].join(' ')}>{p.alunoNome}</td>
                    <td className={[TD_CLASS, 'text-xs text-secondary'].join(' ')}>{p.turmaNome}</td>
                    <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{p.data}</td>
                    <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{p.hora}</td>
                    <td className={TD_CLASS}>
                      <span className="py-0.5 px-1.5 text-[10.5px] font-semibold rounded bg-elevated text-secondary">{p.metodo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── GRADUATION ── */}
      {tab === 'graduation' && (
        <div>
          <div className="flex gap-2.5 items-center py-3 px-4 mb-4 rounded-md border border-violet-600/20 bg-violet-600/[0.06]">
            <span className="text-violet-600"><Ico icon={MedalIcon} lg /></span>
            <div>
              <div className="text-[13px] font-bold text-violet-600">Próxima Cerimónia de Graduação</div>
              <div className="text-xs text-muted">{candidatosGraduacao.length} alunos elegíveis (frequência ≥ 70%)</div>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {candidatosGraduacao.map(a => {
              const bc = beltConfig[a.faixa];
              const belts = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];
              const nextFaixa = a.grau >= 4 ? (belts[belts.indexOf(a.faixa)+1] || a.faixa) : a.faixa;
              const nextGrau = a.grau >= 4 ? 1 : a.grau + 1;
              const nextBc = beltConfig[nextFaixa];
              return (
                <Card key={a.id} padding="lg">
                  <div className="flex gap-2.5 items-center mb-3">
                    <div className="flex justify-center items-center w-9 h-9 text-sm font-bold rounded-full shrink-0" style={{ background: (bc?.bg || '#888') + '20', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || 'var(--gb-red)') }}>{a.nome.charAt(0)}</div>
                    <div>
                      <div className="text-[13px] font-semibold text-primary">{a.nome}</div>
                      <div className="text-[11px] text-muted">Frequência: {a.frequencia}%</div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-center py-2.5 px-3 mb-3 rounded-sm bg-elevated">
                    <div className="flex-1 text-center">
                      <div className="mb-1 text-[9px] tracking-[1px] uppercase text-muted">ATUAL</div>
                      <div className="mx-auto w-7 h-2 rounded-sm" style={{ background: bc?.bg || '#888', border: a.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                      <div className="mt-1 text-[10px] capitalize text-muted">{bc?.label} G{a.grau}</div>
                    </div>
                    <span className="text-sm text-muted"><Ico icon={ArrowRightIcon} sm /></span>
                    <div className="flex-1 text-center">
                      <div className="mb-1 text-[9px] tracking-[1px] text-green-600 uppercase">PRÓXIMA</div>
                      <div className="mx-auto w-7 h-2 rounded-sm" style={{ background: nextBc?.bg || '#888', border: nextFaixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                      <div className="mt-1 text-[10px] font-semibold capitalize text-green-600">{nextBc?.label} G{nextGrau}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Graduation history */}
          <div className="mt-5">
            <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Histórico de Graduações</div>
            <Card padding="none">
              <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-elevated">
                    {['Aluno', 'De', 'Para', 'Data', 'Observação'].map(h => (
                      <th key={h} className={TH_CLASS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graduacoes.map(g => {
                    const bcA = beltConfig[g.faixaAnterior];
                    const bcN = beltConfig[g.faixaNova];
                    return (
                      <tr key={g.id} className="border-b border-border-subtle">
                        <td className={[TD_CLASS, 'text-[13px] font-semibold text-primary'].join(' ')}>{g.alunoNome}</td>
                        <td className={TD_CLASS}>
                          <div className="flex gap-1.5 items-center">
                            <div className="w-4 h-1.5 rounded-sm" style={{ background: bcA?.bg || '#888', border: g.faixaAnterior === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                            <span className="text-[11px] capitalize text-muted">{bcA?.label} G{g.grauAnterior}</span>
                          </div>
                        </td>
                        <td className={TD_CLASS}>
                          <div className="flex gap-1.5 items-center">
                            <div className="w-4 h-1.5 rounded-sm" style={{ background: bcN?.bg || '#888', border: g.faixaNova === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                            <span className="text-[11px] font-semibold capitalize text-green-600">{bcN?.label} G{g.grauNovo}</span>
                          </div>
                        </td>
                        <td className={[TD_CLASS, 'font-mono text-xs text-muted'].join(' ')}>{g.data}</td>
                        <td className={[TD_CLASS, 'text-[11px] italic text-muted'].join(' ')}>{g.observacao || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
