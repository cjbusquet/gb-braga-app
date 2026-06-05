/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useTurmas, useAlunos, db } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import type { Turma } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIAS_LABEL: Record<string, string> = {
  segunda: 'SEG', terça: 'TER', quarta: 'QUA',
  quinta:  'QUI', sexta: 'SEX', sábado: 'SÁB', domingo: 'DOM',
};
const DIAS_ORDER = ['segunda','terça','quarta','quinta','sexta','sábado'];
const TIPOS = ['gi','nogi','wrestling','kids'];
const NIVEIS = ['all','iniciante','intermediario','avancado','kids'];
const DIAS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

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

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 11px', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box', fontFamily:'var(--font-ui)' };
  const lbl: React.CSSProperties = { display:'block', color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:4 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:560, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ color:'var(--text-primary)', fontSize:16, fontWeight:700 }}>Nova Turma</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>Nome da Turma *</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="ex: GB 1 - Adultos" style={inp}/>
          </div>
          <div><label style={lbl}>Professor</label><input value={professor} onChange={e=>setProfessor(e.target.value)} placeholder="Nome do professor" style={inp}/></div>
          <div><label style={lbl}>Horário *</label><input value={horario} onChange={e=>setHorario(e.target.value)} placeholder="18:30" style={inp}/></div>
          <div><label style={lbl}>Sala</label><input value={sala} onChange={e=>setSala(e.target.value)} placeholder="Tatame 1" style={inp}/></div>
          <div><label style={lbl}>Capacidade</label><input type="number" value={capacidade} onChange={e=>setCapacidade(parseInt(e.target.value)||20)} style={inp}/></div>
          <div><label style={lbl}>Tipo</label><select value={tipo} onChange={e=>setTipo(e.target.value)} style={{ ...inp, cursor:'pointer' }}>{TIPOS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
          <div><label style={lbl}>Nível</label><select value={nivel} onChange={e=>setNivel(e.target.value)} style={{ ...inp, cursor:'pointer' }}>{NIVEIS.map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Dias da Semana</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {DIAS_FULL.map(d=>(
              <button key={d} onClick={()=>toggleDia(d)} style={{ background: dias.includes(d)?GB.red:'var(--bg-elevated)', border:`1px solid ${dias.includes(d)?GB.red:'var(--border)'}`, borderRadius:6, padding:'5px 12px', color: dias.includes(d)?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={!nome || !horario || saving} style={{ flex:2, background: saved?'#22C55E':(!nome||!horario||saving)?'#aaa':GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'11px', color:'#fff', fontSize:13, fontWeight:700, cursor:(!nome||!horario||saving)?'not-allowed':'pointer' }}>
            {saved ? '✓ Turma criada!' : saving ? 'A guardar...' : '+ Criar Turma'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Turma Detail ─────────────────────────────────────────────────────────────
function TurmaDetail({ turma, onBack }: { turma: any; onBack: ()=>void }) {
  const { data: alunos } = useAlunos();
  const inscritos = alunos.filter((a: any) => a.turmaId === turma.id || a.plano?.includes(turma.nome));
  const cor = (turma as any).cor || GB.red;

  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
        ← Voltar ao calendário
      </button>
      <div style={{ background:'var(--bg-card)', border:`1px solid var(--border)`, borderRadius:'var(--radius-lg)', borderTop:`4px solid ${cor}`, padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ color:'var(--text-primary)', fontSize:18, fontWeight:700, marginBottom:6 }}>{turma.nome}</h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              <span style={{ background:`${cor}18`, color:cor, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, border:`1px solid ${cor}44` }}>
                {turma.tipo?.toUpperCase()}
              </span>
              <span style={{ color:'var(--text-muted)', fontSize:13 }}>🕐 {turma.horario}</span>
              {turma.sala && <span style={{ color:'var(--text-muted)', fontSize:13 }}>📍 {turma.sala}</span>}
            </div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:6 }}>
              {Array.isArray(turma.diaSemana)
                ? turma.diaSemana.map((d: string) => DIAS_LABEL[d] || d).join(' · ')
                : turma.diaSemana}
            </div>
          </div>
          <div style={{ textAlign:'right', background:'var(--bg-elevated)', padding:'12px 18px', borderRadius:'var(--radius-sm)' }}>
            <div style={{ color:'var(--text-primary)', fontSize:24, fontWeight:800 }}>{inscritos.length}/{turma.capacidade}</div>
            <div style={{ color:'var(--text-muted)', fontSize:11 }}>alunos inscritos</div>
            <div style={{ height:4, background:'var(--border)', borderRadius:2, marginTop:6, width:80 }}>
              <div style={{ height:'100%', width:`${Math.min(100, Math.round((inscritos.length/turma.capacidade)*100))}%`, background: cor, borderRadius:2 }}/>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24 }}>
        <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>Alunos inscritos</div>
        {inscritos.length === 0 ? (
          <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>Nenhum aluno inscrito nesta turma</div>
        ) : inscritos.map((a: any) => (
          <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-subtle)' }}>
            <span style={{ color:'var(--text-primary)', fontSize:13 }}>{a.nome}</span>
            <span style={{ color:'var(--text-muted)', fontSize:12 }}>{a.faixa} · grau {a.grau}</span>
          </div>
        ))}
      </div>
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
      <div
        onClick={() => onSelect(t)}
        style={{
          background: `${cor}18`,
          border: `1.5px solid ${cor}`,
          borderLeft: `4px solid ${cor}`,
          borderRadius: 5,
          padding: '5px 7px',
          cursor: 'pointer',
          marginBottom: 3,
          transition: 'opacity 0.1s',
          minWidth: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <div style={{ color: cor, fontSize: isMobile ? 10.5 : 11, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.nome}
        </div>
        {t.sala && (
          <div style={{ color: 'var(--text-muted)', fontSize: 9.5, marginTop: 1 }}>{t.sala}</div>
        )}
      </div>
    );
  };

  // ── MOBILE: day tabs + vertical list ────────────────────────────────────────
  if (isMobile) {
    const diasComAulas = DIAS_ORDER.filter(d => Object.keys(schedule[d] || {}).length > 0);
    return (
      <div>
        {/* Day tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:'1px solid var(--border)', overflowX:'auto', scrollbarWidth:'none' }}>
          {diasComAulas.map(d => (
            <button key={d} onClick={() => setDiaAtivo(d)}
              style={{
                flex: '0 0 auto', padding:'8px 14px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${diaAtivo === d ? GB.red : 'transparent'}`,
                color: diaAtivo === d ? GB.red : 'var(--text-muted)',
                fontSize: 12.5, fontWeight: diaAtivo === d ? 700 : 400, cursor: 'pointer',
              }}>
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
              <div key={hora} style={{ display:'flex', gap:12, marginBottom:8, alignItems:'flex-start' }}>
                <div style={{ color:'var(--text-muted)', fontSize:12, fontWeight:700, minWidth:36, paddingTop:6 }}>{hora}</div>
                <div style={{ flex:1 }}>
                  {aulas.map((t: any) => <TurmaBlock key={t.id} t={t} />)}
                </div>
              </div>
            );
          })}
          {times.every(h => !schedule[diaAtivo]?.[h]?.length) && (
            <div style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'32px 0' }}>
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
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <div style={{ minWidth: TIME_W + dias.length * COL_W }}>

        {/* Header row */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: TIME_W, flexShrink: 0, padding: '10px 8px', borderRight: '1px solid var(--border)' }} />
          {dias.map(d => (
            <div key={d} style={{
              width: COL_W, flexShrink: 0,
              padding: '10px 8px', textAlign: 'center',
              borderRight: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 12, fontWeight: 800,
              letterSpacing: '0.5px',
            }}>
              {DIAS_LABEL[d]}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {times.map((hora, idx) => (
          <div key={hora} style={{
            display: 'flex',
            background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {/* Time label */}
            <div style={{
              width: TIME_W, flexShrink: 0,
              padding: '10px 8px', borderRight: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.2,
            }}>
              {hora}
            </div>

            {/* Day cells */}
            {dias.map(d => {
              const aulas = schedule[d]?.[hora] ?? [];
              return (
                <div key={d} style={{
                  width: COL_W, flexShrink: 0,
                  padding: '6px 5px',
                  borderRight: '1px solid var(--border-subtle)',
                  minHeight: aulas.length ? 'auto' : 36,
                }}>
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
      const prefix = t.nome.replace(/\s*[\(\-].*/, '').trim();
      if (!seen.has(prefix)) seen.set(prefix, t);
    }
    return [...seen.entries()];
  }, [turmas]);

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
      {unique.map(([label, t]) => (
        <div key={label} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--bg-elevated)', border:`1px solid ${(t as any).cor || 'var(--border)'}44`, borderRadius:99 }}>
          <div style={{ width:10, height:10, borderRadius:2, background:(t as any).cor || '#888', flexShrink:0 }}/>
          <span style={{ color:'var(--text-secondary)', fontSize:11.5, fontWeight:600 }}>{label}</span>
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

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase', margin:0 }}>
            Horário de Turmas
          </h1>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
            {([['calendar','📅'],['list','☰']] as [string, string][]).map(([v, icon]) => (
              <button key={v} onClick={() => setView(v as any)}
                style={{ padding:'8px 14px', background: view===v ? GB.red : 'transparent', border:'none', color: view===v ? '#fff' : 'var(--text-muted)', fontSize:14, cursor:'pointer' }}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNova(true)} style={{ background:GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>
            + Nova Turma
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {[['all','Todas'],['gi','GI'],['nogi','NO GI'],['kids','Kids']].map(([t, l]) => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            style={{ background: filtroTipo===t ? GB.red : 'var(--bg-card)', border:`1px solid ${filtroTipo===t ? GB.red : 'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'6px 14px', color: filtroTipo===t ? '#fff' : 'var(--text-secondary)', fontSize:12.5, cursor:'pointer', fontWeight: filtroTipo===t ? 700 : 400 }}>
            {l}
          </button>
        ))}
        <span style={{ color:'var(--text-muted)', fontSize:12, alignSelf:'center', marginLeft:4 }}>
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
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
          {filtered.map((turma: any) => {
            const inscritos = alunos.filter((a: any) => a.turmaId === turma.id).length || turma.inscritos || 0;
            const pct = Math.round((inscritos / (turma.capacidade || 20)) * 100);
            const cor = turma.cor || GB.red;
            return (
              <div key={turma.id} onClick={() => setSelected(turma)}
                style={{ background:'var(--bg-card)', border:`1px solid var(--border)`, borderTop:`4px solid ${cor}`, borderRadius:'var(--radius-lg)', padding:18, cursor:'pointer', transition:'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${cor}33`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                  <div style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700, lineHeight:1.3 }}>{turma.nome}</div>
                  <span style={{ background:`${cor}20`, color:cor, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, flexShrink:0 }}>
                    {turma.tipo?.toUpperCase()}
                  </span>
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:11.5, marginBottom:4 }}>
                  🕐 {turma.horario} &nbsp;·&nbsp;
                  {Array.isArray(turma.diaSemana)
                    ? turma.diaSemana.map((d: string) => DIAS_LABEL[d] || d).join(' ')
                    : turma.diaSemana}
                </div>
                {turma.sala && <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:8 }}>📍 {turma.sala}</div>}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11, color:'var(--text-muted)' }}>
                  <span>{inscritos}/{turma.capacidade} alunos</span>
                  <span style={{ color: pct >= 90 ? GB.red : 'var(--text-muted)', fontWeight: pct >= 90 ? 700 : 400 }}>{pct}%</span>
                </div>
                <div style={{ height:3, background:'var(--border)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background: cor, borderRadius:2, transition:'width 0.3s' }}/>
                </div>
              </div>
            );
          })}
          <div onClick={() => setShowNova(true)} style={{ background:'var(--bg-elevated)', border:'2px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:20, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:130 }}>
            <span style={{ color:'var(--text-muted)', fontSize:28 }}>+</span>
            <span style={{ color:'var(--text-muted)', fontSize:13 }}>Nova Turma</span>
          </div>
        </div>
      )}
    </div>
  );
}
