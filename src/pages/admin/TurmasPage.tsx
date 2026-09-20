/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useTurmas, useProfessores, db } from '../../lib/useData';
import { useAlunosDaTurmaQuery } from '../../hooks/useAulas';
import { useAuth } from '../../lib/auth';
import { GB } from '../../lib/gbBrand';
import { Ico, type HeroIcon, ArrowLeftIcon, PlusIcon, CheckIcon, ClockIcon, MapPinIcon, CalendarIcon, Bars3Icon, UserIcon, TrashIcon, ArrowPathIcon, PencilIcon } from '../../lib/icons';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import BeltBadge from '../../components/common/BeltBadge';
import { DIAS_LABEL, TurmasCalendarView, TurmasLegend } from '../../components/features/TurmasHorario';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIPOS = ['gi','nogi','wrestling','kids'];
const NIVEIS = ['all','iniciante','intermediario','avancado','kids'];
const DIAS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
// Paleta inspirada na ficha física de horários da academia — cada
// categoria de aula tem a sua cor no quadro semanal, em vez de tudo à
// cor de marca por omissão.
const CORES_TURMA = ['#1E3A5F', '#DC2626', '#DB2777', '#F97316', '#16A34A', '#7C3AED', '#64748B'];

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

// ─── Turma Modal (criar / editar) ──────────────────────────────────────────────
function TurmaModal({ turma, onClose, onSave }: { turma?: any; onClose: ()=>void; onSave: ()=>void }) {
  const isEdit = !!turma;
  const { data: professores = [] } = useProfessores();
  const [nome,       setNome]       = useState(turma?.nome || '');
  const [professorId, setProfessorId] = useState<string>(turma?.professorId || '');
  const [horario,    setHorario]    = useState(turma?.horario || '');
  const [dias,       setDias]       = useState<string[]>(turma?.diaSemana || []);
  const [sala,       setSala]       = useState(turma?.sala || '');
  const [capacidade, setCapacidade] = useState(turma?.capacidade || 20);
  const [tipo,       setTipo]       = useState(turma?.tipo || 'gi');
  const [nivel,      setNivel]      = useState(turma?.nivel || 'all');
  const [cor,        setCor]        = useState(turma?.cor || CORES_TURMA[0]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const toggleDia = (d: string) =>
    setDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async (close: () => void) => {
    if (!nome || !horario) return;
    setSaving(true);
    try {
      const professorNome = professores.find((p: any) => p.id === professorId)?.nome || '';
      const dados = { nome, professorId, professorNome, horario, diasSemana: dias, sala, capacidade, nivel, tipo, cor };
      if (isEdit) await db.atualizarTurma(turma.id, dados);
      else        await db.criarTurma(dados);
      setSaved(true);
      setTimeout(() => { onSave(); close(); }, 1000);
    } catch (e) {
      console.error('Erro ao guardar turma:', e);
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={isEdit ? 'Editar Turma' : 'Nova Turma'} maxWidth={560}>
      {close => (
        <>
          <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
            <div className="col-span-full">
              <label className={LABEL_CLASS}>Nome da Turma *</label>
              <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="ex: GB 1 - Adultos" className={FIELD_CLASS}/>
            </div>
            <div>
              <Select label="Professor titular" value={professorId} onChange={e=>setProfessorId(e.target.value)}>
                <option value="">Sem professor</option>
                {professores.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </Select>
            </div>
            <div><label className={LABEL_CLASS}>Horário *</label><input value={horario} onChange={e=>setHorario(e.target.value)} placeholder="18:30" className={FIELD_CLASS}/></div>
            <div><label className={LABEL_CLASS}>Sala</label><input value={sala} onChange={e=>setSala(e.target.value)} placeholder="Tatame 1" className={FIELD_CLASS}/></div>
            <div><label className={LABEL_CLASS}>Capacidade</label><input type="number" value={capacidade} onChange={e=>setCapacidade(parseInt(e.target.value)||20)} className={FIELD_CLASS}/></div>
            <div><Select label="Tipo" value={tipo} onChange={e=>setTipo(e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</Select></div>
            <div><Select label="Nível" value={nivel} onChange={e=>setNivel(e.target.value)}>{NIVEIS.map(n=><option key={n} value={n}>{n}</option>)}</Select></div>
          </div>
          <div className="mb-4">
            <label className={LABEL_CLASS}>Cor no Horário</label>
            <div className="flex flex-wrap gap-2">
              {CORES_TURMA.map(c => (
                <button key={c} type="button" onClick={() => setCor(c)} aria-label={`Cor ${c}`}
                  className={[
                    'w-8 h-8 rounded-full border-2 cursor-pointer transition-transform duration-150',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    cor === c ? 'scale-110 border-primary' : 'border-transparent hover:scale-105',
                  ].join(' ')}
                  style={{ background: c }}
                >
                  {cor === c && <Ico icon={CheckIcon} sm className="text-white" />}
                </button>
              ))}
            </div>
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
            <Button variant="secondary" className="flex-1" onClick={close}>Cancelar</Button>
            <Button
              variant="primary" className={['flex-[2]', saved ? '!bg-gb-green' : ''].join(' ')}
              disabled={!nome || !horario || saving} loading={saving}
              onClick={() => handleSave(close)}
            >
              {saved
                ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />{isEdit ? 'Turma atualizada!' : 'Turma criada!'}</span>
                : saving ? 'A guardar...' : isEdit ? 'Guardar Alterações' : '+ Criar Turma'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Turma Detail ─────────────────────────────────────────────────────────────
function TurmaDetail({ turma, onBack, podeGerir, onDeleted, onEdit }: { turma: any; onBack: ()=>void; podeGerir: boolean; onDeleted: ()=>void; onEdit: ()=>void }) {
  const { data: frequentam = [], isLoading: frequentamLoading } = useAlunosDaTurmaQuery(turma.id);
  const cor = (turma as any).cor || GB.red;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Apagar a turma "${turma.nome}"? As aulas associadas também são apagadas; as presenças de alunos são preservadas.`)) return;
    setDeleting(true);
    try {
      await db.apagarTurma(turma.id);
      onDeleted();
    } catch (e) {
      console.error('Erro ao apagar turma:', e);
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <button onClick={onBack} className="flex gap-1.5 items-center py-2 min-h-11 sm:min-h-0 text-[13px] bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
          <Ico icon={ArrowLeftIcon} sm /> Voltar ao calendário
        </button>
        {podeGerir && (
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="inline-flex gap-1.5 items-center py-1.5 px-3 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-primary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
              <Ico icon={PencilIcon} sm /> Editar
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className={[
                'inline-flex gap-1.5 items-center py-1.5 px-3 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border transition-colors duration-200 border-gb-red/20 text-gb-red bg-gb-red/[0.07] hover:bg-gb-red/[0.14] active:bg-gb-red/[0.14]',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                deleting ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}>
              {deleting ? <Ico icon={ArrowPathIcon} sm /> : <Ico icon={TrashIcon} sm />} Apagar Turma
            </button>
          </div>
        )}
      </div>
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
              {turma.professorNome && <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={UserIcon} sm />{turma.professorNome}</span>}
              {turma.sala && <span className="inline-flex gap-1.5 items-center text-sm text-muted"><Ico icon={MapPinIcon} sm />{turma.sala}</span>}
            </div>
            <div className="mt-1.5 text-xs text-muted">
              {Array.isArray(turma.diaSemana)
                ? turma.diaSemana.map((d: string) => DIAS_LABEL[d.toLowerCase()] || d).join(' · ')
                : turma.diaSemana}
            </div>
          </div>
          <div className="py-3 px-[18px] text-right rounded-sm bg-elevated">
            <div className="text-2xl font-extrabold text-primary">{frequentam.length}/{turma.capacidade}</div>
            <div className="text-[11px] text-muted">alunos (últimos 60 dias)</div>
            <div className="mt-1.5 w-20 h-1 rounded bg-border">
              <div className="h-full rounded" style={{ width: `${Math.min(100, Math.round((frequentam.length/turma.capacidade)*100))}%`, background: cor }}/>
            </div>
          </div>
        </div>
      </Card>
      <Card padding="lg">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Alunos que frequentaram esta turma (últimos 60 dias)</div>
        {frequentamLoading ? (
          <div className="p-5 text-[13px] text-center text-muted">A carregar...</div>
        ) : frequentam.length === 0 ? (
          <div className="p-5 text-[13px] text-center text-muted">Ninguém frequentou esta turma nos últimos 60 dias</div>
        ) : frequentam.map((a) => (
          <div key={a.id} className="flex justify-between items-center py-2 border-b border-border-subtle">
            <span className="text-[13px] text-primary">{a.nome}</span>
            <BeltBadge faixa={a.faixa as any} grau={a.grau} size="sm" />
          </div>
        ))}
      </Card>
    </div>
  );
}


// ─── Turma Card (vista de lista) ───────────────────────────────────────────────
function TurmaListCard({ turma, onSelect }: { turma: any; onSelect: () => void }) {
  const { data: frequentam = [] } = useAlunosDaTurmaQuery(turma.id);
  const pct = Math.round((frequentam.length / (turma.capacidade || 20)) * 100);
  const cor = turma.cor || GB.red;

  return (
    <button onClick={onSelect}
      className="p-4.5 w-full text-left rounded-lg border cursor-pointer transition-colors duration-200 border-border bg-card hover:border-border-strong outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
    >
      <div className="flex gap-2 justify-between mb-2">
        <div className="text-[13px] font-bold leading-tight text-primary">{turma.nome}</div>
        <span
          className="py-0.5 px-1.5 text-[10px] font-bold rounded-full shrink-0"
          style={{ background: `${cor}20`, color: cor }}
        >
          {turma.tipo?.toUpperCase()}
        </span>
      </div>
      <div className="inline-flex gap-1.5 items-center mb-1.5 text-[11.5px] text-muted">
        <Ico icon={ClockIcon} sm />{turma.horario}
      </div>
      {Array.isArray(turma.diaSemana) && turma.diaSemana.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {turma.diaSemana.map((d: string) => (
            <span key={d} className="py-0.5 px-1.5 text-[10px] font-bold tracking-wide rounded"
              style={{ background: `${cor}18`, color: cor }}>
              {DIAS_LABEL[d.toLowerCase()] || d}
            </span>
          ))}
        </div>
      )}
      {turma.professorNome && <div className="inline-flex gap-1.5 items-center mb-1 text-xs text-muted"><Ico icon={UserIcon} sm />{turma.professorNome}</div>}
      {turma.sala && <div className="inline-flex gap-1.5 items-center mb-2 text-xs text-muted"><Ico icon={MapPinIcon} sm />{turma.sala}</div>}
      <div className="flex justify-between mb-1.5 text-xs text-muted">
        <span>{frequentam.length}/{turma.capacidade} alunos</span>
        <span className={pct >= 90 ? 'font-bold text-gb-red' : 'font-normal'}>{pct}%</span>
      </div>
      <div className="h-[3px] rounded bg-border">
        <div className="h-full rounded transition-[width] duration-300" style={{ width: `${Math.min(100,pct)}%`, background: cor }}/>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TurmasPage() {
  const { user } = useAuth();
  // RLS ("Admin cria turmas") só permite INSERT a estes papéis — o professor
  // pode ver o horário mas não gerir turmas, por isso o botão fica escondido
  // em vez de deixar o professor tentar criar e falhar em silêncio.
  const podeCriarTurma = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'atendimento';
  const { data: turmas, refetch } = useTurmas();
  const [showNova,   setShowNova]   = useState(false);
  const [selected,   setSelected]   = useState<any | null>(null);
  const [editing,    setEditing]    = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [view,       setView]       = useState<'calendar' | 'list'>('calendar');

  if (selected) return (
    <>
      <TurmaDetail
        turma={selected}
        onBack={() => setSelected(null)}
        podeGerir={podeCriarTurma}
        onDeleted={() => { setSelected(null); refetch(); }}
        onEdit={() => setEditing(true)}
      />
      {editing && (
        <TurmaModal
          turma={selected}
          onClose={() => setEditing(false)}
          onSave={() => { setEditing(false); setSelected(null); refetch(); }}
        />
      )}
    </>
  );

  const filtered = filtroTipo === 'all' ? turmas : turmas.filter((t: any) => t.tipo === filtroTipo);

  return (
    <div>
      {showNova && <TurmaModal onClose={() => setShowNova(false)} onSave={() => { setShowNova(false); refetch(); }} />}

      <PageHeader
        eyebrow="Academia"
        title="Horário de Turmas"
        actions={<>
          {/* View toggle — sized to match the Button 'md' preset (py-2.5/text-[12px])
              so it lines up with "+ Nova Turma" instead of standing taller. */}
          <div className="flex overflow-hidden self-stretch rounded-sm border border-border bg-elevated">
            {([['calendar', CalendarIcon],['list', Bars3Icon]] as [string, HeroIcon][]).map(([v, icon]) => (
              <button key={v} onClick={() => setView(v as any)}
                className={[
                  'py-2.5 px-3.5 min-h-11 sm:min-h-0 text-[12px] border-none cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
                  view===v ? 'text-white bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'bg-transparent text-muted hover:bg-border-subtle active:bg-border-subtle',
                ].join(' ')}>
                <Ico icon={icon} sm />
              </button>
            ))}
          </div>
          {podeCriarTurma && (
            <Button variant="primary" onClick={() => setShowNova(true)}>
              <Ico icon={PlusIcon} sm /> Nova Turma
            </Button>
          )}
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
      <TurmasLegend turmas={filtered} />

      {/* Calendar view */}
      {view === 'calendar' && (
        <TurmasCalendarView turmas={filtered} onSelect={setSelected} filtroTipo={filtroTipo} />
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((turma: any) => (
            <TurmaListCard key={turma.id} turma={turma} onSelect={() => setSelected(turma)} />
          ))}
          {podeCriarTurma && (
            <button onClick={() => setShowNova(true)}
              className="flex flex-col gap-2 justify-center items-center p-5 min-h-[130px] rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-200 border-border bg-elevated hover:border-gb-red active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
              <span className="text-3xl text-muted">+</span>
              <span className="text-[13px] text-muted">Nova Turma</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
