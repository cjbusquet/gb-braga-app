import { useState } from 'react';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import {
  useAprovarNumerario,
  usePedidosNumerarioQuery,
  useRejeitarNumerario,
} from '../../hooks/usePedidosNumerario';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge, { type BadgeColor } from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { Ico, type HeroIcon, CheckIcon, XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon, MoneyBagIcon, PencilIcon } from '../../lib/icons';

const STATUS_CFG: Record<string, { color: BadgeColor; icon: HeroIcon; label: string }> = {
  pendente:  { color: 'warning', icon: faHourglassHalf, label: 'Pendente' },
  aprovado:  { color: 'success', icon: CheckIcon, label: 'Aprovado' },
  rejeitado: { color: 'danger',  icon: XMarkIcon, label: 'Rejeitado' },
};

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
        <Modal onClose={() => setModalId(null)} eyebrow="Pedido de Numerário" title={pedidoModal.nomeAluno}>
          <div className="p-3.5 mb-[18px] rounded-md bg-elevated">
            {[
              ['Plano', pedidoModal.plano],
              ['Mensalidade', `€${pedidoModal.valor}/mês`],
              ['Email', pedidoModal.email],
              ['Telefone', pedidoModal.telefone],
              ['Data do pedido', pedidoModal.dataPedido],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-[12.5px] text-muted">{k}</span>
                <span className="text-[12.5px] font-semibold text-primary">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 items-start p-2.5 px-3.5 mb-4 text-[12.5px] rounded-sm border border-amber-600/25 text-amber-800 bg-amber-600/[0.06]">
            <Ico icon={ExclamationTriangleIcon} sm className="shrink-0 mt-0.5" />
            <span>O aluno solicitou pagamento em <strong>numerário</strong> em vez de débito automático. Confirme se a excepção é justificada.</span>
          </div>

          <div className="mb-[18px]">
            <label className="block mb-1.5 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">Nota interna (opcional)</label>
            <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ex: familiar de aluno, situação económica, acordo verbal..." rows={2}
              className="block w-full p-2.5 px-3 font-ui text-[13px] rounded-sm border resize-none border-border bg-elevated text-primary"/>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => rejeitar(pedidoModal.id)} disabled={saving}
              className={[
                'flex-1 flex gap-1.5 justify-center items-center py-2.5 min-h-11 sm:min-h-0 text-[13px] font-bold rounded-sm border border-border bg-elevated text-gb-red',
                'transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                saving ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-red-50 active:bg-red-100',
              ].join(' ')}>
              <Ico icon={XMarkIcon} sm /> Rejeitar
            </button>
            <Button variant="primary" className="flex-[2]" loading={saving} onClick={() => aprovar(pedidoModal.id)}>
              {saving ? 'A processar…' : <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Aprovar excepção</span>}
            </Button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <PageHeader
        eyebrow="Super Admin"
        title={<>Pedidos Numerário{pendentes > 0 && <Badge color="brand">{pendentes} pendente{pendentes!==1?'s':''}</Badge>}</>}
        actions={
          <button onClick={() => refetch()} className="flex gap-1.5 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 text-xs bg-none rounded-sm border cursor-pointer border-border text-muted transition-colors duration-200 hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <Ico icon={ArrowPathIcon} sm /> Atualizar
          </button>
        }
      />

      {erro && (
        <div className="p-2.5 px-3.5 mb-4 text-[12.5px] rounded-sm border border-red-200 text-gb-red bg-gb-red/[0.06]">
          Erro: {erro}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5 mb-[18px]">
        {(['todos','pendente','aprovado','rejeitado'] as const).map(f => {
          const counts = { todos: pedidos.length, pendente: pedidos.filter(p=>p.status==='pendente').length, aprovado: pedidos.filter(p=>p.status==='aprovado').length, rejeitado: pedidos.filter(p=>p.status==='rejeitado').length };
          const active = filtro === f;
          return (
            <button key={f} onClick={()=>setFiltro(f)}
              className={[
                'flex gap-1.5 items-center py-1.5 px-3.5 text-[12.5px] rounded-sm border cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                active ? 'font-bold text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'font-normal text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
              ].join(' ')}>
              {f.charAt(0).toUpperCase()+f.slice(1)}{' '}
              <span className={['py-px px-1.5 text-[11px] rounded-full', active ? 'bg-white/25' : 'bg-elevated'].join(' ')}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="p-5 py-10 text-sm text-center text-muted">A carregar…</div>
      ) : filtrados.length === 0 ? (
        <div className="p-5 py-10 text-center rounded-lg border border-border bg-card">
          <div className="mb-2.5 opacity-30"><Ico icon={MoneyBagIcon} style={{ width: 32, height: 32 }} className="mx-auto" /></div>
          <div className="text-sm text-muted">Sem pedidos {filtro !== 'todos' ? filtro + 's' : ''}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtrados.map(ped => {
            const st = STATUS_CFG[ped.status];

            return (
              <div key={ped.id} className="flex flex-col gap-4 items-start p-[18px_20px] rounded-lg border shadow-xs border-border bg-card sm:flex-row sm:items-center">
                <div className="flex justify-center items-center w-11 h-11 text-base font-bold rounded-full shrink-0 bg-elevated text-secondary">
                  {ped.nomeAluno.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2.5 items-center mb-1">
                    <span className="text-sm font-bold text-primary">{ped.nomeAluno}</span>
                    <Badge color={st.color}><Ico icon={st.icon} sm />{st.label}</Badge>
                  </div>
                  <div className="text-xs text-muted">{ped.plano} · €{ped.valor}/mês · {ped.email}</div>
                  {ped.notaAdmin && <div className="flex gap-1.5 items-center mt-1 text-[11px] italic text-secondary"><Ico icon={PencilIcon} sm />{ped.notaAdmin}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="mb-1.5 font-mono text-[11px] text-muted">{ped.dataPedido}</div>
                  {ped.status === 'pendente' && (
                    <button onClick={() => { setModalId(ped.id); setNota(''); }}
                      className="py-1.5 px-4 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none shadow-red cursor-pointer bg-gb-red transition-colors duration-200 hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
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
