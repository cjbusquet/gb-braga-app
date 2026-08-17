/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useContratos } from '../../lib/useData';
import { exportContratoPDF } from '../../services/pdf';
import Badge, { type BadgeColor } from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { Ico, DocumentIcon, CheckIcon, ArrowDownTrayIcon } from '../../lib/icons';

const STATUS_CFG: Record<string, { color: BadgeColor; label: string }> = {
  ativo:     { color: 'success', label: 'Ativo' },
  cancelado: { color: 'danger',  label: 'Cancelado' },
  expirado:  { color: 'neutral', label: 'Expirado' },
};

export default function ContratosPage() {
  const { data: contratos } = useContratos();
  const [filtro, setFiltro] = useState('todos');

  const filtered = contratos.filter((c: any) => filtro === 'todos' || c.status === filtro);

  const baixarPDF = (c: any) => {
    exportContratoPDF({
      alunoNome:      c.alunoNome,
      alunoNif:       c.alunoNif || '',
      plano:          c.plano,
      valor:          c.valor,
      dataAssinatura: c.dataAssinatura ? c.dataAssinatura.slice(0, 10) : c.dataInicio || '',
      dataInicio:     c.dataInicio || '',
      assinaturaImg:  c.assinaturaImg || null,
    });
  };

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Contratos" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['todos','ativo','cancelado','expirado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={[
              'py-1.5 px-3.5 text-[12.5px] capitalize rounded-sm border cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              filtro === f
                ? 'text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark'
                : 'text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            {f} ({contratos.filter((c:any) => f==='todos'||c.status===f).length})
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-muted">
          <div className="mb-2 opacity-50"><Ico icon={DocumentIcon} style={{ width: 28, height: 28 }} className="mx-auto" /></div>
          <div>Sem contratos. Os contratos são criados automaticamente no fluxo de matrícula.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Aluno','Plano','Início','Válido até','Valor','Estado','Assinado',''].map(h => (
                  <th key={h} className="py-2.5 px-3.5 text-[10.5px] font-semibold tracking-[0.5px] text-left uppercase whitespace-nowrap text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any, i: number) => {
                const st = STATUS_CFG[c.status] || STATUS_CFG.ativo;
                return (
                  <tr key={c.id} className={['border-b border-border-subtle', i % 2 === 0 ? 'bg-transparent' : 'bg-elevated'].join(' ')}>
                    <td className="py-2.5 px-3.5 text-[13px] font-medium whitespace-nowrap text-primary">{c.alunoNome}</td>
                    <td className="py-2.5 px-3.5 text-[13px] whitespace-nowrap text-secondary">{c.plano||'—'}</td>
                    <td className="py-2.5 px-3.5 font-mono text-xs whitespace-nowrap text-secondary">{c.dataInicio||'—'}</td>
                    <td className={['py-2.5 px-3.5 font-mono text-xs whitespace-nowrap', c.status === 'ativo' ? 'text-gb-green' : 'text-muted'].join(' ')}>{c.status==='ativo'?'Em vigor':c.dataFim||'—'}</td>
                    <td className="py-2.5 px-3.5 text-[13px] font-bold whitespace-nowrap text-primary">€{c.valor}</td>
                    <td className="py-2.5 px-3.5">
                      <Badge color={st.color}>{st.label}</Badge>
                    </td>
                    <td className={['py-2.5 px-3.5 text-[13px] whitespace-nowrap', c.assinado ? 'text-gb-green' : 'text-muted'].join(' ')}>{c.assinado ? <span className="inline-flex gap-1 items-center"><Ico icon={CheckIcon} sm />Sim</span> : '—'}</td>
                    <td className="py-2.5 px-3.5">
                      {c.assinado && (
                        <button onClick={() => baixarPDF(c)}
                          title="Descarregar contrato assinado em PDF"
                          className="inline-flex gap-1.5 items-center py-1.5 px-2.5 text-[11.5px] font-semibold whitespace-nowrap bg-none rounded-sm border cursor-pointer border-border text-secondary transition-colors duration-200 hover:bg-elevated hover:text-primary active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                          <Ico icon={ArrowDownTrayIcon} sm /> PDF
                        </button>
                      )}
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
  );
}
