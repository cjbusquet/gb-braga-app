// @ts-nocheck
import { useState } from 'react';
import { useContratos, useAlunos, usePlanos } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';

export default function ContratosPage() {
  const { data: contratos, refetch } = useContratos();
  const { data: alunos }             = useAlunos();
  const { data: planos }             = usePlanos();
  const [filtro, setFiltro]          = useState('todos');
  const [showNovo, setShowNovo]      = useState(false);

  const filtered = contratos.filter((c: any) => filtro === 'todos' || c.status === filtro);

  const statusCfg: any = {
    ativo:     { color:'#16A34A', bg:'rgba(34,197,94,0.1)',  label:'Ativo' },
    cancelado: { color:GB.red,    bg:'rgba(200,16,46,0.08)', label:'Cancelado' },
    expirado:  { color:'#6B7280', bg:'rgba(107,114,128,0.1)',label:'Expirado' },
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>Contratos</h1>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['todos','ativo','cancelado','expirado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ background:filtro===f?GB.red:'var(--bg-card)', border:`1px solid ${filtro===f?GB.red:'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'7px 14px', color:filtro===f?'#fff':'var(--text-secondary)', fontSize:12.5, cursor:'pointer', textTransform:'capitalize' }}>
            {f} ({contratos.filter((c:any) => f==='todos'||c.status===f).length})
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
          <div>Sem contratos. Os contratos são criados automaticamente no fluxo de matrícula.</div>
        </div>
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                {['Aluno','Plano','Início','Válido até','Valor','Estado','Assinado'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10.5, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any, i: number) => {
                const st = statusCfg[c.status] || statusCfg.ativo;
                return (
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border-subtle)', background: i%2===0?'transparent':'var(--bg-elevated)' }}>
                    <td style={{ padding:'11px 14px', fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{c.alunoNome}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, color:'var(--text-secondary)' }}>{c.plano||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>{c.dataInicio||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color: c.status==='ativo'?'#16A34A':'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{c.status==='ativo'?'Em vigor':c.dataFim||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>€{c.valor}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:st.bg, color:st.color, fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{st.label}</span>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:13, color: c.assinado?'#16A34A':'var(--text-muted)' }}>{c.assinado?'✓ Sim':'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
