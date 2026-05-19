import { usePagamentos, useAlunos } from '../../lib/useData';
import { mockTocDocumentos } from '../../data/mockData';
import { useAuth } from '../../lib/auth';
import { GB } from '../../lib/gbBrand';

export default function MeuFinanceiro() {
  const { data: pagamentos } = usePagamentos();
  const { data: alunos } = useAlunos();
  const { user } = useAuth();
  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  const pags = pagamentos.filter(p => p.alunoId === aluno.id);
  const faturas = mockTocDocumentos.filter(d => d.alunoNome === aluno.nome);
  const proximo = pags.find(p => p.status === 'pendente' || p.status === 'vencido');

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Aluno</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Meu Financeiro</h1>
      </div>

      {proximo && (
        <div style={{ background: proximo.status === 'vencido' ? 'rgba(200,16,46,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${proximo.status === 'vencido' ? GB.red + '30' : 'rgba(245,158,11,0.3)'}`, borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: proximo.status === 'vencido' ? GB.red : '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              {proximo.status === 'vencido' ? '⚠️ Pagamento em atraso' : '💳 Próximo pagamento'}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>€{proximo.valor.toFixed(2)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{proximo.plano} · Vence: {proximo.vencimento}</div>
          </div>
          <button style={{ background: '#635BFF', border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 22px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,91,255,0.3)' }}>
            💳 Pagar agora
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Payments */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Histórico de Pagamentos</div>
          {pags.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{p.plano}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{p.vencimento}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€{p.valor}</div>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
                  background: p.status === 'pago' ? 'rgba(34,197,94,0.1)' : p.status === 'vencido' ? 'rgba(200,16,46,0.1)' : 'rgba(245,158,11,0.1)',
                  color: p.status === 'pago' ? '#22C55E' : p.status === 'vencido' ? GB.red : '#F59E0B'
                }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Faturas */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Minhas Faturas (TOConline)</div>
          {faturas.length > 0 ? faturas.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{f.numero}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 2 }}>{f.dataEmissao} · IVA: €{f.ivaTotal.toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€{f.valorTotal}</span>
                {f.pdfUrl && (
                  <a href={f.pdfUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, padding: '4px 8px', color: '#22C55E', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>PDF</a>
                )}
              </div>
            </div>
          )) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Nenhuma fatura emitida ainda</p>
          )}

          <div style={{ marginTop: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>ℹ️ Faturas certificadas AT</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>As faturas são emitidas automaticamente via TOConline após confirmação do pagamento Stripe.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
