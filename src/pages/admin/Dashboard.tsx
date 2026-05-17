// @ts-nocheck
import { useKPIs, useAlunos, usePagamentos, usePresencas, useTurmas } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';

function KpiCard({ label, value, sub, color = GB.red }: any) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px 20px', boxShadow:'var(--shadow-xs)' }}>
      <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ color, fontSize:28, fontWeight:800, fontFamily:'var(--font-mono)', marginBottom:4 }}>{value}</div>
      {sub && <div style={{ color:'var(--text-muted)', fontSize:11 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: kpis }      = useKPIs();
  const { data: alunos }    = useAlunos();
  const { data: pagamentos }= usePagamentos();
  const { data: presencas } = usePresencas();
  const { data: turmas }    = useTurmas();

  const hoje = new Date().toISOString().split('T')[0];
  const checkinsHoje = presencas.filter((p: any) => p.data === hoje);
  const vencidos     = pagamentos.filter((p: any) => p.status === 'vencido');
  const pendentes    = pagamentos.filter((p: any) => p.status === 'pendente');

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>
          {new Date().toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long' })}
        </div>
        <h1 style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>
          Dashboard
        </h1>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        <KpiCard label="Alunos Ativos"    value={kpis.alunosAtivos || alunos.filter((a:any)=>a.status==='ativo').length} sub="total activos" color="#22C55E"/>
        <KpiCard label="Receita Mensal"   value={`€${(kpis.receitaMensal||0).toFixed(0)}`} sub="mês corrente" color={GB.red}/>
        <KpiCard label="Check-ins Hoje"   value={checkinsHoje.length} sub="presenças hoje" color="#3B82F6"/>
        <KpiCard label="Inadimplentes"    value={vencidos.length} sub="pagamentos vencidos" color="#F59E0B"/>
        <KpiCard label="Pendente"         value={`€${pendentes.reduce((s,p)=>s+(p.valor||0),0).toFixed(0)}`} sub="a receber" color="#7C3AED"/>
        <KpiCard label="Turmas Activas"   value={turmas.length} sub="turmas" color="#06B6D4"/>
      </div>

      {/* Recent activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Recent check-ins */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>
            Últimos Check-ins
          </div>
          {presencas.slice(0,6).length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center', padding:20 }}>Sem presenças ainda</div>
          ) : presencas.slice(0,6).map((p: any) => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color:'var(--text-primary)', fontSize:12.5, fontWeight:500 }}>{p.alunoNome}</div>
                <div style={{ color:'var(--text-muted)', fontSize:11 }}>{p.turmaNome||'—'}</div>
              </div>
              <div style={{ color:'var(--text-muted)', fontSize:11, textAlign:'right', fontFamily:'var(--font-mono)' }}>
                {p.hora}<br/><span style={{ fontSize:10 }}>{p.data}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagamentos vencidos */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:12 }}>
            Pagamentos em Atraso
          </div>
          {vencidos.slice(0,6).length === 0 ? (
            <div style={{ color:'#22C55E', fontSize:12, textAlign:'center', padding:20 }}>✓ Sem pagamentos em atraso</div>
          ) : vencidos.slice(0,6).map((p: any) => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color:'var(--text-primary)', fontSize:12.5, fontWeight:500 }}>{p.alunoNome}</div>
                <div style={{ color:'var(--text-muted)', fontSize:11 }}>{p.plano||'—'}</div>
              </div>
              <div style={{ color:GB.red, fontSize:12.5, fontWeight:700 }}>€{p.valor}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
