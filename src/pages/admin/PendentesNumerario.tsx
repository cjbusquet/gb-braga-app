import { useState } from 'react';
import {
  useAprovarNumerario,
  usePedidosNumerarioQuery,
  useRejeitarNumerario,
} from '../../hooks/usePedidosNumerario';

export default function PendentesNumerario() {
  const { data: pedidos = [], isLoading: loading, error, refetch } = usePedidosNumerarioQuery();
  const aprovarMutation = useAprovarNumerario();
  const rejeitarMutation = useRejeitarNumerario();
  const [modalId, setModalId] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [actionErro, setActionErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');

  const erro = actionErro ?? (error instanceof Error ? error.message : null);
  const saving = aprovarMutation.isPending || rejeitarMutation.isPending;

  const aprovar = async (id: string) => {
    setActionErro(null);
    try {
      await aprovarMutation.mutateAsync({ id, nota: nota || 'Aprovado pelo admin' });
      setModalId(null);
      setNota('');
    } catch (e) {
      setActionErro(e instanceof Error ? e.message : String(e));
    }
  };

  const rejeitar = async (id: string) => {
    setActionErro(null);
    try {
      await rejeitarMutation.mutateAsync({ id, nota: nota || 'Rejeitado' });
      setModalId(null);
      setNota('');
    } catch (e) {
      setActionErro(e instanceof Error ? e.message : String(e));
    }
  };

  const pedidoModal = pedidos.find(p => p.id === modalId);
  const filtrados = pedidos.filter(p => filtro === 'todos' || p.status === filtro);
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;

  return (
    <div>
      {/* Modal */}
      {modalId && pedidoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>Pedido de Numerário</div>
                <div style={{ color:'var(--text-primary)', fontSize:16, fontWeight:800 }}>{pedidoModal.nomeAluno}</div>
              </div>
              <button onClick={() => setModalId(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text-muted)', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginBottom:18 }}>
              {[
                ['Plano', pedidoModal.plano],
                ['Mensalidade', `€${pedidoModal.valor}/mês`],
                ['Email', pedidoModal.email],
                ['Telefone', pedidoModal.telefone],
                ['Data do pedido', pedidoModal.dataPedido],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ color:'var(--text-muted)', fontSize:12.5 }}>{k}</span>
                  <span style={{ color:'var(--text-primary)', fontSize:12.5, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'#92400E' }}>
              ⚠️ O aluno solicitou pagamento em <strong>numerário</strong> em vez de débito automático. Confirme se a excepção é justificada.
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:5 }}>Nota interna (opcional)</label>
              <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ex: familiar de aluno, situação económica, acordo verbal..." rows={2}
                style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:13, color:'var(--text-primary)', resize:'none', fontFamily:'var(--font-ui)', boxSizing:'border-box' }}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => rejeitar(pedidoModal.id)} disabled={saving}
                style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px', color:'var(--gb-red)', fontSize:13, fontWeight:700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                ✕ Rejeitar
              </button>
              <button onClick={() => aprovar(pedidoModal.id)} disabled={saving}
                style={{ flex:2, background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'11px', color:'#fff', fontSize:14, fontWeight:800, fontFamily:'var(--font-display)', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, boxShadow:'var(--shadow-red)' }}>
                {saving ? 'A processar…' : '✓ Aprovar excepção'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Super Admin</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase', display:'flex', alignItems:'center', gap:10 }}>
            Pedidos Numerário
            {pendentes > 0 && <span style={{ background:'var(--gb-red)', color:'#fff', fontSize:12, fontWeight:700, padding:'2px 9px', borderRadius:99 }}>{pendentes} pendente{pendentes!==1?'s':''}</span>}
          </h1>
        </div>
        <button onClick={() => refetch()} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 14px', color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}>
          ↻ Atualizar
        </button>
      </div>

      {erro && (
        <div style={{ background:'rgba(200,16,46,0.06)', border:'1px solid var(--gb-red-border)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'var(--gb-red)' }}>
          Erro: {erro}
        </div>
      )}

      {/* Filter */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {(['todos','pendente','aprovado','rejeitado'] as const).map(f => {
          const counts = { todos: pedidos.length, pendente: pedidos.filter(p=>p.status==='pendente').length, aprovado: pedidos.filter(p=>p.status==='aprovado').length, rejeitado: pedidos.filter(p=>p.status==='rejeitado').length };
          return (
            <button key={f} onClick={()=>setFiltro(f)} style={{ display:'flex', alignItems:'center', gap:6, background: filtro===f?'var(--gb-red)':'var(--bg-card)', border:`1px solid ${filtro===f?'var(--gb-red)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'6px 14px', cursor:'pointer', color: filtro===f?'#fff':'var(--text-secondary)', fontSize:12.5, fontWeight: filtro===f?700:400 }}>
              {f.charAt(0).toUpperCase()+f.slice(1)} <span style={{ background: filtro===f?'rgba(255,255,255,0.25)':'var(--bg-elevated)', borderRadius:99, padding:'1px 7px', fontSize:11 }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', fontSize:14 }}>A carregar…</div>
      ) : filtrados.length === 0 ? (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10, opacity:0.3 }}>💵</div>
          <div style={{ color:'var(--text-muted)', fontSize:14 }}>Sem pedidos {filtro !== 'todos' ? filtro + 's' : ''}</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtrados.map(ped => {
            const statusCfg = {
              pendente: { color:'#D97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.25)', label:'⏳ Pendente' },
              aprovado: { color:'#16A34A', bg:'rgba(22,163,74,0.08)', border:'rgba(22,163,74,0.25)', label:'✓ Aprovado' },
              rejeitado: { color:'var(--gb-red)', bg:'rgba(200,16,46,0.06)', border:'var(--gb-red-border)', label:'✕ Rejeitado' },
            }[ped.status];

            return (
              <div key={ped.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px 20px', boxShadow:'var(--shadow-xs)', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:16, fontWeight:700, flexShrink:0 }}>
                  {ped.nomeAluno.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                    <span style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700 }}>{ped.nomeAluno}</span>
                    <span style={{ background:statusCfg.bg, border:`1px solid ${statusCfg.border}`, color:statusCfg.color, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{statusCfg.label}</span>
                  </div>
                  <div style={{ color:'var(--text-muted)', fontSize:12 }}>{ped.plano} · €{ped.valor}/mês · {ped.email}</div>
                  {ped.notaAdmin && <div style={{ color:'var(--text-secondary)', fontSize:11, marginTop:3, fontStyle:'italic' }}>📝 {ped.notaAdmin}</div>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ color:'var(--text-muted)', fontSize:11, fontFamily:'var(--font-mono)', marginBottom:6 }}>{ped.dataPedido}</div>
                  {ped.status === 'pendente' && (
                    <button onClick={() => { setModalId(ped.id); setNota(''); }}
                      style={{ background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'7px 16px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>
                      Rever →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
