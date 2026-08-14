/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAlunos, usePagamentos } from '../../lib/useData';
import { useKPIs } from '../../hooks/useKPIs';
import type { KPIs } from '../../types';
import { revenueHistory } from '../../data/mockData';
import { beltConfig } from '../../lib/gbBrand';
import { exportRelatorioFinanceiro, exportRelatorioAlunos, exportCSV } from '../../services/pdf';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import { SkeletonCard } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';
import Tabs from '../../components/common/Tabs';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Ico,
  XMarkIcon,
  ExclamationTriangleIcon,
  StarIcon,
  MartialArtsIcon,
  MoneyBagIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  type HeroIcon,
} from '../../lib/icons';

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Stat({ label, value, sub, accent = 'var(--gb-red)', delta }: { label: string; value: string|number|ReactNode; sub?: string; accent?: string; delta?: string }) {
  return (
    <div className="py-4 px-[18px] rounded-md border border-border bg-card">
      <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">{label}</div>
      <div className="text-2xl font-extrabold leading-none tabular-nums text-primary">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted">{sub}</div>}
      {delta && <div className="mt-1 text-[11px] font-semibold" style={{ color: accent }}>{delta}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">{children}</div>;
}

function ExportBtn({ label, icon, onClick }: { label: string; icon: HeroIcon; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex gap-2 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] font-medium rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-primary hover:border-gb-red hover:text-gb-red active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
    >
      <Ico icon={icon} sm />{label}
    </button>
  );
}

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────────
const ACADEMIAS = [
  { id: 'brg', nome: 'GB Braga', cidade: 'Braga', alunos: 127, receita: 11210, crescimento: +12, freq: 81, inadimp: 3, status: 'ativa' },
];

const REDE_12M = [
  { m:'Jun',v:62400},{m:'Jul',v:64100},{m:'Ago',v:58700},{m:'Set',v:67300},
  { m:'Out',v:69500},{m:'Nov',v:71200},{m:'Dez',v:68900},{m:'Jan',v:72400},
  { m:'Fev',v:70100},{m:'Mar',v:74600},{m:'Abr',v:73800},{m:'Mai',v:75150},
];

type Academia = typeof ACADEMIAS[0];

function NovaAcademiaModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Academia) => void }) {
  const [cidade, setCidade] = useState('');
  const [err,    setErr]    = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = cidade.trim();
    if (!c) { setErr('Indica a cidade da nova academia.'); return; }
    onAdd({
      id:          c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').slice(0, 6),
      nome:        `GB ${c}`,
      cidade:      c,
      alunos:      0, receita: 0, crescimento: 0,
      freq:        0, inadimp: 0, status: 'nova',
    });
    onClose();
  };

  return (
    <div className="flex fixed inset-0 z-[9999] justify-center items-center p-5 bg-black/60" onClick={onClose}>
      <div className="p-7 w-full max-w-[400px] rounded-lg border border-border bg-card" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="mb-1 text-[10px] font-bold tracking-[1px] uppercase text-muted">Rede Gracie Barra Portugal</div>
            <h2 className="m-0 text-base font-extrabold text-primary">+ Nova Academia</h2>
          </div>
          <button type="button" onClick={onClose} className="flex justify-center items-center p-1 min-h-11 min-w-11 leading-none bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"><Ico icon={XMarkIcon} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="mb-5">
            <label className="block mb-1.5 text-[11.5px] font-bold tracking-[0.5px] uppercase text-secondary">
              Cidade
            </label>
            <input
              value={cidade}
              onChange={e => { setCidade(e.target.value); setErr(''); }}
              placeholder="ex: Barcelos, Guimarães, Faro…"
              className={['box-border w-full py-2.5 px-3.5 min-h-11 sm:min-h-0 text-[15px] rounded-sm border outline-none transition-all duration-200 bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25', err ? 'border-gb-red' : 'border-border'].join(' ')}
              autoFocus
            />
            {err && <div className="flex gap-1 items-center mt-1 text-xs text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />{err}</div>}
            <div className="mt-1.5 text-[11.5px] text-muted">
              A academia será registada como <strong className="text-secondary">GB {cidade.trim() || '…'}</strong>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-[2]">
              Adicionar Academia
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SuperAdminDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  useAlunos();
  usePagamentos();
  const [academias, setAcademias] = useState<Academia[]>(ACADEMIAS);
  const [showNova,  setShowNova]  = useState(false);

  const totalAlunos  = academias.reduce((s,a) => s+a.alunos,0);
  const totalReceita = academias.reduce((s,a) => s+a.receita,0);
  const totalInadimp = academias.reduce((s,a) => s+a.inadimp,0);
  const maxR = Math.max(...REDE_12M.map(r => r.v));

  return (
    <div>
      {showNova && <NovaAcademiaModal onClose={() => setShowNova(false)} onAdd={a => setAcademias(prev => [...prev, a])} />}
      <PageHeader eyebrow="Rede Gracie Barra Portugal" title="Super Admin" />

      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total Alunos"  value={totalAlunos}                        accent="var(--gb-red)"   sub={`${academias.length} academias`}/>
        <Stat label="Receita Mensal" value={`€${totalReceita.toLocaleString()}`} accent="#16A34A"        delta="↑ +11% vs ant."/>
        <Stat label="Inadimplentes" value={totalInadimp}                        accent="#D97706"        sub="toda a rede"/>
        <Stat label="Freq. Média"   value="81%"                                 accent="#16A34A"/>
        <Stat label="NPS Rede"      value={<span className="flex gap-1 items-center">4.8<Ico icon={StarIcon} sm /></span>} accent="#16A34A"        sub="últimos 30 dias"/>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-[1.8fr_1fr]">
        <Card padding="none" className="py-5 px-[22px]">
          <div className="flex justify-between items-center mb-[18px]">
            <SectionLabel>Receita da Rede — 12 meses</SectionLabel>
            <span className="font-mono text-base font-extrabold text-primary">€{(totalReceita*12/1000).toFixed(0)}k/ano</span>
          </div>
          <div className="flex gap-2 items-end h-[120px]">
            {REDE_12M.map((r,i) => {
              const last = i === REDE_12M.length-1;
              return (
                <div key={i} className="flex relative flex-col flex-1 gap-1 items-center group">
                  {last && <span className="text-[9px] font-extrabold text-gb-red">€{(r.v/1000).toFixed(0)}k</span>}
                  <div
                    className={['w-full rounded-t-[3px] transition-colors', last ? 'bg-gb-red' : 'bg-gb-red/[0.18] group-hover:bg-gb-red/40'].join(' ')}
                    style={{ height: `${(r.v/maxR)*110}px` }}
                  />
                  <span className={['text-[9.5px]', last ? 'font-bold text-primary' : 'font-normal text-muted'].join(' ')}>{r.m}</span>
                  <div className="absolute bottom-full left-1/2 z-10 mb-1.5 py-1 px-2 text-[10.5px] font-semibold whitespace-nowrap rounded-sm border opacity-0 -translate-x-1/2 transition-opacity duration-150 pointer-events-none border-border bg-card text-primary group-hover:opacity-100">
                    {r.m} · €{r.v.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card padding="none" className="py-5 px-[22px]">
          <SectionLabel>Receita por Academia</SectionLabel>
          {academias.map(a => (
            <div key={a.id} className="mb-2.5">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-secondary">{a.nome}</span>
                <span className="font-mono text-xs font-bold text-primary">€{a.receita.toLocaleString()}</span>
              </div>
              <div className="overflow-hidden h-[5px] rounded-full bg-elevated">
                <div className={['h-full opacity-75', a.crescimento >= 0 ? 'bg-gb-red' : 'bg-amber-600'].join(' ')} style={{ width: `${(a.receita/Math.max(...academias.map(x=>x.receita),1))*100}%` }}/>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card padding="none">
        <div className="flex justify-between items-center py-3.5 px-[18px] border-b border-border">
          <SectionLabel>Academias da Rede</SectionLabel>
          <Button variant="primary" size="sm" onClick={() => setShowNova(true)}>+ Nova Academia</Button>
        </div>
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr className="border-b border-border-subtle bg-elevated">
              {['Academia','Cidade','Alunos','Receita','Crescimento','Frequência','Inadimp.','Status',''].map(h => (
                <th key={h} className="py-2.5 px-3.5 text-[10px] font-semibold tracking-[0.5px] text-left uppercase text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {academias.map(a => (
              <tr key={a.id} className="cursor-pointer border-b border-border-subtle hover:bg-elevated">
                <td className="py-3 px-3.5">
                  <div className="flex gap-2 items-center">
                    <div className="flex justify-center items-center w-[30px] h-[30px] rounded-md bg-gb-red"><Ico icon={MartialArtsIcon} sm className="text-white" /></div>
                    <span className="text-[13px] font-bold text-primary">{a.nome}</span>
                  </div>
                </td>
                <td className="py-3 px-3.5 text-xs text-secondary">{a.cidade}</td>
                <td className="py-3 px-3.5 text-[13px] font-bold text-primary">{a.alunos}</td>
                <td className="py-3 px-3.5 font-mono text-[13px] font-bold text-primary">€{a.receita.toLocaleString()}</td>
                <td className="py-3 px-3.5">
                  <span className={['text-xs font-bold', a.crescimento >= 0 ? 'text-green-600' : 'text-amber-600'].join(' ')}>{a.crescimento >= 0 ? '↑' : '↓'} {Math.abs(a.crescimento)}%</span>
                </td>
                <td className="py-3 px-3.5">
                  <div className="flex gap-1.5 items-center">
                    <div className="overflow-hidden w-12 h-[5px] rounded-full bg-elevated">
                      <div className={['h-full', a.freq >= 80 ? 'bg-green-600' : 'bg-amber-600'].join(' ')} style={{ width: `${a.freq}%` }}/>
                    </div>
                    <span className="text-[11px] text-secondary">{a.freq}%</span>
                  </div>
                </td>
                <td className="py-3 px-3.5">
                  <span className={['text-[13px] font-bold', a.inadimp > 5 ? 'text-amber-600' : 'text-green-600'].join(' ')}>{a.inadimp}</span>
                </td>
                <td className="py-3 px-3.5">
                  <span className={['py-0.5 px-2 text-[10.5px] font-bold uppercase rounded-full', a.status==='nova' ? 'text-amber-600 bg-amber-600/[0.08]' : 'text-green-600 bg-green-600/[0.08]'].join(' ')}>
                    {a.status}
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <button
                    onClick={() => onNavigate ? onNavigate(a.id === 'brg' ? 'alunos' : 'dashboard') : undefined}
                    className="py-1 px-2.5 min-h-11 sm:min-h-0 text-[11px] font-bold text-white rounded border-none cursor-pointer transition-colors duration-200 bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                  >Gerir →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────────
type RTab = 'financeiro' | 'alunos' | 'frequencia' | 'retencao';

const KPI_STRIP_CLASS = 'grid grid-cols-2 gap-2.5 mb-5 sm:grid-cols-3 lg:grid-cols-6';

// Presentational — RelatoriosPage fetches kpis once and passes it down here
// (it's also needed for the financeiro/alunos tab content further below).
function KpiStrip({ kpis }: { kpis: KPIs }) {
  const kpiRows = [
    { label:'Taxa de Retenção',   value:`${kpis.taxaRetencao}%`,  target:'≥ 90%', ok: kpis.taxaRetencao >= 85 },
    { label:'Frequência Média',   value:`${kpis.taxaFrequencia}%`, target:'≥ 80%', ok: kpis.taxaFrequencia >= 70 },
    { label:'Inadimplência',      value:`${Math.round((kpis.inadimplentes/kpis.alunosAtivos)*100)}%`, target:'< 5%', ok: kpis.inadimplentes <= 1 },
    { label:'Novos Alunos/Mês',   value:kpis.novosAlunos,         target:'≥ 5',   ok: kpis.novosAlunos >= 3 },
    { label:'Cancelamentos/Mês',  value:kpis.cancelamentos,       target:'< 3',   ok: kpis.cancelamentos <= 2 },
    { label:'Receita vs Prevista',value:`${Math.round((kpis.receitaMensal/kpis.receitaPrevista)*100)}%`, target:'≥ 95%', ok: kpis.receitaMensal >= kpis.receitaPrevista*0.9 },
  ];

  return (
    <div className={KPI_STRIP_CLASS}>
      {kpiRows.map(k => (
        <div key={k.label} className="py-3 px-3.5 rounded-md border border-border bg-card">
          <div className="mb-1 text-[9.5px] leading-[1.3] text-muted">{k.label}</div>
          <div className="text-xl font-extrabold text-primary">{k.value}</div>
          <div className="flex gap-1.5 items-center mt-1">
            <span className="text-[9.5px] text-muted">{k.target}</span>
            <Badge color={k.ok ? 'success' : 'warning'} className="ml-auto">{k.ok ? 'OK' : 'Atenção'}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function RelatoriosHeader({ periodo, setPeriodo }: { periodo: string; setPeriodo: (p: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3 justify-between items-start mb-5 sm:items-end">
      <div>
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Analytics</div>
        <h1 className="font-display text-[22px] font-extrabold uppercase text-primary">Relatórios</h1>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['semana','mes','trimestre','ano'].map(p => (
          <button key={p} onClick={() => setPeriodo(p)}
            className={[
              'py-1.5 px-3 min-h-11 sm:min-h-0 text-[11.5px] capitalize rounded-sm border cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              periodo===p ? 'font-bold text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'font-normal text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RelatoriosPage() {
  const toast = useToast();
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

  // kpis is undefined only during the initial fetch, and every tab here
  // reads from it (KPI strip, financeiro's Receita Mensal total, alunos'
  // Atividade de Matrículas) — so gate the whole page on it, same as the
  // `!aluno` guard in PortalAluno.tsx.
  if (!kpis) {
    return (
      <div>
        <RelatoriosHeader periodo={periodo} setPeriodo={setPeriodo} />
        <div className={KPI_STRIP_CLASS}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-[68px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <RelatoriosHeader periodo={periodo} setPeriodo={setPeriodo} />

      {/* KPI strip */}
      <KpiStrip kpis={kpis} />

      <Tabs
        tabs={[
          { id: 'financeiro', label: 'Financeiro', icon: <Ico icon={MoneyBagIcon} sm /> },
          { id: 'alunos', label: 'Alunos', icon: <Ico icon={UsersIcon} sm /> },
          { id: 'frequencia', label: 'Frequência', icon: <Ico icon={ChartBarIcon} sm /> },
          { id: 'retencao', label: 'Retenção', icon: <Ico icon={ArrowPathIcon} sm /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'financeiro' && (
        <div>
          {/* Export actions */}
          <div className="flex gap-2 mb-4">
            <ExportBtn icon={DocumentTextIcon} label={exporting==='pdf-fin' ? '⟳ A gerar PDF...' : 'Exportar PDF'} onClick={() => doExport('pdf-fin', () => exportRelatorioFinanceiro(pagamentos as any))}/>
            <ExportBtn icon={ChartBarIcon} label={exporting==='csv-fin' ? '⟳ A gerar CSV...' : 'Exportar CSV'} onClick={() => doExport('csv-fin', () => exportCSV(
              ['Aluno','Plano','Valor','Vencimento','Estado'],
              pagamentos.map(p => [p.alunoNome, p.plano, `€${p.valor}`, p.vencimento, p.status]),
              'GB_Pagamentos'
            ))}/>
            <ExportBtn icon={ReceiptPercentIcon} label="SAF-T TOConline" onClick={() => toast.success('SAF-T gerado via TOConline API')}/>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card padding="none" className="py-5 px-[22px]">
              <div className="flex justify-between items-center mb-[18px]">
                <SectionLabel>Receita Mensal</SectionLabel>
                <div className="text-right">
                  <div className="font-mono text-xl font-extrabold text-primary">€{kpis.receitaMensal.toLocaleString()}</div>
                  <div className="text-[10.5px] font-semibold text-green-600">↑ +4.2% vs mês ant.</div>
                </div>
              </div>
              <div className="flex gap-2.5 items-end h-[130px]">
                {revenueHistory.map((r,i) => {
                  const last = i === revenueHistory.length-1;
                  return (
                    <div key={i} className="flex relative flex-col flex-1 gap-1.5 items-center group">
                      <span className={['text-[9.5px]', last ? 'font-extrabold text-gb-red' : 'font-normal text-muted'].join(' ')}>€{(r.valor/1000).toFixed(1)}k</span>
                      <div
                        className={['w-full rounded-t transition-colors', last ? 'bg-gb-red' : 'bg-gb-red/[0.18] group-hover:bg-gb-red/40'].join(' ')}
                        style={{ height: `${(r.valor/maxR)*115}px` }}
                      />
                      <span className={['text-[10.5px]', last ? 'font-bold text-primary' : 'font-normal text-muted'].join(' ')}>{r.mes}</span>
                      <div className="absolute bottom-full left-1/2 z-10 mb-1.5 py-1 px-2 text-[10.5px] font-semibold whitespace-nowrap rounded-sm border opacity-0 -translate-x-1/2 transition-opacity duration-150 pointer-events-none border-border bg-card text-primary group-hover:opacity-100">
                        {r.mes} · €{r.valor.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div className="flex flex-col gap-3">
              {[
                { label:'Recebido',  value:`€${pagamentos.filter(p=>p.status==='pago').reduce((s,p)=>s+p.valor,0)}`,     accent:'#16A34A', pct:'92%' },
                { label:'A Receber', value:`€${pagamentos.filter(p=>p.status==='pendente').reduce((s,p)=>s+p.valor,0)}`, accent:'#D97706', pct:'5%' },
                { label:'Vencido',   value:`€${pagamentos.filter(p=>p.status==='vencido').reduce((s,p)=>s+p.valor,0)}`,  accent:'var(--gb-red)', pct:'3%' },
              ].map(r => (
                <Card key={r.label} padding="none" className="flex justify-between items-center py-3.5 px-4">
                  <div>
                    <div className="text-[11px] text-muted">{r.label}</div>
                    <div className="mt-0.5 font-mono text-[22px] font-extrabold text-primary">{r.value}</div>
                  </div>
                  <div
                    className="flex justify-center items-center w-11 h-11 text-xs font-extrabold rounded-full border-2"
                    style={{ background:`${r.accent}14`, borderColor:`${r.accent}30`, color:r.accent }}
                  >{r.pct}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'alunos' && (
        <div>
          <div className="flex gap-2 mb-4">
            <ExportBtn icon={DocumentTextIcon} label={exporting==='pdf-alu' ? '⟳ A gerar...' : 'Exportar PDF'} onClick={() => doExport('pdf-alu', () => exportRelatorioAlunos(alunos as any))}/>
            <ExportBtn icon={ChartBarIcon} label={exporting==='csv-alu' ? '⟳ A gerar...' : 'Exportar CSV'} onClick={() => doExport('csv-alu', () => exportCSV(
              ['Nome','Faixa','Grau','Plano','Frequência','Status','Matrícula'],
              alunos.map(a => [a.nome, a.faixa, a.grau, a.plano, `${a.frequencia}%`, a.status, a.dataMatricula]),
              'GB_Alunos'
            ))}/>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card padding="none" className="py-5 px-[22px]">
              <SectionLabel>Distribuição de Faixas</SectionLabel>
              {Object.keys(beltConfig).map((faixa) => {
                const bg = beltConfig[faixa]?.bg ?? '#888';
                const count = alunos.filter(a => a.faixa === faixa).length;
                if (!count) return null;
                const pct = Math.round((count/alunos.length)*100);
                return (
                  <div key={faixa} className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-5 h-[7px] rounded-sm" style={{ background: bg, border: faixa==='branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                        <span className="text-xs capitalize text-secondary">{faixa}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-bold text-primary">{count}</span>
                        <span className="text-[11px] text-muted">{pct}%</span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-[5px] rounded-full bg-elevated">
                      <div className="h-full" style={{ background: faixa==='branca' ? '#888' : bg, width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card padding="none" className="py-5 px-[22px]">
              <SectionLabel>Atividade de Matrículas</SectionLabel>
              {[
                ['Total matriculados', kpis.totalAlunos],
                ['Ativos', kpis.alunosAtivos],
                ['Inativos', kpis.totalAlunos - kpis.alunosAtivos],
                ['Novos este mês', kpis.novosAlunos],
                ['Cancelamentos', kpis.cancelamentos],
                ['Taxa de crescimento', `+${kpis.novosAlunos - kpis.cancelamentos} alunos/mês`],
              ].map(([k,v]) => (
                <div key={String(k)} className="flex justify-between py-2.5 border-b border-border-subtle">
                  <span className="text-[13px] text-secondary">{k}</span>
                  <span className="text-sm font-bold text-primary">{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === 'frequencia' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card padding="none" className="py-5 px-[22px]">
            <div className="flex justify-between items-center mb-3.5">
              <SectionLabel>Frequência por Aluno</SectionLabel>
              <ExportBtn icon={ChartBarIcon} label="CSV" onClick={() => exportCSV(['Nome','Frequência','Status'],alunos.map(a=>[a.nome,`${a.frequencia}%`,a.status]),'GB_Frequencia')}/>
            </div>
            {alunos.filter(a => a.status==='ativo').sort((a,b) => b.frequencia-a.frequencia).map(a => (
              <div key={a.id} className="flex gap-2.5 items-center mb-2">
                <div className="flex justify-center items-center w-[26px] h-[26px] text-[10px] font-bold rounded-full shrink-0 bg-elevated text-muted">{a.nome.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{a.nome}</span>
                    <span className={['text-[11px] font-bold', a.frequencia>=80 ? 'text-green-600' : a.frequencia>=60 ? 'text-amber-600' : 'text-gb-red'].join(' ')}>{a.frequencia}%</span>
                  </div>
                  <div className="overflow-hidden h-1 rounded-full bg-elevated">
                    <div className={['h-full', a.frequencia>=80 ? 'bg-green-600' : a.frequencia>=60 ? 'bg-amber-600' : 'bg-gb-red'].join(' ')} style={{ width: `${a.frequencia}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <Card padding="none" className="py-5 px-[22px]">
            <SectionLabel>Frequência por Turma</SectionLabel>
            {[
              { nome:'Gi Intermediário', freq:87, checkins:156 },
              { nome:'Gi Avançado',      freq:74, checkins:111 },
              { nome:'Fundamentos',      freq:91, checkins:200 },
              { nome:'No-Gi',           freq:68, checkins:82  },
              { nome:'Kids 6-12',       freq:95, checkins:133 },
              { nome:'Wrestling',       freq:72, checkins:79  },
            ].map(t => (
              <div key={t.nome} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-secondary">{t.nome}</span>
                  <div className="flex gap-2.5">
                    <span className="text-[11px] text-muted">{t.checkins} check-ins</span>
                    <span className={['text-[11px] font-bold', t.freq>=80 ? 'text-green-600' : 'text-amber-600'].join(' ')}>{t.freq}%</span>
                  </div>
                </div>
                <div className="overflow-hidden h-[5px] rounded-full bg-elevated">
                  <div className={['h-full', t.freq>=80 ? 'bg-green-600' : 'bg-amber-600'].join(' ')} style={{ width: `${t.freq}%` }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'retencao' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card padding="none" className="py-5 px-[22px]">
            <SectionLabel>Retenção — últimos 6 meses</SectionLabel>
            {[
              {mes:'Dezembro', taxa:91},{mes:'Janeiro',taxa:88},
              {mes:'Fevereiro',taxa:90},{mes:'Março',   taxa:87},
              {mes:'Abril',    taxa:91},{mes:'Maio',    taxa:89},
            ].map((r,i) => (
              <div key={r.mes} className="flex gap-3 items-center mb-2.5">
                <span className="w-[70px] text-[11px] text-muted">{r.mes}</span>
                <div className="overflow-hidden flex-1 h-2 rounded-full bg-elevated">
                  <div className={['h-full rounded-full', i===5 ? 'bg-gb-red' : 'bg-neutral-400'].join(' ')} style={{ width: `${r.taxa}%` }}/>
                </div>
                <span className={['w-8 text-xs font-bold', i===5 ? 'text-gb-red' : 'text-primary'].join(' ')}>{r.taxa}%</span>
              </div>
            ))}
          </Card>
          <Card padding="none" className="py-5 px-[22px]">
            <SectionLabel>Exportar Relatórios</SectionLabel>
            <div className="flex flex-col gap-2">
              {[
                { label:'Relatório Financeiro — PDF',        icon:DocumentTextIcon, fn: () => exportRelatorioFinanceiro(pagamentos as any) },
                { label:'Relatório de Alunos — PDF',         icon:DocumentTextIcon, fn: () => exportRelatorioAlunos(alunos as any) },
                { label:'Pagamentos — CSV (Excel)',           icon:ChartBarIcon, fn: () => exportCSV(['Aluno','Valor','Estado','Data'],pagamentos.map(p=>[p.alunoNome,p.valor,p.status,p.vencimento]),'Pagamentos') },
                { label:'Alunos — CSV (Excel)',               icon:ChartBarIcon, fn: () => exportCSV(['Nome','Faixa','Plano','Freq'],alunos.map(a=>[a.nome,a.faixa,a.plano,a.frequencia]),'Alunos') },
                { label:'SAF-T PT — TOConline',               icon:ReceiptPercentIcon, fn: () => toast.success('SAF-T exportado via TOConline') },
              ].map(r => (
                <button key={r.label} onClick={() => doExport(r.label, r.fn)}
                  className="flex gap-2.5 items-center py-2.5 px-3.5 min-h-11 text-[13px] font-medium text-left rounded-sm border cursor-pointer transition-all duration-200 border-border bg-elevated text-primary hover:border-gb-red hover:text-gb-red active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                >
                  <Ico icon={r.icon} />
                  <span>{exporting===r.label ? '⟳ A gerar...' : r.label}</span>
                  <span className="ml-auto text-xs text-muted">↓</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
