/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useTurmas, useAlunos, db } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import { Ico, type HeroIcon, ArrowLeftIcon, PlusIcon, CheckIcon, ClockIcon, MapPinIcon, CalendarIcon, Bars3Icon } from '../../lib/icons';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIAS_LABEL: Record<string, string> = {
  segunda: 'SEG', terça: 'TER', quarta: 'QUA',
  quinta:  'QUI', sexta: 'SEX', sábado: 'SÁB', domingo: 'DOM',
};
const DIAS_ORDER = ['segunda','terça','quarta','quinta','sexta','sábado'];
const TIPOS = ['gi','nogi','wrestling','kids'];
const NIVEIS = ['all','iniciante','intermediario','avancado','kids'];
const DIAS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

// ─── Nova Turma Modal ─────────────────────────────────────────────────────────
function NovaTurmaModal({ onClose, onSave }: { onClose: ()=>void; onSave: ()=>void }) {
  const [nome,       setNome]       = useState('');
  const [professor,  setProfessor]  = useState('');
  const [horario,    setHorario]    = useState('');
  const [dias,       setDias]       = useState<string[]>([]);
  const [sala,       setSala]       = useState('');
  const [capacidade, setCapacidade] = useState(20);
  const [tipo,       setTipo]       = useState('gi');
  const [nivel,      setNivel]      = useState('all');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const toggleDia = (d: string) =>
    setDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!nome || !horario) return;
    setSaving(true);
    try {
      await db.criarTurma({ nome, professorNome: professor, horario, diasSemana: dias, sala, capacidade, nivel, tipo });
      setSaved(true);
      setTimeout(() => { onSave(); onClose(); }, 1000);
    } catch (e) {
      console.error('Erro ao criar turma:', e);
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Nova Turma" maxWidth={560}>
      <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
        <div className="col-span-full">
          <label className={LABEL_CLASS}>Nome da Turma *</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="ex: GB 1 - Adultos" className={FIELD_CLASS}/>
        </div>
        <div><label className={LABEL_CLASS}>Professor</label><input value={professor} onChange={e=>setProfessor(e.target.value)} placeholder="Nome do professor" className={FIELD_CLASS}/></div>
        <div><label className={LABEL_CLASS}>Horário *</label><input value={horario} onChange={e=>setHorario(e.target.value)} placeholder="18:30" className={FIELD_CLASS}/></div>
        <div><label className={LABEL_CLASS}>Sala</label><input value={sala} onChange={e=>setSala(e.target.value)} placeholder="Tatame 1" className={FIELD_CLASS}/></div>
        <div><label className={LABEL_CLASS}>Capacidade</label><input type="number" value={capacidade} onChange={e=>setCapacidade(parseInt(e.target.value)||20)} className={FIELD_CLASS}/></div>
        <div><label className={LABEL_CLASS}>Tipo</label><select value={tipo} onChange={e=>setTipo(e.target.value)} className={[FIELD_CLASS, 'cursor-pointer'].join(' ')}>{TIPOS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
        <div><label className={LABEL_CLASS}>Nível</label><select value={nivel} onChange={e=>setNivel(e.target.value)} className={[FIELD_CLASS, 'cursor-pointer'].join(' ')}>{NIVEIS.map(n=><option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div className="mb-4">
        <label className={LABEL_CLASS}>Dias da Semana</label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS_FULL.map(d=>(
            <button key={d} onClick={()=>toggleDia(d)}
              className={[
                'py-1.5 px-3 min-h-11 sm:min-h-0 text-[12.5px] rounded-md border cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                dias.includes(d) ? 'text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'text-secondary bg-elevated border-border hover:bg-border-subtle active:bg-border-subtle',
              ].join(' ')}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary" className={['flex-[2]', saved ? '!bg-green-500' : ''].join(' ')}
          disabled={!nome || !horario || saving} loading={saving}
          onClick={handleSave}
        >
          {saved ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Turma criada!</span> : saving ? 'A guardar...' : '+ Criar Turma'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Turma Detail ─────────────────────────────────────────────────────────────
function TurmaDetail({ turma, onBack }: { turma: any; onBack: ()=>void }) {
  const { data: alunos } = useAlunos();
  const inscritos = alunos.filter((a: any) => a.turmaId === turma.id || a.plano?.includes(turma.nome));
  const cor = (turma as any).cor || GB.red;

  return (
    <div>
      <button onClick={onBack} className="flex gap-1.5 items-center mb-4 py-2 min-h-11 sm:min-h-0 text-[13px] bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
        <Ico icon={ArrowLeftIcon} sm /> Voltar ao calendário
      </button>
      <Card padding="lg" className="mb-4">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className="mb-1.5 text-lg font-bold text-primary">{turma.nome}</h2>
            <div className="flex flex-wrap gap-2">
              <span
                className="py-0.5 px-2 text-[11px] font-bold rounded-full border"
                style={{ background: `${cor}18`, color: cor, borderColor: `${cor}44` }}
              >
                {turma.tipo?.toUpperCase()}
              </span>
              <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={ClockIcon} sm />{turma.horario}</span>
              {turma.sala && <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={MapPinIcon} sm />{turma.sala}</span>}
            </div>
            <div className="mt-1.5 text-xs text-muted">
              {Array.isArray(turma.diaSemana)
                ? turma.diaSemana.map((d: string) => DIAS_LABEL[d] || d).join(' · ')
                : turma.diaSemana}
            </div>
          </div>
          <div className="py-3 px-[18px] text-right rounded-sm bg-elevated">
            <div className="text-2xl font-extrabold text-primary">{inscritos.length}/{turma.capacidade}</div>
            <div className="text-[11px] text-muted">alunos inscritos</div>
            <div className="mt-1.5 w-20 h-1 rounded bg-border">
              <div className="h-full rounded" style={{ width: `${Math.min(100, Math.round((inscritos.length/turma.capacidade)*100))}%`, background: cor }}/>
            </div>
          </div>
        </div>
      </Card>
      <Card padding="lg">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Alunos inscritos</div>
        {inscritos.length === 0 ? (
          <div className="p-5 text-[13px] text-center text-muted">Nenhum aluno inscrito nesta turma</div>
        ) : inscritos.map((a: any) => (
          <div key={a.id} className="flex justify-between py-2 border-b border-border-subtle">
            <span className="text-[13px] text-primary">{a.nome}</span>
            <span className="text-xs text-muted">{a.faixa} · grau {a.grau}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ turmas, onSelect, filtroTipo }: {
  turmas: any[];
  onSelect: (t: any) => void;
  filtroTipo: string;
}) {
  const { isMobile } = useMobile();
  const [diaAtivo, setDiaAtivo] = useState(DIAS_ORDER[0]);

  const filtered = filtroTipo === 'all' ? turmas : turmas.filter((t: any) => t.tipo === filtroTipo);

  // Build schedule map: { dia: { horario: turma[] } }
  const schedule = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const dia of DIAS_ORDER) map[dia] = {};
    for (const t of filtered) {
      const dias = Array.isArray(t.diaSemana) ? t.diaSemana : [];
      for (const dia of dias) {
        const key = dia.toLowerCase();
        if (!map[key]) map[key] = {};
        if (!map[key][t.horario]) map[key][t.horario] = [];
        map[key][t.horario].push(t);
      }
    }
    return map;
  }, [filtered]);

  // Sorted unique time slots
  const times = useMemo(() => {
    const all = new Set<string>();
    for (const t of filtered) all.add(t.horario);
    return [...all].sort();
  }, [filtered]);

  // ── Turma block ──────────────────────────────────────────────────────────────
  const TurmaBlock = ({ t }: { t: any }) => {
    const cor = t.cor || GB.red;
    return (
      <button
        onClick={() => onSelect(t)}
        className="p-1.5 mb-1 w-full min-w-0 text-left rounded cursor-pointer transition-opacity duration-200 hover:opacity-80 active:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-1"
        style={{ background: `${cor}18`, border: `1.5px solid ${cor}` }}
      >
        <div
          className={['overflow-hidden font-extrabold leading-tight whitespace-nowrap text-ellipsis', isMobile ? 'text-[10.5px]' : 'text-[11px]'].join(' ')}
          style={{ color: cor }}
        >
          {t.nome}
        </div>
        {t.sala && (
          <div className="mt-0.5 text-[9.5px] text-muted">{t.sala}</div>
        )}
      </button>
    );
  };

  // ── MOBILE: day tabs + vertical list ────────────────────────────────────────
  if (isMobile) {
    const diasComAulas = DIAS_ORDER.filter(d => Object.keys(schedule[d] || {}).length > 0);
    return (
      <div>
        {/* Day tabs */}
        <div className="flex overflow-x-auto gap-0 mb-3.5 border-b border-border [scrollbar-width:none]">
          {diasComAulas.map(d => (
            <button key={d} onClick={() => setDiaAtivo(d)}
              className={[
                'flex-none py-2 px-3.5 min-h-11 bg-none border-none border-b-2 text-[12.5px] cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                diaAtivo === d ? 'font-bold border-gb-red text-gb-red' : 'font-normal border-transparent text-muted hover:text-primary active:text-primary',
              ].join(' ')}>
              {DIAS_LABEL[d]}
            </button>
          ))}
        </div>

        {/* Time slots for selected day */}
        <div>
          {times.map(hora => {
            const aulas = schedule[diaAtivo]?.[hora] ?? [];
            if (aulas.length === 0) return null;
            return (
              <div key={hora} className="flex gap-3 items-start mb-2">
                <div className="pt-1.5 min-w-9 text-xs font-bold text-muted">{hora}</div>
                <div className="flex-1">
                  {aulas.map((t: any) => <TurmaBlock key={t.id} t={t} />)}
                </div>
              </div>
            );
          })}
          {times.every(h => !schedule[diaAtivo]?.[h]?.length) && (
            <div className="py-8 text-[13px] text-center text-muted">
              Sem aulas neste dia
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP: full week grid ──────────────────────────────────────────────────
  const dias = DIAS_ORDER.filter(d => Object.keys(schedule[d] || {}).length > 0);
  const COL_W = 148;
  const TIME_W = 52;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div style={{ minWidth: TIME_W + dias.length * COL_W }}>

        {/* Header row */}
        <div className="flex border-b border-border bg-elevated">
          <div style={{ width: TIME_W }} className="shrink-0 py-2.5 px-2 border-r border-border" />
          {dias.map(d => (
            <div key={d} style={{ width: COL_W }} className="shrink-0 py-2.5 px-2 text-xs font-extrabold tracking-[0.5px] text-center border-r border-border text-primary">
              {DIAS_LABEL[d]}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {times.map((hora, idx) => (
          <div key={hora} className={['flex border-b border-border-subtle', idx % 2 === 0 ? 'bg-card' : 'bg-base'].join(' ')}>
            {/* Time label */}
            <div style={{ width: TIME_W }} className="shrink-0 py-2.5 px-2 text-xs font-bold leading-tight text-center border-r border-border text-muted">
              {hora}
            </div>

            {/* Day cells */}
            {dias.map(d => {
              const aulas = schedule[d]?.[hora] ?? [];
              return (
                <div
                  key={d}
                  style={{ width: COL_W, minHeight: aulas.length ? 'auto' : 36 }}
                  className="p-1.5 shrink-0 border-r border-border-subtle"
                >
                  {aulas.map((t: any) => <TurmaBlock key={t.id} t={t} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ turmas }: { turmas: any[] }) {
  const unique = useMemo(() => {
    const seen = new Map<string, any>();
    for (const t of turmas) {
      // Group by name prefix (GB 1, GB 2, GB F, GB K, etc.)
      const prefix = t.nome.replace(/\s*[([-].*/, '').trim();
      if (!seen.has(prefix)) seen.set(prefix, t);
    }
    return [...seen.entries()];
  }, [turmas]);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {unique.map(([label, t]) => (
        <div
          key={label}
          className="flex gap-1.5 items-center py-1 px-2.5 rounded-full border bg-elevated"
          style={{ borderColor: `${(t as any).cor || 'var(--border)'}44` }}
        >
          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: (t as any).cor || '#888' }}/>
          <span className="text-[11.5px] font-semibold text-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TurmasPage() {
  const { data: turmas, refetch } = useTurmas();
  const [showNova,   setShowNova]   = useState(false);
  const [selected,   setSelected]   = useState<any | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [view,       setView]       = useState<'calendar' | 'list'>('calendar');
  const { data: alunos } = useAlunos();

  if (selected) return <TurmaDetail turma={selected} onBack={() => setSelected(null)} />;

  const filtered = filtroTipo === 'all' ? turmas : turmas.filter((t: any) => t.tipo === filtroTipo);

  return (
    <div>
      {showNova && <NovaTurmaModal onClose={() => setShowNova(false)} onSave={() => { setShowNova(false); refetch(); }} />}

      <PageHeader
        eyebrow="Academia"
        title="Horário de Turmas"
        actions={<>
          {/* View toggle */}
          <div className="flex overflow-hidden rounded-sm border border-border bg-elevated">
            {([['calendar', CalendarIcon],['list', Bars3Icon]] as [string, HeroIcon][]).map(([v, icon]) => (
              <button key={v} onClick={() => setView(v as any)}
                className={[
                  'py-2 px-3.5 min-h-11 sm:min-h-0 text-sm border-none cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
                  view===v ? 'text-white bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'bg-transparent text-muted hover:bg-border-subtle active:bg-border-subtle',
                ].join(' ')}>
                <Ico icon={icon} sm />
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => setShowNova(true)}>
            <Ico icon={PlusIcon} sm /> Nova Turma
          </Button>
        </>}
      />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {[['all','Todas'],['gi','GI'],['nogi','NO GI'],['kids','Kids']].map(([t, l]) => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            className={[
              'py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              filtroTipo===t ? 'font-bold text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'font-normal text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            {l}
          </button>
        ))}
        <span className="self-center ml-1 text-xs text-muted">
          {filtered.length} turma{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Legend */}
      <Legend turmas={filtered} />

      {/* Calendar view */}
      {view === 'calendar' && (
        <CalendarView turmas={filtered} onSelect={setSelected} filtroTipo={filtroTipo} />
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((turma: any) => {
            const inscritos = alunos.filter((a: any) => a.turmaId === turma.id).length || turma.inscritos || 0;
            const pct = Math.round((inscritos / (turma.capacidade || 20)) * 100);
            const cor = turma.cor || GB.red;
            return (
              <button key={turma.id} onClick={() => setSelected(turma)}
                className="p-[18px] w-full text-left rounded-lg border cursor-pointer transition-shadow duration-200 border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${cor}33`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div className="flex gap-2 justify-between mb-2">
                  <div className="text-[13px] font-bold leading-tight text-primary">{turma.nome}</div>
                  <span
                    className="py-0.5 px-1.5 text-[10px] font-bold rounded-full shrink-0"
                    style={{ background: `${cor}20`, color: cor }}
                  >
                    {turma.tipo?.toUpperCase()}
                  </span>
                </div>
                <div className="inline-flex gap-1.5 items-center mb-1 text-[11.5px] text-muted">
                  <Ico icon={ClockIcon} sm />{turma.horario} &nbsp;·&nbsp;
                  {Array.isArray(turma.diaSemana)
                    ? turma.diaSemana.map((d: string) => DIAS_LABEL[d] || d).join(' ')
                    : turma.diaSemana}
                </div>
                {turma.sala && <div className="inline-flex gap-1.5 items-center mb-2 text-xs text-muted"><Ico icon={MapPinIcon} sm />{turma.sala}</div>}
                <div className="flex justify-between mb-1.5 text-xs text-muted">
                  <span>{inscritos}/{turma.capacidade} alunos</span>
                  <span className={pct >= 90 ? 'font-bold text-gb-red' : 'font-normal'}>{pct}%</span>
                </div>
                <div className="h-[3px] rounded bg-border">
                  <div className="h-full rounded transition-[width] duration-300" style={{ width: `${Math.min(100,pct)}%`, background: cor }}/>
                </div>
              </button>
            );
          })}
          <button onClick={() => setShowNova(true)}
            className="flex flex-col gap-2 justify-center items-center p-5 min-h-[130px] rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-200 border-border bg-elevated hover:border-gb-red active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <span className="text-3xl text-muted">+</span>
            <span className="text-[13px] text-muted">Nova Turma</span>
          </button>
        </div>
      )}
    </div>
  );
}
