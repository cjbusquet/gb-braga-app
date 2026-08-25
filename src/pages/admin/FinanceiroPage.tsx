/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { usePagamentos, usePlanos, useAlunos, db } from '../../lib/useData';
import { Ico, ChatBubbleLeftRightIcon, DocumentTextIcon, ArrowUpTrayIcon, CheckIcon, ArrowRightIcon } from '../../lib/icons';
import Card from '../../components/common/Card';
import Badge, { type BadgeColor } from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/common/Tabs';
import { useToast } from '../../components/common/Toast';

type Tab = 'cobranças' | 'planos' | 'toconline';

const STATUS_CFG: Record<string, { color: BadgeColor; label: string }> = {
  pago:      { color: 'success', label: 'Pago' },
  pendente:  { color: 'warning', label: 'Pendente' },
  vencido:   { color: 'danger',  label: 'Vencido' },
  cancelado: { color: 'neutral', label: 'Cancelado' },
};

export default function FinanceiroPage() {
  const toast = useToast();
  const { data: pagamentos, refetch } = usePagamentos();
  const { data: planos }              = usePlanos();
  const { data: alunos }              = useAlunos();
  const [tab, setTab]                 = useState<Tab>('cobranças');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [saving, setSaving]           = useState<string|null>(null);

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

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Financeiro" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 mb-5 md:grid-cols-3">
        {([['Receita Mês', totais.pago, '#22C55E'],['Pendente', totais.pendente, '#F59E0B'],['Vencido', totais.vencido, 'var(--gb-red)']] as const).map(([label,val,color]) => (
          <Card key={label}>
            <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">{label}</div>
            <div className="font-mono text-2xl font-extrabold" style={{ color }}>€{(val as number).toFixed(2)}</div>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: 'cobranças', label: 'Cobranças' },
          { id: 'planos', label: 'Planos' },
          { id: 'toconline', label: 'TOConline' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* COBRANÇAS */}
      {tab === 'cobranças' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-3.5">
            {['todos','pago','pendente','vencido'].map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)}
                className={[
                  'py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] capitalize rounded-sm border cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  filtroStatus === f
                    ? 'text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark'
                    : 'text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
                ].join(' ')}>
                {f} ({pagamentos.filter(p => f==='todos'||p.status===f).length})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-muted">
              Sem pagamentos. Os pagamentos são criados automaticamente quando um aluno faz matrícula.
            </div>
          ) : (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Aluno','Plano','Valor','Vencimento','Estado','Ações'].map(h => (
                      <th key={h} className="py-2.5 px-3.5 text-[10.5px] font-semibold text-left uppercase whitespace-nowrap text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const st = STATUS_CFG[p.status] || STATUS_CFG.pendente;
                    return (
                      <tr key={p.id} className="border-b border-border-subtle">
                        <td className="py-2.5 px-3.5 text-[13px] font-medium whitespace-nowrap text-primary">{p.alunoNome}</td>
                        <td className="py-2.5 px-3.5 text-xs whitespace-nowrap text-secondary">{p.plano||'—'}</td>
                        <td className="py-2.5 px-3.5 text-[13px] font-bold whitespace-nowrap text-primary">€{p.valor}</td>
                        <td className="py-2.5 px-3.5 font-mono text-xs whitespace-nowrap text-secondary">{p.vencimento}</td>
                        <td className="py-2.5 px-3.5">
                          <Badge color={st.color}>{st.label}</Badge>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {p.status !== 'pago' && (
                              <button onClick={() => marcarPago(p.id)} disabled={saving===p.id}
                                className="py-1 px-2.5 text-[11px] font-semibold text-gb-green whitespace-nowrap rounded border cursor-pointer border-gb-green/30 bg-gb-green/10 transition-colors duration-200 hover:bg-gb-green/20 active:bg-gb-green/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                                {saving===p.id ? '...' : <span className="inline-flex gap-1 items-center"><Ico icon={CheckIcon} sm />Pago</span>}
                              </button>
                            )}
                            {p.status !== 'pago' && (
                              <button onClick={() => toast.success(`Lembrete enviado para ${p.alunoNome}!`)}
                                className="flex gap-1 items-center py-1 px-2.5 text-[11px] font-semibold text-[#25D366] whitespace-nowrap rounded border cursor-pointer border-[#25D366]/20 bg-[#25D366]/10 transition-colors duration-200 hover:bg-[#25D366]/20 active:bg-[#25D366]/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                                <Ico icon={ChatBubbleLeftRightIcon} sm /> Lembrete
                              </button>
                            )}
                            {p.status === 'pago' && (
                              <button onClick={() => toast.success(`Recibo gerado para ${p.alunoNome} · €${p.valor}`)}
                                className="flex gap-1 items-center py-1 px-2.5 text-[11px] font-semibold text-[#635BFF] whitespace-nowrap rounded border cursor-pointer border-[#635BFF]/20 bg-[#635BFF]/[0.08] transition-colors duration-200 hover:bg-[#635BFF]/20 active:bg-[#635BFF]/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                                <Ico icon={DocumentTextIcon} sm /> Recibo
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
            </Card>
          )}
        </div>
      )}

      {/* PLANOS */}
      {tab === 'planos' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {planos.map((p: any) => {
            const count = alunos.filter((a: any) => a.planoId === p.id || a.plano === p.nome).length;
            return (
              <Card key={p.id}>
                <div className="mb-1 text-sm font-bold text-primary">{p.nome}</div>
                <div className="mb-1 font-mono text-2xl font-extrabold text-gb-red">€{p.valor}</div>
                <div className="mb-2 text-xs text-secondary">{p.descricao}</div>
                <div className="mb-3 text-[11px] text-muted">{count} alunos activos</div>
                <div className="flex gap-1.5">
                  <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer"
                    className="flex flex-1 gap-1.5 justify-center items-center py-1.5 min-h-11 sm:min-h-0 text-[11px] font-semibold text-[#635BFF] no-underline rounded border border-[#635BFF]/20 bg-[#635BFF]/[0.08] transition-colors duration-200 hover:bg-[#635BFF]/20 active:bg-[#635BFF]/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                    <Ico icon={faArrowUpRightFromSquare} sm /> Stripe
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TOCONLINE */}
      {tab === 'toconline' && (
        <div className="max-w-[600px]">
          <Card padding="lg">
            <div className="flex gap-2.5 items-center pb-3.5 mb-4 border-b border-border-subtle">
              <div className="w-2 h-2 bg-gb-green rounded-full"/>
              <div>
                <div className="text-[13px] font-bold text-gb-green">Emissão automática configurada</div>
                <div className="text-[11px] text-muted">FR emitida quando Stripe confirma pagamento</div>
              </div>
            </div>
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <div className="text-[13px] font-bold text-primary">SAF-T PT — Exportação Mensal</div>
                <div className="text-[11px] text-muted">XML para entrega à AT</div>
              </div>
              <button onClick={() => toast.success('SAF-T XML gerado! Ficheiro: SAF-T_GBBraga.xml')}
                className="flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded border-none cursor-pointer bg-[#635BFF] transition-colors duration-200 hover:bg-[#5147e0] active:bg-[#4038c9] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                <Ico icon={ArrowUpTrayIcon} sm /> Exportar SAF-T
              </button>
            </div>
            <div className="inline-flex flex-wrap gap-1.5 items-center text-xs leading-[1.7] text-muted">
              Para configurar o TOConline: <strong className="inline-flex gap-1.5 items-center">Config. <Ico icon={ArrowRightIcon} sm />TOConline</strong> <Ico icon={ArrowRightIcon} sm />inserir Client ID e Secret.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
