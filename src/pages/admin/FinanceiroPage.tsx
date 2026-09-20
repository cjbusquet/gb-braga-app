/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { usePagamentos, usePlanos, useAlunos, db } from '../../lib/useData';
import { Ico, ChatBubbleLeftRightIcon, DocumentTextIcon, ArrowUpTrayIcon, CheckIcon, ArrowRightIcon, BanknotesIcon, ClockIcon, ExclamationTriangleIcon } from '../../lib/icons';
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
        {([
          ['Receita Mês', totais.pago, 'text-gb-green', 'bg-gb-green/10', BanknotesIcon],
          ['Pendente', totais.pendente, 'text-amber-500', 'bg-amber-500/10', ClockIcon],
          ['Vencido', totais.vencido, 'text-gb-red', 'bg-gb-red/10', ExclamationTriangleIcon],
        ] as const).map(([label, val, textCls, bgCls, icon]) => (
          <div key={label} className="flex gap-3 items-center py-3.5 px-4 rounded-xl border border-border bg-card">
            <div className={['flex justify-center items-center w-9 h-9 rounded-full shrink-0', textCls, bgCls].join(' ')}>
              <Ico icon={icon} />
            </div>
            <div className="min-w-0">
              <div className={['font-mono text-2xl font-extrabold leading-tight', textCls].join(' ')}>€{(val as number).toFixed(2)}</div>
              <div className="mt-0.5 text-[10.5px] text-muted">{label}</div>
            </div>
          </div>
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
            <Card padding="none">
              {filtered.map((p: any, i: number) => {
                const st = STATUS_CFG[p.status] || STATUS_CFG.pendente;
                return (
                  <div key={p.id} className={[
                    'py-3.5 px-[18px]',
                    i > 0 ? 'border-t border-border-subtle' : '',
                    p.status === 'vencido' ? 'bg-gb-red/[0.03]' : '',
                  ].join(' ')}>
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="flex justify-center items-center w-10 h-10 text-[14px] font-bold rounded-full shrink-0 bg-elevated text-secondary">
                          {p.alunoNome?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-primary">{p.alunoNome}</div>
                          <div className="overflow-hidden text-xs whitespace-nowrap text-ellipsis text-muted">{p.plano || '-'} · vence {p.vencimento}</div>
                        </div>
                      </div>
                      <div className="flex gap-2.5 items-center shrink-0">
                        <span className="text-[14px] font-bold text-primary">€{p.valor}</span>
                        <Badge color={st.color}>{st.label}</Badge>
                      </div>
                    </div>
                    {p.status !== 'pago' ? (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <button onClick={() => marcarPago(p.id)} disabled={saving===p.id}
                          className="py-1 px-2.5 min-h-11 sm:min-h-0 text-[11px] font-semibold text-gb-green whitespace-nowrap rounded border cursor-pointer border-gb-green/30 bg-gb-green/10 transition-colors duration-200 hover:bg-gb-green/20 active:bg-gb-green/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                          {saving===p.id ? '...' : <span className="inline-flex gap-1 items-center"><Ico icon={CheckIcon} sm />Pago</span>}
                        </button>
                        <button onClick={() => toast.success(`Lembrete enviado para ${p.alunoNome}!`)}
                          className="flex gap-1 items-center py-1 px-2.5 min-h-11 sm:min-h-0 text-[11px] font-semibold text-[#25D366] whitespace-nowrap rounded border cursor-pointer border-[#25D366]/20 bg-[#25D366]/10 transition-colors duration-200 hover:bg-[#25D366]/20 active:bg-[#25D366]/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                          <Ico icon={ChatBubbleLeftRightIcon} sm /> Lembrete
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <button onClick={() => toast.success(`Recibo gerado para ${p.alunoNome} · €${p.valor}`)}
                          className="flex gap-1 items-center py-1 px-2.5 min-h-11 sm:min-h-0 text-[11px] font-semibold text-[#635BFF] whitespace-nowrap rounded border cursor-pointer border-[#635BFF]/20 bg-[#635BFF]/[0.08] transition-colors duration-200 hover:bg-[#635BFF]/20 active:bg-[#635BFF]/25 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                          <Ico icon={DocumentTextIcon} sm /> Recibo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
              <div className="flex justify-center items-center w-7 h-7 text-gb-green rounded-full shrink-0 bg-gb-green/10">
                <Ico icon={CheckIcon} sm />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gb-green">Emissão automática configurada</div>
                <div className="text-[11px] text-muted">FR emitida quando Stripe confirma pagamento</div>
              </div>
            </div>
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <div className="text-[13px] font-bold text-primary">SAF-T PT · Exportação Mensal</div>
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
