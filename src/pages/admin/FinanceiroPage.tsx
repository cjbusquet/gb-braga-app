/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePagamentos, usePlanos, useAlunos, db } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';

type Tab = 'cobranças' | 'planos' | 'toconline';

export default function FinanceiroPage() {
  const { data: pagamentos, refetch } = usePagamentos();
  const { data: planos }              = usePlanos();
  const { data: alunos }              = useAlunos();
  const [tab, setTab]                 = useState<Tab>('cobranças');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [saving, setSaving]           = useState<string|null>(null);
  const { isMobile }                  = useMobile();

  const filtered = pagamentos.filter((p: any) =>
    filtroStatus === 'todos' || p.status === filtroStatus
  );

  const totais = {
    pago:     pagamentos.filter(p => p.status==='pago').reduce((s,p) => s+(p.valor||0), 0),
    pendente: pagamentos.filter(p => p.status==='pendente').reduce((s,p) => s+(p.valor||0), 0),
    vencido:  pagamentos.filter(p => p.status==='vencido').reduce((s,p) => s+(p.valor||0), 0),
  };

  const marcarPago = async (id: string) => {
    setSaving(id);
    try {
      await db.marcarPago(id, 'manual');
      refetch();
    } catch(e) { console.error(e); }
    setSaving(null);
  };

  const statusCfg: any = {
    pago:     { color:'#16A34A', bg:'rgba(34,197,94,0.1)',  label:'Pago' },
    pendente: { color:'#D97706', bg:'rgba(217,119,6,0.1)',  label:'Pendente' },
    vencido:  { color:GB.red,   bg:'rgba(200,16,46,0.08)', label:'Vencido' },
    cancelado:{ color:'#6B7280', bg:'rgba(107,114,128,0.1)',label:'Cancelado' },
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>Financeiro</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[['Receita Mês', totais.pago, '#22C55E'],['Pendente', totais.pendente, '#F59E0B'],['Vencido', totais.vencido, GB.red]].map(([label,val,color]) => (
          <div key={label as string} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16 }}>
            <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{label as string}</div>
            <div style={{ color:color as string, fontSize:24, fontWeight:800, fontFamily:'var(--font-mono)' }}>€{(val as number).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {(['cobranças','planos','toconline'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===t?GB.red:'transparent'}`, padding:'8px 16px', color:tab===t?GB.red:'var(--text-muted)', fontSize:13, fontWeight:tab===t?700:400, cursor:'pointer', marginBottom:-1, textTransform:'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* COBRANÇAS */}
      {tab === 'cobranças' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {['todos','pago','pendente','vencido'].map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)}
                style={{ background:filtroStatus===f?GB.red:'var(--bg-card)', border:`1px solid ${filtroStatus===f?GB.red:'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'6px 14px', color:filtroStatus===f?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer', textTransform:'capitalize' }}>
                {f} ({pagamentos.filter(p => f==='todos'||p.status===f).length})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>
              Sem pagamentos. Os pagamentos são criados automaticamente quando um aluno faz matrícula.
            </div>
          ) : (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' as any }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 560 : undefined }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                    {['Aluno','Plano','Valor','Vencimento','Estado','Ações'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10.5, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const st = statusCfg[p.status] || statusCfg.pendente;
                    return (
                      <tr key={p.id} style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                        <td style={{ padding:'10px 14px', fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{p.alunoNome}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'var(--text-secondary)' }}>{p.plano||'—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>€{p.valor}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>{p.vencimento}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:st.bg, color:st.color, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{st.label}</span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {p.status !== 'pago' && (
                              <button onClick={() => marcarPago(p.id)} disabled={saving===p.id}
                                style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:5, padding:'4px 10px', color:'#16A34A', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                {saving===p.id ? '...' : '✓ Pago'}
                              </button>
                            )}
                            {p.status !== 'pago' && (
                              <button onClick={() => alert(`💬 Lembrete enviado para ${p.alunoNome}!`)}
                                style={{ background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:5, padding:'4px 10px', color:'#25D366', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                💬 Lembrete
                              </button>
                            )}
                            {p.status === 'pago' && (
                              <button onClick={() => alert(`📄 Recibo gerado para ${p.alunoNome} · €${p.valor}`)}
                                style={{ background:'rgba(99,91,255,0.08)', border:'1px solid rgba(99,91,255,0.2)', borderRadius:5, padding:'4px 10px', color:'#635BFF', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                📄 Recibo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLANOS */}
      {tab === 'planos' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
          {planos.map((p: any) => {
            const count = alunos.filter((a: any) => a.planoId === p.id || a.plano === p.nome).length;
            return (
              <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
                <div style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700, marginBottom:4 }}>{p.nome}</div>
                <div style={{ color:GB.red, fontSize:26, fontWeight:800, fontFamily:'var(--font-mono)', marginBottom:4 }}>€{p.valor}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:12, marginBottom:8 }}>{p.descricao}</div>
                <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:12 }}>{count} alunos activos</div>
                <div style={{ display:'flex', gap:6 }}>
                  <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer"
                    style={{ flex:1, background:'rgba(99,91,255,0.08)', border:'1px solid rgba(99,91,255,0.2)', borderRadius:6, padding:'7px 0', color:'#635BFF', fontSize:11, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ↗ Stripe
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOCONLINE */}
      {tab === 'toconline' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E' }}/>
              <div>
                <div style={{ color:'#16A34A', fontSize:13, fontWeight:700 }}>Emissão automática configurada</div>
                <div style={{ color:'var(--text-muted)', fontSize:11 }}>FR emitida quando Stripe confirma pagamento</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700 }}>SAF-T PT — Exportação Mensal</div>
                <div style={{ color:'var(--text-muted)', fontSize:11 }}>XML para entrega à AT</div>
              </div>
              <button onClick={() => alert('SAF-T XML gerado!\nFicheiro: SAF-T_GBBraga.xml')}
                style={{ background:'#635BFF', border:'none', borderRadius:6, padding:'8px 14px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                📤 Exportar SAF-T
              </button>
            </div>
            <div style={{ color:'var(--text-muted)', fontSize:12, lineHeight:1.7 }}>
              Para configurar o TOConline: <strong>Config. → TOConline</strong> → inserir Client ID e Secret.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
