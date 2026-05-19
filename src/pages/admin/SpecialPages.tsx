/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useKPIs, useAlunos, usePagamentos } from '../../lib/useData';
import { revenueHistory } from '../../data/mockData';
import { exportRelatorioFinanceiro, exportRelatorioAlunos, exportCSV } from '../../lib/reportExport';

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', ...style }}>{children}</div>;
}

function Stat({ label, value, sub, accent = 'var(--gb-red)', delta }: { label: string; value: string|number; sub?: string; accent?: string; delta?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', borderTop: `3px solid ${accent}` }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 6 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {delta && <div style={{ color: accent, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{delta}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>{children}</div>;
}

function ExportBtn({ label, icon, onClick, color = 'var(--gb-red)' }: { label: string; icon: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 14px', fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
    >
      <span>{icon}</span>{label}
    </button>
  );
}

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────────
const ACADEMIAS = [
  { id: 'brg', nome: 'GB Braga',    cidade: 'Braga',    alunos: 127, receita: 11210, crescimento: +12, freq: 81, inadimp: 3,  status: 'ativa' },
  { id: 'prt', nome: 'GB Porto',    cidade: 'Porto',    alunos: 253, receita: 22340, crescimento: +8,  freq: 78, inadimp: 7,  status: 'ativa' },
  { id: 'lsb', nome: 'GB Lisboa',   cidade: 'Lisboa',   alunos: 318, receita: 28100, crescimento: +15, freq: 83, inadimp: 9,  status: 'ativa' },
  { id: 'cmb', nome: 'GB Coimbra',  cidade: 'Coimbra',  alunos: 89,  receita: 7860,  crescimento: -2,  freq: 74, inadimp: 4,  status: 'ativa' },
  { id: 'fml', nome: 'GB Famalicão',cidade: 'Famalicão',alunos: 64,  receita: 5640,  crescimento: +22, freq: 88, inadimp: 1,  status: 'nova'  },
];

const REDE_12M = [
  { m:'Jun',v:62400},{m:'Jul',v:64100},{m:'Ago',v:58700},{m:'Set',v:67300},
  { m:'Out',v:69500},{m:'Nov',v:71200},{m:'Dez',v:68900},{m:'Jan',v:72400},
  { m:'Fev',v:70100},{m:'Mar',v:74600},{m:'Abr',v:73800},{m:'Mai',v:75150},
];

export function SuperAdminDashboard() {
  useKPIs();
  useAlunos();
  usePagamentos();
  const totalAlunos  = ACADEMIAS.reduce((s,a) => s+a.alunos,0);
  const totalReceita = ACADEMIAS.reduce((s,a) => s+a.receita,0);
  const totalInadimp = ACADEMIAS.reduce((s,a) => s+a.inadimp,0);
  const maxR = Math.max(...REDE_12M.map(r => r.v));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom: 3 }}>Rede Gracie Barra Portugal</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>Super Admin</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        <Stat label="Total Alunos"  value={totalAlunos}                        accent="var(--gb-red)"   sub={`${ACADEMIAS.length} academias`}/>
        <Stat label="Receita Mensal" value={`€${totalReceita.toLocaleString()}`} accent="#16A34A"        delta="↑ +11% vs ant."/>
        <Stat label="Inadimplentes" value={totalInadimp}                        accent="#D97706"        sub="toda a rede"/>
        <Stat label="Freq. Média"   value="81%"                                 accent="#2563EB"/>
        <Stat label="NPS Rede"      value="4.8★"                                accent="#7C3AED"        sub="últimos 30 dias"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr', gap:16, marginBottom:16 }}>
        <Card style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <SectionLabel>Receita da Rede — 12 meses</SectionLabel>
            <span style={{ color:'var(--text-primary)', fontSize:16, fontWeight:800, fontFamily:'var(--font-mono)' }}>€{(totalReceita*12/1000).toFixed(0)}k/ano</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
            {REDE_12M.map((r,i) => {
              const last = i === REDE_12M.length-1;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  {last && <span style={{ fontSize:9, color:'var(--gb-red)', fontWeight:800 }}>€{(r.v/1000).toFixed(0)}k</span>}
                  <div style={{ width:'100%', background: last ? 'var(--gb-red)' : 'var(--bg-elevated)', borderRadius:'3px 3px 0 0', height:`${(r.v/maxR)*110}px`, boxShadow: last ? 'var(--shadow-red)' : 'none' }}/>
                  <span style={{ fontSize:9.5, color: last ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: last ? 700 : 400 }}>{r.m}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card style={{ padding:'20px 22px' }}>
          <SectionLabel>Receita por Academia</SectionLabel>
          {ACADEMIAS.map(a => (
            <div key={a.id} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ color:'var(--text-secondary)', fontSize:12 }}>{a.nome}</span>
                <span style={{ color:'var(--text-primary)', fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)' }}>€{a.receita.toLocaleString()}</span>
              </div>
              <div style={{ background:'var(--bg-elevated)', borderRadius:99, height:5, overflow:'hidden' }}>
                <div style={{ background: a.crescimento >= 0 ? 'var(--gb-red)' : '#D97706', height:'100%', width:`${(a.receita/ACADEMIAS[2].receita)*100}%`, opacity: 0.75 }}/>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <SectionLabel>Academias da Rede</SectionLabel>
          <button style={{ background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'7px 14px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>+ Nova Academia</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>
              {['Academia','Cidade','Alunos','Receita','Crescimento','Frequência','Inadimp.','Status',''].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACADEMIAS.map(a => (
              <tr key={a.id} style={{ borderBottom:'1px solid var(--border-subtle)', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30, height:30, background:'var(--gb-red)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🥋</div>
                    <span style={{ color:'var(--text-primary)', fontSize:13, fontWeight:700 }}>{a.nome}</span>
                  </div>
                </td>
                <td style={{ padding:'12px 14px', color:'var(--text-secondary)', fontSize:12 }}>{a.cidade}</td>
                <td style={{ padding:'12px 14px', color:'var(--text-primary)', fontSize:13, fontWeight:700 }}>{a.alunos}</td>
                <td style={{ padding:'12px 14px', color:'var(--text-primary)', fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)' }}>€{a.receita.toLocaleString()}</td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ color: a.crescimento >= 0 ? '#16A34A' : '#D97706', fontSize:12, fontWeight:700 }}>{a.crescimento >= 0 ? '↑' : '↓'} {Math.abs(a.crescimento)}%</span>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ background:'var(--bg-elevated)', borderRadius:99, height:5, width:48, overflow:'hidden' }}>
                      <div style={{ background: a.freq >= 80 ? '#16A34A' : '#D97706', height:'100%', width:`${a.freq}%` }}/>
                    </div>
                    <span style={{ color:'var(--text-secondary)', fontSize:11 }}>{a.freq}%</span>
                  </div>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ color: a.inadimp > 5 ? '#D97706' : '#16A34A', fontSize:13, fontWeight:700 }}>{a.inadimp}</span>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ background: a.status==='nova' ? 'rgba(124,58,237,0.08)' : 'rgba(22,163,74,0.08)', color: a.status==='nova' ? '#7C3AED' : '#16A34A', fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:99, textTransform:'uppercase' as const }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <button style={{ background:'var(--gb-red-glow)', border:'1px solid var(--gb-red-border)', borderRadius:5, padding:'4px 10px', color:'var(--gb-red)', fontSize:11, fontWeight:700, cursor:'pointer' }}>Gerir →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
type RTab = 'financeiro' | 'alunos' | 'frequencia' | 'retencao';

export function RelatoriosPage() {
  const { data: kpis } = useKPIs();
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const [tab, setTab] = useState<RTab>('financeiro');
  const [periodo, setPeriodo] = useState('mes');
  const [exporting, setExporting] = useState<string | null>(null);
  const maxR = Math.max(...revenueHistory.map(r => r.valor));

  const doExport = async (type: string, fn: () => void) => {
    setExporting(type);
    await new Promise(r => setTimeout(r, 300));
    fn();
    setTimeout(() => setExporting(null), 1000);
  };

  const kpiRows = [
    { label:'Taxa de Retenção',   value:`${kpis.taxaRetencao}%`,  target:'≥ 90%', ok: kpis.taxaRetencao >= 85 },
    { label:'Frequência Média',   value:`${kpis.taxaFrequencia}%`, target:'≥ 80%', ok: kpis.taxaFrequencia >= 70 },
    { label:'Inadimplência',      value:`${Math.round((kpis.inadimplentes/kpis.alunosAtivos)*100)}%`, target:'< 5%', ok: kpis.inadimplentes <= 1 },
    { label:'Novos Alunos/Mês',   value:kpis.novosAlunos,         target:'≥ 5',   ok: kpis.novosAlunos >= 3 },
    { label:'Cancelamentos/Mês',  value:kpis.cancelamentos,       target:'< 3',   ok: kpis.cancelamentos <= 2 },
    { label:'Receita vs Prevista',value:`${Math.round((kpis.receitaMensal/kpis.receitaPrevista)*100)}%`, target:'≥ 95%', ok: kpis.receitaMensal >= kpis.receitaPrevista*0.9 },
  ];

  const TABS: {id: RTab; label: string; icon: string}[] = [
    {id:'financeiro',label:'Financeiro',  icon:'💰'},
    {id:'alunos',    label:'Alunos',      icon:'👥'},
    {id:'frequencia',label:'Frequência',  icon:'📊'},
    {id:'retencao',  label:'Retenção',    icon:'🔄'},
  ];

  const BELT_BG: Record<string,string> = { branca:'#E8E7FF', cinza:'#6B7280', amarela:'#EAB308', laranja:'#EA580C', verde:'#16A34A', azul:'#1D4ED8', roxa:'#7C3AED', marrom:'#7C4A35', preta:'#111' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:3 }}>Analytics</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' as const }}>Relatórios</h1>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['semana','mes','trimestre','ano'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{ background: periodo===p ? 'var(--gb-red)' : 'var(--bg-card)', border:`1px solid ${periodo===p ? 'var(--gb-red)' : 'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'6px 12px', color: periodo===p ? '#fff' : 'var(--text-secondary)', fontSize:11.5, fontWeight: periodo===p ? 700 : 400, textTransform:'capitalize' as const, cursor:'pointer' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        {kpiRows.map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'12px 14px', borderTop:`3px solid ${k.ok ? '#16A34A' : '#D97706'}` }}>
            <div style={{ color:'var(--text-muted)', fontSize:9.5, marginBottom:4, lineHeight:1.3 }}>{k.label}</div>
            <div style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800 }}>{k.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:9.5, marginTop:2 }}>{k.target}</div>
            <div style={{ color: k.ok ? '#16A34A' : '#D97706', fontSize:10, fontWeight:700, marginTop:3 }}>{k.ok ? '✓ OK' : '⚠ Atenção'}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:'9px 14px', fontSize:13, color: tab===t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: tab===t.id ? 700 : 400, borderBottom:`2px solid ${tab===t.id ? 'var(--gb-red)' : 'transparent'}`, marginBottom:-1 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'financeiro' && (
        <div>
          {/* Export actions */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <ExportBtn icon="📄" label={exporting==='pdf-fin' ? '⟳ A gerar PDF...' : 'Exportar PDF'} onClick={() => doExport('pdf-fin', () => exportRelatorioFinanceiro(pagamentos as any))} color="var(--gb-red)"/>
            <ExportBtn icon="📊" label={exporting==='csv-fin' ? '⟳ A gerar CSV...' : 'Exportar CSV'} onClick={() => doExport('csv-fin', () => exportCSV(
              ['Aluno','Plano','Valor','Vencimento','Estado'],
              pagamentos.map(p => [p.alunoNome, p.plano, `€${p.valor}`, p.vencimento, p.status]),
              'GB_Pagamentos'
            ))} color="#16A34A"/>
            <ExportBtn icon="🧾" label="SAF-T TOConline" onClick={() => alert('SAF-T gerado via TOConline API')} color="#635BFF"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16 }}>
            <Card style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <SectionLabel>Receita Mensal</SectionLabel>
                <div style={{ textAlign:'right' as const }}>
                  <div style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-mono)' }}>€{kpis.receitaMensal.toLocaleString()}</div>
                  <div style={{ color:'#16A34A', fontSize:10.5, fontWeight:600 }}>↑ +4.2% vs mês ant.</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130 }}>
                {revenueHistory.map((r,i) => {
                  const last = i === revenueHistory.length-1;
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      <span style={{ fontSize:9.5, color: last ? 'var(--gb-red)' : 'var(--text-muted)', fontWeight: last ? 800 : 400 }}>€{(r.valor/1000).toFixed(1)}k</span>
                      <div style={{ width:'100%', background: last ? 'var(--gb-red)' : 'var(--bg-elevated)', borderRadius:'4px 4px 0 0', height:`${(r.valor/maxR)*115}px`, boxShadow: last ? 'var(--shadow-red)' : 'none' }}/>
                      <span style={{ fontSize:10.5, color: last ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: last ? 700 : 400 }}>{r.mes}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Recebido',  value:`€${pagamentos.filter(p=>p.status==='pago').reduce((s,p)=>s+p.valor,0)}`,     accent:'#16A34A', pct:'92%' },
                { label:'A Receber', value:`€${pagamentos.filter(p=>p.status==='pendente').reduce((s,p)=>s+p.valor,0)}`, accent:'#D97706', pct:'5%' },
                { label:'Vencido',   value:`€${pagamentos.filter(p=>p.status==='vencido').reduce((s,p)=>s+p.valor,0)}`,  accent:'var(--gb-red)', pct:'3%' },
              ].map(r => (
                <Card key={r.label} style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ color:'var(--text-muted)', fontSize:11 }}>{r.label}</div>
                    <div style={{ color:'var(--text-primary)', fontSize:22, fontWeight:800, fontFamily:'var(--font-mono)', marginTop:2 }}>{r.value}</div>
                  </div>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:`${r.accent}14`, border:`2px solid ${r.accent}30`, display:'flex', alignItems:'center', justifyContent:'center', color:r.accent, fontSize:12, fontWeight:800 }}>{r.pct}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'alunos' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <ExportBtn icon="📄" label={exporting==='pdf-alu' ? '⟳ A gerar...' : 'Exportar PDF'} onClick={() => doExport('pdf-alu', () => exportRelatorioAlunos(alunos as any))} color="var(--gb-red)"/>
            <ExportBtn icon="📊" label={exporting==='csv-alu' ? '⟳ A gerar...' : 'Exportar CSV'} onClick={() => doExport('csv-alu', () => exportCSV(
              ['Nome','Faixa','Grau','Plano','Frequência','Status','Matrícula'],
              alunos.map(a => [a.nome, a.faixa, a.grau, a.plano, `${a.frequencia}%`, a.status, a.dataMatricula]),
              'GB_Alunos'
            ))} color="#16A34A"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Card style={{ padding:'20px 22px' }}>
              <SectionLabel>Distribuição de Faixas</SectionLabel>
              {Object.entries(BELT_BG).map(([faixa, bg]) => {
                const count = alunos.filter(a => a.faixa === faixa).length;
                if (!count) return null;
                const pct = Math.round((count/alunos.length)*100);
                return (
                  <div key={faixa} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:20, height:7, background:bg, borderRadius:2, border: faixa==='branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                        <span style={{ color:'var(--text-secondary)', fontSize:12, textTransform:'capitalize' as const }}>{faixa}</span>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ color:'var(--text-primary)', fontSize:12, fontWeight:700 }}>{count}</span>
                        <span style={{ color:'var(--text-muted)', fontSize:11 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ background:'var(--bg-elevated)', borderRadius:99, height:5, overflow:'hidden' }}>
                      <div style={{ background: bg==='#E8E7FF' ? '#888' : bg, height:'100%', width:`${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card style={{ padding:'20px 22px' }}>
              <SectionLabel>Atividade de Matrículas</SectionLabel>
              {[
                ['Total matriculados', kpis.totalAlunos],
                ['Ativos', kpis.alunosAtivos],
                ['Inativos', kpis.totalAlunos - kpis.alunosAtivos],
                ['Novos este mês', kpis.novosAlunos],
                ['Cancelamentos', kpis.cancelamentos],
                ['Taxa de crescimento', `+${kpis.novosAlunos - kpis.cancelamentos} alunos/mês`],
              ].map(([k,v]) => (
                <div key={String(k)} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ color:'var(--text-secondary)', fontSize:13 }}>{k}</span>
                  <span style={{ color:'var(--text-primary)', fontSize:14, fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === 'frequencia' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <SectionLabel>Frequência por Aluno</SectionLabel>
              <ExportBtn icon="📊" label="CSV" onClick={() => exportCSV(['Nome','Frequência','Status'],alunos.map(a=>[a.nome,`${a.frequencia}%`,a.status]),'GB_Frequencia')} color="#16A34A"/>
            </div>
            {alunos.filter(a => a.status==='ativo').sort((a,b) => b.frequencia-a.frequencia).map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:10, fontWeight:700, flexShrink:0 }}>{a.nome.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ color:'var(--text-primary)', fontSize:12, fontWeight:500 }}>{a.nome}</span>
                    <span style={{ color: a.frequencia>=80 ? '#16A34A' : a.frequencia>=60 ? '#D97706' : 'var(--gb-red)', fontSize:11, fontWeight:700 }}>{a.frequencia}%</span>
                  </div>
                  <div style={{ background:'var(--bg-elevated)', borderRadius:99, height:4, overflow:'hidden' }}>
                    <div style={{ background: a.frequencia>=80 ? '#16A34A' : a.frequencia>=60 ? '#D97706' : 'var(--gb-red)', height:'100%', width:`${a.frequencia}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <Card style={{ padding:'20px 22px' }}>
            <SectionLabel>Frequência por Turma</SectionLabel>
            {[
              { nome:'Gi Intermediário', freq:87, checkins:156 },
              { nome:'Gi Avançado',      freq:74, checkins:111 },
              { nome:'Fundamentos',      freq:91, checkins:200 },
              { nome:'No-Gi',           freq:68, checkins:82  },
              { nome:'Kids 6-12',       freq:95, checkins:133 },
              { nome:'Wrestling',       freq:72, checkins:79  },
            ].map(t => (
              <div key={t.nome} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:'var(--text-secondary)', fontSize:12 }}>{t.nome}</span>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ color:'var(--text-muted)', fontSize:11 }}>{t.checkins} check-ins</span>
                    <span style={{ color: t.freq>=80 ? '#16A34A' : '#D97706', fontSize:11, fontWeight:700 }}>{t.freq}%</span>
                  </div>
                </div>
                <div style={{ background:'var(--bg-elevated)', borderRadius:99, height:5, overflow:'hidden' }}>
                  <div style={{ background: t.freq>=80 ? '#16A34A' : '#D97706', height:'100%', width:`${t.freq}%` }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'retencao' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Card style={{ padding:'20px 22px' }}>
            <SectionLabel>Retenção — últimos 6 meses</SectionLabel>
            {[
              {mes:'Dezembro', taxa:91},{mes:'Janeiro',taxa:88},
              {mes:'Fevereiro',taxa:90},{mes:'Março',   taxa:87},
              {mes:'Abril',    taxa:91},{mes:'Maio',    taxa:89},
            ].map((r,i) => (
              <div key={r.mes} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <span style={{ color:'var(--text-muted)', fontSize:11, width:70 }}>{r.mes}</span>
                <div style={{ flex:1, background:'var(--bg-elevated)', borderRadius:99, height:8, overflow:'hidden' }}>
                  <div style={{ background: i===5 ? 'var(--gb-red)' : 'var(--bg-hover)', height:'100%', width:`${r.taxa}%`, borderRadius:99 }}/>
                </div>
                <span style={{ color: i===5 ? 'var(--gb-red)' : 'var(--text-primary)', fontSize:12, fontWeight:700, width:32 }}>{r.taxa}%</span>
              </div>
            ))}
          </Card>
          <Card style={{ padding:'20px 22px' }}>
            <SectionLabel>Exportar Relatórios</SectionLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Relatório Financeiro — PDF',        icon:'📄', fn: () => exportRelatorioFinanceiro(pagamentos as any) },
                { label:'Relatório de Alunos — PDF',         icon:'📄', fn: () => exportRelatorioAlunos(alunos as any) },
                { label:'Pagamentos — CSV (Excel)',           icon:'📊', fn: () => exportCSV(['Aluno','Valor','Estado','Data'],pagamentos.map(p=>[p.alunoNome,p.valor,p.status,p.vencimento]),'Pagamentos') },
                { label:'Alunos — CSV (Excel)',               icon:'📊', fn: () => exportCSV(['Nome','Faixa','Plano','Freq'],alunos.map(a=>[a.nome,a.faixa,a.plano,a.frequencia]),'Alunos') },
                { label:'SAF-T PT — TOConline',               icon:'🧾', fn: () => alert('SAF-T exportado via TOConline') },
              ].map(r => (
                <button key={r.label} onClick={() => doExport(r.label, r.fn)} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px 14px', fontSize:13, color:'var(--text-primary)', fontWeight:500, cursor:'pointer', textAlign:'left' as const, transition:'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gb-red)'; e.currentTarget.style.color = 'var(--gb-red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <span style={{ fontSize:16 }}>{r.icon}</span>
                  <span>{exporting===r.label ? '⟳ A gerar...' : r.label}</span>
                  <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize:12 }}>↓</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
