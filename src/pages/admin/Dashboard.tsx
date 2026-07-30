/* eslint-disable @typescript-eslint/no-explicit-any */
import { useKPIs, useAlunos, usePagamentos, usePresencas, useTurmas } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import Card from '../../components/common/Card';

function KpiCard({ label, value, sub, color = GB.red }: any) {
  return (
    <Card>
      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">{label}</div>
      <div className="mb-1 font-mono text-[28px] font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </Card>
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
      <div className="mb-6">
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">
          {new Date().toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long' })}
        </div>
        <h1 className="font-display text-[22px] font-extrabold uppercase text-primary">
          Dashboard
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-6">
        <KpiCard label="Alunos Ativos"    value={kpis.alunosAtivos || alunos.filter((a:any)=>a.status==='ativo').length} sub="total activos" color="#22C55E"/>
        <KpiCard label="Receita Mensal"   value={`€${(kpis.receitaMensal||0).toFixed(0)}`} sub="mês corrente" color={GB.red}/>
        <KpiCard label="Check-ins Hoje"   value={checkinsHoje.length} sub="presenças hoje" color="#3B82F6"/>
        <KpiCard label="Inadimplentes"    value={vencidos.length} sub="pagamentos vencidos" color="#F59E0B"/>
        <KpiCard label="Pendente"         value={`€${pendentes.reduce((s,p)=>s+(p.valor||0),0).toFixed(0)}`} sub="a receber" color="#7C3AED"/>
        <KpiCard label="Turmas Activas"   value={turmas.length} sub="turmas" color="#06B6D4"/>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Recent check-ins */}
        <Card>
          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Últimos Check-ins
          </div>
          {presencas.slice(0,6).length === 0 ? (
            <div className="p-5 text-xs text-center text-muted">Sem presenças ainda</div>
          ) : presencas.slice(0,6).map((p: any) => (
            <div key={p.id} className="flex justify-between py-1.5 border-b border-border-subtle">
              <div>
                <div className="text-[12.5px] font-medium text-primary">{p.alunoNome}</div>
                <div className="text-[11px] text-muted">{p.turmaNome||'—'}</div>
              </div>
              <div className="font-mono text-[11px] text-right text-muted">
                {p.hora}<br/><span className="text-[10px]">{p.data}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Pagamentos vencidos */}
        <Card>
          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Pagamentos em Atraso
          </div>
          {vencidos.slice(0,6).length === 0 ? (
            <div className="p-5 text-xs text-center text-green-500">✓ Sem pagamentos em atraso</div>
          ) : vencidos.slice(0,6).map((p: any) => (
            <div key={p.id} className="flex justify-between py-1.5 border-b border-border-subtle">
              <div>
                <div className="text-[12.5px] font-medium text-primary">{p.alunoNome}</div>
                <div className="text-[11px] text-muted">{p.plano||'—'}</div>
              </div>
              <div className="text-[12.5px] font-bold text-gb-red">€{p.valor}</div>
            </div>
          ))}
        </Card>

      </div>
    </div>
  );
}
