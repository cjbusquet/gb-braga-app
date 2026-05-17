// @ts-nocheck
import { useState } from 'react';
import { useTurmas, useAlunos } from '../../lib/useData';
import { mockProfessores } from '../../data/mockData';
import { GB, beltConfig } from '../../lib/gbBrand';
import type { Turma } from '../../types';

const NIVEL_COLOR: Record<string, { bg: string; color: string }> = {
  iniciante:     { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
  intermediario: { bg: 'rgba(59,130,246,0.12)',   color: '#3B82F6' },
  avancado:      { bg: 'rgba(167,139,250,0.12)',  color: '#A78BFA' },
  kids:          { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B' },
  all:           { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
};
const TIPO_ICON: Record<string, string> = { gi: '🥋', nogi: '👕', wrestling: '🤼', kids: '⭐' };

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return <span style={{ background: bg, color, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.3px' }}>{children}</span>;
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>;
}

// ─── Nova Turma Modal ─────────────────────────────────────────────────────────
function NovaTurmaModal({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [prof, setProf] = useState('');
  const [horario, setHorario] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [nivel, setNivel] = useState('iniciante');
  const [tipo, setTipo] = useState('gi');
  const [cap, setCap] = useState('20');
  const [sala, setSala] = useState('Tatame Principal');
  const [saved, setSaved] = useState(false);

  const diasSemana = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const toggle = (d: string) => setDias(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);

  const handleSave = () => { setSaved(true); setTimeout(onClose, 1200); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-float)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Nova Turma</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Configurar horário, professor e nível</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 28, height: 28, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nome */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Nome da Turma</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Gi Avançado — Noite"
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
          </div>

          {/* Tipo + Nível */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                {Object.entries(TIPO_ICON).map(([k, v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Nível</label>
              <select value={nivel} onChange={e => setNivel(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                {Object.keys(NIVEL_COLOR).map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase()+n.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Professor */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Professor</label>
            <select value={prof} onChange={e => setProf(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
              <option value="">Selecionar professor...</option>
              {mockProfessores.map(p => <option key={p.id} value={p.id}>{p.nome} — Faixa {p.faixa}</option>)}
            </select>
          </div>

          {/* Horário + Sala */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Horário</label>
              <input value={horario} onChange={e => setHorario(e.target.value)} placeholder="19:00-20:30"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)' }}/>
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Sala</label>
              <input value={sala} onChange={e => setSala(e.target.value)} placeholder="Tatame Principal"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Capacidade</label>
              <input type="number" value={cap} onChange={e => setCap(e.target.value)} placeholder="20"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
            </div>
          </div>

          {/* Dias */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>Dias da Semana</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {diasSemana.map(d => (
                <button key={d} onClick={() => toggle(d)} style={{ background: dias.includes(d) ? GB.red : 'var(--bg-elevated)', border: `1px solid ${dias.includes(d) ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: dias.includes(d) ? '#fff' : 'var(--text-secondary)', fontSize: 11.5, fontWeight: dias.includes(d) ? 700 : 400, cursor: 'pointer' }}>
                  {d.slice(0,3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} style={{ flex: 2, background: saved ? '#22C55E' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 14px ${GB.redGlow}` }}>
            {saved ? '✓ Turma criada!' : '+ Criar Turma'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────
function TurmaDetail({ turma, onBack }: { turma: Turma; onBack: () => void }) {
  const prof = mockProfessores.find(p => p.id === turma.professorId);
  const alunosInscritos = alunos.filter(a => a.status === 'ativo').slice(0, turma.inscritos);
  const ocupacao = Math.round((turma.inscritos / turma.capacidade) * 100);
  const nc = NIVEL_COLOR[turma.nivel];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>← Turmas</button>
        <span style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 700 }}>{TIPO_ICON[turma.tipo]} {turma.nome}</span>
        <Badge bg={nc.bg} color={nc.color}>{turma.nivel.toUpperCase()}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Info */}
        <Card style={{ padding: 22 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Detalhes</div>
          {[
            ['Horário', turma.horario],
            ['Dias', turma.diaSemana.join(' · ')],
            ['Sala', turma.sala],
            ['Tipo', turma.tipo.toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Ocupação</span>
              <span style={{ color: ocupacao >= 90 ? '#EF4444' : ocupacao >= 70 ? '#F59E0B' : '#22C55E', fontSize: 12, fontWeight: 700 }}>{turma.inscritos}/{turma.capacidade} ({ocupacao}%)</span>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ background: ocupacao >= 90 ? '#EF4444' : ocupacao >= 70 ? '#F59E0B' : '#22C55E', height: '100%', width: `${ocupacao}%` }}/>
            </div>
          </div>
          {prof && (
            <div style={{ marginTop: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GB.red, fontWeight: 700, fontSize: 14 }}>{prof.nome.charAt(0)}</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{prof.nome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' as const }}>Faixa {prof.faixa} · {prof.grau}° grau</div>
              </div>
            </div>
          )}
        </Card>

        {/* Alunos inscritos */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Alunos Inscritos</div>
            <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{alunosInscritos.length}</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alunosInscritos.map(a => {
              const bc = beltConfig[a.faixa];
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: (bc?.bg || '#888') + '20', border: `1px solid ${(bc?.bg || '#888')}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || GB.red), fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {a.nome.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{a.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <div style={{ width: 16, height: 5, background: bc?.bg || '#888', borderRadius: 2, border: a.faixa === 'branca' ? '1px solid #555' : 'none' }}/>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10.5, textTransform: 'capitalize' as const }}>{bc?.label}</span>
                    </div>
                  </div>
                  <div style={{ background: a.frequencia >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-sm)', padding: '2px 7px', color: a.frequencia >= 80 ? '#22C55E' : '#F59E0B', fontSize: 11, fontWeight: 600 }}>
                    {a.frequencia}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly schedule */}
        <Card style={{ padding: 22, gridColumn: '1 / -1' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Horário Semanal</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d, i) => {
              const fullDay = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][i];
              const active = turma.diaSemana.includes(fullDay);
              return (
                <div key={d} style={{ textAlign: 'center', padding: '10px 6px', background: active ? GB.redGlow : 'var(--bg-elevated)', border: `1px solid ${active ? GB.red + '40' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: active ? GB.red : 'var(--text-muted)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{d}</div>
                  {active && <div style={{ color: 'var(--text-primary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{turma.horario}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TurmasPage() {
  const { data: turmas } = useTurmas();
  const { data: alunos } = useAlunos();
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Turma | null>(null);
  const [filterTipo, setFilterTipo] = useState('todos');

  if (detail) return <TurmaDetail turma={detail} onBack={() => setDetail(null)}/>;

  const filtered = turmas.filter(t => filterTipo === 'todos' || t.tipo === filterTipo);
  const totalInscritos = turmas.reduce((s, t) => s + t.inscritos, 0);
  const totalCapacidade = turmas.reduce((s, t) => s + t.capacidade, 0);

  return (
    <div>
      {showModal && <NovaTurmaModal onClose={() => setShowModal(false)}/>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Academia</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Turmas <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>{filtered.length}</span></h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: `0 0 16px ${GB.redGlow}`, cursor: 'pointer' }}>
          + Nova Turma
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total de turmas', value: turmas.length, accent: GB.red },
          { label: 'Alunos inscritos', value: totalInscritos, accent: '#3B82F6' },
          { label: 'Capacidade total', value: totalCapacidade, accent: '#9CA3AF' },
          { label: 'Ocupação média', value: `${Math.round((totalInscritos/totalCapacidade)*100)}%`, accent: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `2px solid ${s.accent}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['todos', 'gi', 'nogi', 'wrestling', 'kids'].map(t => (
          <button key={t} onClick={() => setFilterTipo(t)} style={{ background: filterTipo === t ? GB.red : 'var(--bg-card)', border: `1px solid ${filterTipo === t ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '6px 14px', color: filterTipo === t ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: filterTipo === t ? 600 : 400, textTransform: 'capitalize' as const, cursor: 'pointer' }}>
            {t === 'todos' ? 'Todos' : `${TIPO_ICON[t]} ${t.toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(turma => {
          const nc = NIVEL_COLOR[turma.nivel];
          const prof = mockProfessores.find(p => p.id === turma.professorId);
          const ocupacao = Math.round((turma.inscritos / turma.capacidade) * 100);
          return (
            <div key={turma.id}
              onClick={() => setDetail(turma)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GB.red + '50'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: GB.red }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{TIPO_ICON[turma.tipo]}</span>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{turma.nome}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{turma.sala}</div>
                  </div>
                </div>
                <Badge bg={nc.bg} color={nc.color}>{turma.nivel}</Badge>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' as const }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{turma.horario}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>horário</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' as const }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{turma.diaSemana.length}x/sem</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{turma.diaSemana.slice(0,2).join('·')}{turma.diaSemana.length > 2 ? '...' : ''}</div>
                </div>
              </div>

              {prof && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: GB.red, flexShrink: 0 }}>{prof.nome.charAt(0)}</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{prof.nome}</span>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Ocupação</span>
                  <span style={{ color: ocupacao >= 90 ? '#EF4444' : ocupacao >= 70 ? '#F59E0B' : '#22C55E', fontSize: 11, fontWeight: 700 }}>{turma.inscritos}/{turma.capacidade}</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ background: ocupacao >= 90 ? '#EF4444' : ocupacao >= 70 ? '#F59E0B' : '#22C55E', height: '100%', width: `${ocupacao}%` }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
