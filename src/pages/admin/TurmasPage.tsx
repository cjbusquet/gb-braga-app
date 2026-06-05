/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useTurmas, useAlunos, db } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import type { Turma } from '../../types';

const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const TIPOS = ['gi','nogi','wrestling','kids'];
const NIVEIS = ['all','iniciante','intermediario','avancado','kids'];

function NovaTurmaModal({ onClose, onSave }: { onClose: ()=>void; onSave: ()=>void }) {
  const [nome, setNome]               = useState('');
  const [professor, setProfessor]      = useState('');
  const [horario, setHorario]         = useState('');
  const [dias, setDias]               = useState<string[]>([]);
  const [sala, setSala]               = useState('');
  const [capacidade, setCapacidade]   = useState(20);
  const [tipo, setTipo]               = useState('gi');
  const [nivel, setNivel]             = useState('all');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

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
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Jiu-Jitsu Adultos — Noite 1" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Professor</label>
            <input value={professor} onChange={e=>setProfessor(e.target.value)} placeholder="Nome do professor" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Horário *</label>
            <input value={horario} onChange={e=>setHorario(e.target.value)} placeholder="18:30-20:00" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Sala</label>
            <input value={sala} onChange={e=>setSala(e.target.value)} placeholder="Sala Principal" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Capacidade</label>
            <input type="number" value={capacidade} onChange={e=>setCapacidade(parseInt(e.target.value)||20)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Tipo</label>
            <select value={tipo} onChange={e=>setTipo(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {TIPOS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Nível</label>
            <select value={nivel} onChange={e=>setNivel(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {NIVEIS.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Dias da Semana</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {DIAS.map(d=>(
              <button key={d} onClick={()=>toggleDia(d)} style={{ background: dias.includes(d)?GB.red:'var(--bg-elevated)', border:`1px solid ${dias.includes(d)?GB.red:'var(--border)'}`, borderRadius:6, padding:'5px 12px', color: dias.includes(d)?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!nome || !horario || saving} style={{ flex:2, background: saved?'#22C55E':(!nome||!horario||saving)?'#aaa':GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'11px', color:'#fff', fontSize:13, fontWeight:700, cursor:(!nome||!horario||saving)?'not-allowed':'pointer' }}>
            {saved ? '✓ Turma criada!' : saving ? 'A guardar...' : '+ Criar Turma'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TurmaDetail({ turma, onBack }: { turma: Turma; onBack: ()=>void }) {
  const { data: alunos } = useAlunos();
  const inscritos = alunos.filter((a: any) => a.turmaId === turma.id || a.plano?.includes(turma.nome));

  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
        ← Voltar às turmas
      </button>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2 style={{ color:'var(--text-primary)', fontSize:18, fontWeight:700, marginBottom:4 }}>{turma.nome}</h2>
            <div style={{ color:'var(--text-muted)', fontSize:13 }}>{turma.horario} · {Array.isArray(turma.diaSemana) ? turma.diaSemana.join(', ') : turma.diaSemana} · {turma.sala}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800 }}>{inscritos.length}/{turma.capacidade}</div>
            <div style={{ color:'var(--text-muted)', fontSize:11 }}>alunos</div>
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

export default function TurmasPage() {
  const { data: turmas, refetch } = useTurmas();
  const { data: alunos } = useAlunos();
  const [showNova, setShowNova]     = useState(false);
  const [selected, setSelected]     = useState<Turma | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('all');

  if (selected) return <TurmaDetail turma={selected} onBack={() => setSelected(null)} />;

  const filtered = filtroTipo === 'all' ? turmas : turmas.filter((t: any) => t.tipo === filtroTipo);

  return (
    <div>
      {showNova && <NovaTurmaModal onClose={() => setShowNova(false)} onSave={() => { setShowNova(false); refetch(); }} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>Turmas</h1>
        </div>
        <button onClick={() => setShowNova(true)} style={{ background:GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)', display:'flex', alignItems:'center', gap:8 }}>
          + Nova Turma
        </button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['all','gi','nogi','kids'].map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)} style={{ background: filtroTipo===t?GB.red:'var(--bg-card)', border:`1px solid ${filtroTipo===t?GB.red:'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'6px 14px', color: filtroTipo===t?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
            {t === 'all' ? 'Todas' : t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
        {filtered.map((turma: any) => {
          const inscritos = alunos.filter((a: any) => a.turmaId === turma.id).length || turma.inscritos || 0;
          const pct = Math.round((inscritos / (turma.capacidade || 20)) * 100);
          return (
            <div key={turma.id}
              style={{ background:'var(--bg-card)', border:`2px solid ${turma.cor || 'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:20, cursor:'pointer', transition:'all 0.15s', boxShadow:'var(--shadow-xs)', borderTop: `4px solid ${turma.cor || 'var(--border)'}` }}
              onClick={() => setSelected(turma)}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                <div style={{ color:'var(--text-primary)', fontSize:13.5, fontWeight:700, lineHeight:1.3 }}>{turma.nome}</div>
                <span style={{ background: turma.cor ? `${turma.cor}22` : 'var(--bg-elevated)', color: turma.cor || '#3B82F6', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, flexShrink:0, border:`1px solid ${turma.cor || 'var(--border)'}44` }}>
                  {turma.tipo?.toUpperCase()}
                </span>
              </div>
              <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:6 }}>
                🕐 {turma.horario} &nbsp;·&nbsp; {Array.isArray(turma.diaSemana) ? turma.diaSemana.slice(0,3).join(', ') : turma.diaSemana}
              </div>
              {turma.sala && <div style={{ color:'var(--text-muted)', fontSize:11.5, marginBottom:6 }}>📍 {turma.sala}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ color:'var(--text-muted)', fontSize:11 }}>{inscritos}/{turma.capacidade} alunos</span>
                <span style={{ color: pct>=90?GB.red:'var(--text-muted)', fontSize:11, fontWeight: pct>=90?700:400 }}>{pct}%</span>
              </div>
              <div style={{ height:4, background:'var(--border)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background: pct>=90?GB.red:'#22C55E', borderRadius:2 }}/>
              </div>
            </div>
          );
        })}

        <div onClick={() => setShowNova(true)} style={{ background:'var(--bg-elevated)', border:'2px dashed var(--border)', borderRadius:'var(--radius-lg)', padding:20, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:140 }}>
          <span style={{ color:'var(--text-muted)', fontSize:28 }}>+</span>
          <span style={{ color:'var(--text-muted)', fontSize:13 }}>Nova Turma</span>
        </div>
      </div>
    </div>
  );
}
