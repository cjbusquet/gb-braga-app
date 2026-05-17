// @ts-nocheck
import { useState } from 'react';
import { useAlunos } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';
import type { Aluno } from '../../types';
import NovaMatriculaModal from './NovaMatriculaModal';

function BeltTag({ faixa, grau }: { faixa: string; grau: number }) {
  const c = beltConfig[faixa] || { bg: '#888', text: '#fff', label: faixa };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 24, height: 6, background: c.bg, borderRadius: 2, border: faixa === 'branca' ? '1px solid #555' : 'none' }}/>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.label} G{grau}</span>
    </div>
  );
}

function StatusDot({ status }: { status: Aluno['status'] }) {
  const map = { ativo: '#22C55E', inativo: '#6B7280', suspenso: '#EF4444' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: map[status] }}/>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status}</span>
    </div>
  );
}

function Avatar({ nome, size = 36, accent = GB.red }: { nome: string; size?: number; accent?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: accent + '18', border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {nome.charAt(0)}
    </div>
  );
}


function EditAlunoModal({ aluno, onClose }: { aluno: Aluno; onClose: () => void }) {
  const fields: {key: string; label: string; val: string}[] = [
    { key:'nome', label:'Nome completo', val: aluno.nome },
    { key:'email', label:'Email', val: aluno.email },
    { key:'telefone', label:'Telefone', val: aluno.telefone },
    { key:'nif', label:'NIF', val: (aluno as any).nif || '' },
    { key:'dataNascimento', label:'Data de Nascimento', val: aluno.dataNascimento },
    { key:'responsavel', label:'Responsável', val: aluno.responsavel || '' },
  ];
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:540, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ color:'var(--text-primary)', fontSize:15, fontWeight:800 }}>Editar — {aluno.nome}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        </div>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom:12 }}>
            <label style={{ display:'block', color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:4 }}>{f.label}</label>
            <input defaultValue={f.val}
              style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 11px', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='var(--gb-red)')}
              onBlur={e=>(e.target.style.borderColor='var(--border)')}
            />
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button onClick={onClose} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
          <button onClick={onClose} style={{ flex:2, background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'10px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>💾 Guardar Alterações</button>
        </div>
      </div>
    </div>
  );
}

export default function AlunosPage() {
  const { data: alunos, refetch } = useAlunos();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selected, setSelected] = useState<Aluno | null>(null);
  const [editModal, setEditModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editData, _setEditData] = useState<Record<string,string>>({});
  const [showMatricula, setShowMatricula] = useState(false);

  const filtered = alunos.filter(a => {
    const s = a.nome.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
    const st = filterStatus === 'todos' || a.status === filterStatus;
    return s && st;
  });

  if (selected) {
    const bc = beltConfig[selected.faixa];
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>← Voltar</button>
          <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>{selected.nome}</span>
          <StatusDot status={selected.status}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Profile */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
              <Avatar nome={selected.nome} size={52} accent={GB.red}/>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>{selected.nome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{selected.email}</div>
                <div style={{ marginTop: 6 }}><BeltTag faixa={selected.faixa} grau={selected.grau}/></div>
              </div>
            </div>
            {[
              ['NIF', (selected as any).nif || '—'],
              ['Telefone', selected.telefone],
              ['WhatsApp', selected.whatsapp || '—'],
              ['Nascimento', selected.dataNascimento],
              ['Matrícula', selected.dataMatricula],
              ['Plano', selected.plano],
              ['Responsável', selected.responsavel || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => setEditModal(true)} style={{ width: '100%', marginTop: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              ✏️ Editar dados do aluno
            </button>
          </div>
          {/* Stats + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Belt card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Faixa Atual</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 60, height: 12, background: bc?.bg || '#888', borderRadius: 3, border: selected.faixa === 'branca' ? '1px solid #555' : 'none', boxShadow: `0 0 12px ${(bc?.bg || '#888')}44` }}/>
                <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{bc?.label} · {selected.grau}° Grau</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Frequência mensal</div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 6, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ background: selected.frequencia >= 80 ? '#22C55E' : selected.frequencia >= 60 ? '#F59E0B' : GB.red, height: '100%', width: `${selected.frequencia}%` }}/>
              </div>
              <div style={{ color: selected.frequencia >= 80 ? '#22C55E' : selected.frequencia >= 60 ? '#F59E0B' : GB.red, fontSize: 12, fontWeight: 600 }}>{selected.frequencia}%</div>
            </div>
            {/* Stripe */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Stripe</div>
              {selected.stripeCustomerId ? (
                <>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 10 }}>
                    <div style={{ color: '#22C55E', fontSize: 11, fontWeight: 600 }}>✓ Cliente vinculado</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{selected.stripeCustomerId}</div>
                  </div>
                  <button style={{ width: '100%', background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Ver no Stripe ↗
                  </button>
                </>
              ) : (
                <button style={{ width: '100%', background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Criar no Stripe
                </button>
              )}
            </div>
            {/* Quick actions */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '💬', label: 'WhatsApp', accent: '#25D366' },
                { icon: '📧', label: 'Enviar Email', accent: '#3B82F6' },
                { icon: '◈', label: 'Registrar Graduação', accent: '#A78BFA' },
                { icon: '✏️', label: 'Editar dados', accent: '#3B82F6', action: () => setEditModal(true) },
                { icon: '⛔', label: 'Suspender acesso', accent: '#D97706', action: () => alert('Confirmar suspensão?') },
                { icon: '🗑️', label: 'Cancelar matrícula', accent: GB.red, action: () => alert('Confirmar cancelamento?') },
              ].map(a => (
                <button key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <span style={{ color: a.accent, fontSize: 12.5, fontWeight: 500 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit modal
  const EditModal = editModal && selected && (
    <EditAlunoModal aluno={selected} onClose={() => setEditModal(false)}/>
  );
  return (
    <div>
      {EditModal}
      {showMatricula && <NovaMatriculaModal onClose={() => setShowMatricula(false)}/>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Academia</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Alunos <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>{filtered.length}</span></h1>
        </div>
        <button onClick={() => setShowMatricula(true)} style={{ background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: `0 0 16px ${GB.redGlow}` }}>
          + Nova Matrícula
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar aluno..."
          style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}
        />
        {['todos','ativo','inativo','suspenso'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            background: filterStatus === s ? GB.red : 'var(--bg-card)', border: `1px solid ${filterStatus === s ? GB.red : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: filterStatus === s ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: filterStatus === s ? 600 : 400, textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      {/* Student cards — DojoX grid style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(aluno => {
          const bc = beltConfig[aluno.faixa];
          return (
            <div key={aluno.id}
              onClick={() => setSelected(aluno)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GB.red + '50'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              {/* Belt stripe accent top */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: bc?.bg || '#888' }}/>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 4 }}>
                <Avatar nome={aluno.nome} size={40} accent={bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || GB.red)}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aluno.nome}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aluno.email}</div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BeltTag faixa={aluno.faixa} grau={aluno.grau}/>
                  </div>
                </div>
                <StatusDot status={aluno.status}/>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>Frequência</div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                    <div style={{ background: aluno.frequencia >= 80 ? '#22C55E' : aluno.frequencia >= 60 ? '#F59E0B' : GB.red, height: '100%', width: `${aluno.frequencia}%` }}/>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>{aluno.frequencia}%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>Plano</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }}>{aluno.plano.split(' ')[0]}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {aluno.whatsapp && (
                  <button onClick={e => e.stopPropagation()} style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', color: '#25D366', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>💬</button>
                )}
                {aluno.stripeCustomerId && (
                  <button onClick={e => e.stopPropagation()} style={{ background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', color: '#635BFF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Stripe</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
