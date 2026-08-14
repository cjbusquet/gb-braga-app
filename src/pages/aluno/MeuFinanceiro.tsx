import { usePagamentos, useAlunos } from '../../lib/useData';
import { ACADEMIA, mockTocDocumentos } from '../../data/mockData';
import { useAuth } from '../../lib/auth';
import { CreditCardIcon, ExclamationTriangleIcon, Ico } from '../../lib/icons';
import PortalPageHeader from './PortalPageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SkeletonList } from '../../components/common/Skeleton';

export default function MeuFinanceiro() {
  const { data: pagamentos } = usePagamentos();
  const { data: alunos } = useAlunos();
  const { user } = useAuth();
  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  if (!aluno) return <SkeletonList rows={4} />;

  const pags = pagamentos.filter(p => p.alunoId === aluno.id);
  const faturas = mockTocDocumentos.filter(d => d.alunoNome === aluno.nome);
  const proximo = pags.find(p => p.status === 'pendente' || p.status === 'vencido');

  const statusBadgeColor = (status: string) =>
    status === 'pago' ? 'success' : status === 'vencido' ? 'danger' : 'warning';

  return (
    <div>
      <PortalPageHeader
        title="Meu Financeiro"
        description="Consulta pagamentos, faturas e os próximos vencimentos."
      />

      {proximo && (
        <div
          className={[
            'flex justify-between items-center p-5 mb-4 rounded-lg border',
            proximo.status === 'vencido' ? 'border-gb-red/30 bg-gb-red/8' : 'border-amber-500/30 bg-amber-500/8',
          ].join(' ')}
        >
          <div>
            <div className={['mb-1 text-xs font-bold', proximo.status === 'vencido' ? 'text-gb-red' : 'text-amber-500'].join(' ')}>
              <span className="inline-flex gap-1.5 items-center"><Ico icon={proximo.status === 'vencido' ? ExclamationTriangleIcon : CreditCardIcon} sm />{proximo.status === 'vencido' ? 'Pagamento em atraso' : 'Próximo pagamento'}</span>
            </div>
            <div className="font-mono text-2xl font-extrabold text-primary">€{proximo.valor.toFixed(2)}</div>
            <div className="mt-1 text-xs text-muted">{proximo.plano} · Vence: {proximo.vencimento}</div>
          </div>
          <a
            href={`https://wa.me/${ACADEMIA.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostava de regularizar o pagamento de €${proximo.valor.toFixed(2)} (${proximo.plano}, venc. ${proximo.vencimento}).`)}`}
            target="_blank" rel="noreferrer"
            className="inline-flex gap-1.5 items-center py-3 px-[22px] text-[13px] font-bold text-white no-underline rounded-md border-none cursor-pointer bg-[#635BFF] transition-all duration-200 hover:bg-[#5851E6] active:scale-[0.98] active:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2"
          >
            <Ico icon={CreditCardIcon} sm />Pagar agora
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Payments */}
        <Card padding="lg">
          <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Histórico de Pagamentos</div>
          {pags.map(p => (
            <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-border-subtle">
              <div>
                <div className="text-[13px] font-medium text-primary">{p.plano}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted">{p.vencimento}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-bold text-primary">€{p.valor}</div>
                <Badge color={statusBadgeColor(p.status)}>{p.status}</Badge>
              </div>
            </div>
          ))}
        </Card>

        {/* Faturas */}
        <Card padding="lg">
          <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Minhas Faturas (TOConline)</div>
          {faturas.length > 0 ? faturas.map(f => (
            <div key={f.id} className="flex justify-between items-center py-2.5 border-b border-border-subtle">
              <div>
                <div className="font-mono text-[12.5px] font-bold text-primary">{f.numero}</div>
                <div className="mt-0.5 text-[10.5px] text-muted">{f.dataEmissao} · IVA: €{f.ivaTotal.toFixed(2)}</div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-mono text-[13px] font-bold text-primary">€{f.valorTotal}</span>
                {f.pdfUrl && (
                  <a href={f.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center py-1 px-2 text-[11px] font-semibold text-green-500 no-underline rounded border transition-colors duration-200 border-green-500/20 bg-green-500/10 hover:bg-green-500/20 active:bg-green-500/20 outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">PDF</a>
                )}
              </div>
            </div>
          )) : (
            <p className="mt-5 text-[13px] text-center text-muted">Nenhuma fatura emitida ainda</p>
          )}

          <div className="p-2.5 px-3 mt-4 rounded-sm border border-border bg-elevated">
            <div className="mb-0.5 text-[11px] font-semibold text-secondary">Faturas certificadas AT</div>
            <div className="text-[11px] leading-[1.5] text-muted">As faturas são emitidas automaticamente via TOConline após confirmação do pagamento Stripe.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
