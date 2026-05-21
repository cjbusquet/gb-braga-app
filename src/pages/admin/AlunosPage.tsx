/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useAlunos, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import NovaMatriculaModal from './NovaMatriculaModal';

function EditAlunoModal({ aluno, onClose }: { aluno: any; onClose: () => void }) {
  const [nome, setNome]         = useState(aluno.nome || '');
  const [email, setEmail]       = useState(aluno.email || '');
  const [telefone, setTel]      = useState(aluno.telefone || '');
  const [nif, setNif]           = useState(aluno.nif || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.atualizarAluno(aluno.id, { nome, email, telefone, nif });
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch(e) {
      console.error(e);
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = { width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 11px', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:4 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:500, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ color:'var(--text-primary)', fontSize:15, fontWeight:800 }}>Editar — {aluno.nome}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        </div>
        {[['Nome completo', nome, setNome, 'text'], ['Email', email, setEmail, 'email'], ['Telefone', telefone, setTel, 'tel'], ['NIF', nif, setNif, 'text']].map(([label, val, setter, type]) => (
          <div key={label as string} style={{ marginBottom:12 }}>
            <label style={lbl}>{label as string}</label>
            <input type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)} style={inp}/>
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button onClick={onClose} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving||saved} style={{ flex:2, background:saved?'#22C55E':saving?'#aaa':GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px', color:'#fff', fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
            {saved?'✓ Guardado!':saving?'A guardar...':'💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlunosPage() {
  const { data: alunos, refetch } = useAlunos();
  const [search, setSearch]         = useState('');
  const [filtro, setFiltro]         = useState('todos');
  const [selected, setSelected]     = useState<any>(null);
  const [editModal, setEditModal]   = useState(false);
  const [showMatricula, setShowMatricula] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const { isMobile }                = useMobile();

  const changeStatus = async (newStatus: 'ativo' | 'suspenso' | 'inativo') => {
    const labels: Record<string, string> = {
      ativo:     'Reativar este aluno?',
      suspenso:  'Suspender este aluno? O acesso será bloqueado temporariamente.',
      inativo:   'Marcar este aluno como inativo? O perfil ficará arquivado.',
    };
    if (!confirm(labels[newStatus])) return;
    setStatusLoading(true);
    try {
      await db.atualizarAluno(selected.id, { status: newStatus });
      const updated = { ...selected, status: newStatus };
      setSelected(updated);
      refetch();
    } catch (e) {
      console.error('Erro ao alterar status:', e);
      alert('Erro ao alterar o estado do aluno. Tente novamente.');
    } finally {
      setStatusLoading(false);
    }
  };

  const filtered = alunos.filter((a: any) => {
    const matchSearch = !search || a.nome?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = filtro === 'todos' || a.status === filtro;
    return matchSearch && matchFiltro;
  });

  return (
    <div>
      {showMatricula && <NovaMatriculaModal onClose={() => setShowMatricula(false)} onSuccess={() => { setShowMatricula(false); refetch(); }}/>}
      {editModal && selected && <EditAlunoModal aluno={selected} onClose={() => { setEditModal(false); refetch(); }}/>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'center' : 'flex-end', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>
            Alunos <span style={{ color:'var(--text-muted)', fontSize:14, fontWeight:400 }}>({filtered.length})</span>
          </h1>
        </div>
        <button onClick={() => setShowMatricula(true)} style={{ background:GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)', whiteSpace:'nowrap' }}>
          + Nova Matrícula
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar aluno..."
          style={{ flex:1, minWidth:200, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 14px', color:'var(--text-primary)', fontSize:13 }}/>
        {['todos','ativo','suspenso','inativo'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ background:filtro===f?GB.red:'var(--bg-card)', border:`1px solid ${filtro===f?GB.red:'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'8px 14px', color:filtro===f?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer', textTransform:'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
            ← Voltar
          </button>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:GB.red, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700 }}>
                  {selected.nome?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ color:'var(--text-primary)', fontSize:17, fontWeight:700 }}>{selected.nome}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:13 }}>{selected.email}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => setEditModal(true)}
                  style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'8px 14px', color:'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
                  ✏️ Editar
                </button>

                {/* Reativar — shown when suspenso or inativo */}
                {(selected.status === 'suspenso' || selected.status === 'inativo') && (
                  <button onClick={() => changeStatus('ativo')} disabled={statusLoading}
                    style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.35)', borderRadius:'var(--radius-sm)', padding:'8px 14px', color:'#16A34A', fontSize:12.5, cursor:'pointer', opacity: statusLoading ? 0.5 : 1 }}>
                    ✅ Reativar
                  </button>
                )}

                {/* Suspender — shown when ativo or inativo */}
                {selected.status !== 'suspenso' && (
                  <button onClick={() => changeStatus('suspenso')} disabled={statusLoading}
                    style={{ background:'rgba(217,119,6,0.1)', border:'1px solid rgba(217,119,6,0.3)', borderRadius:'var(--radius-sm)', padding:'8px 14px', color:'#D97706', fontSize:12.5, cursor:'pointer', opacity: statusLoading ? 0.5 : 1 }}>
                    ⛔ Suspender
                  </button>
                )}

                {/* Tornar Inativo — shown when ativo or suspenso */}
                {selected.status !== 'inativo' && (
                  <button onClick={() => changeStatus('inativo')} disabled={statusLoading}
                    style={{ background:'rgba(107,114,128,0.08)', border:'1px solid rgba(107,114,128,0.25)', borderRadius:'var(--radius-sm)', padding:'8px 14px', color:'#6B7280', fontSize:12.5, cursor:'pointer', opacity: statusLoading ? 0.5 : 1 }}>
                    🚫 Tornar Inativo
                  </button>
                )}
              </div>
            </div>
            {[['NIF', selected.nif||'—'], ['Telefone', selected.telefone||'—'], ['Nascimento', selected.dataNascimento||'—'], ['Matrícula', selected.dataMatricula||'—'], ['Plano', selected.plano||'—'], ['Faixa', `${selected.faixa} · Grau ${selected.grau}`], ['Frequência', `${selected.frequencia||0}%`]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                <span style={{ color:'var(--text-muted)', fontSize:12.5 }}>{k}</span>
                <span style={{ color:'var(--text-primary)', fontSize:12.5, fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
              <span style={{ color:'var(--text-muted)', fontSize:12.5 }}>Status</span>
              <span style={{
                background: selected.status==='ativo' ? 'rgba(34,197,94,0.1)' : selected.status==='suspenso' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)',
                color:      selected.status==='ativo' ? '#16A34A'              : selected.status==='suspenso' ? '#D97706'              : '#6B7280',
                fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, textTransform:'capitalize',
              }}>
                {selected.status==='ativo' ? '● Ativo' : selected.status==='suspenso' ? '⛔ Suspenso' : '○ Inativo'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>
              {search ? 'Nenhum aluno encontrado' : 'Ainda não há alunos. Clica em "+ Nova Matrícula".'}
            </div>
          ) : filtered.map((a: any) => {
            const beltCfg = beltConfig[a.faixa] || { bg:'#888', text:'#fff' };
            return (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:15, fontWeight:700, flexShrink:0 }}>
                  {a.nome?.charAt(0) || '?'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'var(--text-primary)', fontSize:14, fontWeight:600 }}>{a.nome}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:12 }}>{a.email} · {a.plano || '—'}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <span style={{ background:beltCfg.bg, color:beltCfg.text, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>
                    {a.faixa}
                  </span>
                  <span style={{ background: a.status==='ativo'?'rgba(34,197,94,0.1)':a.status==='suspenso'?'rgba(217,119,6,0.1)':'rgba(107,114,128,0.1)', color: a.status==='ativo'?'#16A34A':a.status==='suspenso'?'#D97706':'#6B7280', fontSize:10.5, fontWeight:600, padding:'2px 8px', borderRadius:99 }}>
                    {a.status}
                  </span>
                  <span style={{ color:'var(--text-muted)', fontSize:18 }}>›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
