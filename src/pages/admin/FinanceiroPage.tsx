import { useState, useCallback } from 'react';
import { mockPagamentos, mockPlanos, mockTocDocumentos, defaultTocConfig, mockAlunos } from '../../data/mockData';
import { emitirFatura, buildMensalidadePayload } from '../../lib/toconline';
import { GB } from '../../lib/gbBrand';
import type { Pagamento, TocDocumento, TocConfig } from '../../types';

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 12 }}>{children}</div>;
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ background: bg, color, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.3px' }}>{children}</span>;
}

function StatusBadge({ status }: { status: Pagamento['status'] }) {
  const m = {
    pago:      { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
    pendente:  { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B' },
    vencido:   { bg: 'rgba(200,16,46,0.12)',    color: GB.red },
    cancelado: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  };
  const s = m[status];
  return <Badge color={s.color} bg={s.bg}>{status.toUpperCase()}</Badge>;
}

function TocBadge({ estado }: { estado: TocDocumento['estado'] }) {
  const m = {
    emitida:  { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'EMITIDA' },
    enviada:  { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', label: 'ENVIADA' },
    erro:     { bg: 'rgba(200,16,46,0.12)',  color: GB.red,    label: 'ERRO' },
  };
  const s = m[estado];
  return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

type Tab = 'cobrancas' | 'toconline' | 'planos' | 'stripe' | 'config';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'cobrancas', label: 'Cobranças',   icon: '📋' },
  { id: 'toconline', label: 'TOConline',   icon: '🧾' },
  { id: 'planos',    label: 'Planos',      icon: '📦' },
  { id: 'stripe',    label: 'Stripe',      icon: '💳' },
  { id: 'config',    label: 'Configuração',icon: '⚙' },
];

// ─── Emissão de Fatura modal ──────────────────────────────────────────────────

function EmitirFaturaModal({
  pagamento,
  tocConfig,
  onClose,
  onSuccess,
}: {
  pagamento: Pagamento;
  tocConfig: TocConfig;
  onClose: () => void;
  onSuccess: (doc: TocDocumento) => void;
}) {
  const aluno = mockAlunos.find(a => a.id === pagamento.alunoId);
  const [nif, setNif] = useState(aluno?.cpf || '');
  const [metodo, setMetodo] = useState<'CC' | 'TB' | 'MO'>('CC');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [result, setResult] = useState<TocDocumento | null>(null);

  // Preços incluem IVA 23% — extrair a base tributável
  const valorSemIVA = Math.round((pagamento.valor / 1.23) * 100) / 100;
  const iva = Math.round((pagamento.valor - valorSemIVA) * 100) / 100;

  const handleEmitir = async () => {
    setStep('loading');
    setLoading(true);

    const payload = buildMensalidadePayload(
      pagamento.alunoNome,
      pagamento.plano,
      pagamento.valor,
      nif || undefined,
      pagamento.stripePaymentId,
    );
    payload.payment_mechanism = metodo;

    const res = await emitirFatura(tocConfig, payload, tocConfig.simulationMode);
    setLoading(false);

    if (res.status === 'success') {
      const doc: TocDocumento = {
        id: res.id,
        numero: res.document_number,
        tipo: 'FR',
        dataEmissao: new Date().toISOString().split('T')[0],
        valorTotal: pagamento.valor,
        ivaTotal: iva,
        valorSemIVA,
        pdfUrl: res.pdf_url,
        stripePaymentId: pagamento.stripePaymentId,
        alunoNome: pagamento.alunoNome,
        plano: pagamento.plano,
        estado: 'emitida',
      };
      setResult(doc);
      setStep('success');
      setTimeout(() => onSuccess(doc), 100);
    }
  };

  const metodos = [
    { value: 'CC', label: 'Cartão / Stripe', icon: '💳' },
    { value: 'TB', label: 'Transferência',   icon: '🏦' },
    { value: 'MO', label: 'Dinheiro',        icon: '💵' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: 460, boxShadow: 'var(--shadow-float)' }}>

        {step === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🧾</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Emitir Fatura-Recibo</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>TOConline · Fatura-Recibo (FR) — AT certificada</p>
              </div>
              <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 28, height: 28, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>✕</button>
            </div>

            {/* Resumo do pagamento */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cliente</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{pagamento.alunoNome}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Serviço</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>Mensalidade — {pagamento.plano}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Base tributável (IVA 23% incl.)</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>€{valorSemIVA.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>IVA 23%</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>€{iva.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>Total</span>
                <span style={{ color: GB.red, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€{pagamento.valor.toFixed(2)}</span>
              </div>
              {pagamento.stripePaymentId && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, background: 'rgba(99,91,255,0.15)', color: '#635BFF', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>Stripe: {pagamento.stripePaymentId}</span>
                </div>
              )}
            </div>

            {/* NIF */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>NIF do Cliente (opcional)</label>
              <input
                type="text"
                value={nif}
                onChange={e => setNif(e.target.value)}
                placeholder="Ex: 123456789"
                maxLength={9}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Método de pagamento */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Método de Pagamento</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {metodos.map(m => (
                  <button key={m.value} onClick={() => setMetodo(m.value as 'CC' | 'TB' | 'MO')}
                    style={{ flex: 1, background: metodo === m.value ? GB.redGlow : 'var(--bg-elevated)', border: `1px solid ${metodo === m.value ? GB.red + '60' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{ color: metodo === m.value ? GB.red : 'var(--text-secondary)', fontSize: 10.5, fontWeight: 600 }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {tocConfig.simulationMode && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16 }}>
                <p style={{ color: '#F59E0B', fontSize: 11, margin: 0, fontWeight: 600 }}>⚡ Modo simulação — não emite para AT. Configure credenciais TOConline nas definições.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleEmitir} style={{ flex: 2, background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 16px ${GB.redGlow}` }}>
                🧾 Emitir Fatura-Recibo
              </button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 48, height: 48, border: `2px solid ${GB.red}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>A emitir fatura...</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>A comunicar com o TOConline</p>
          </div>
        )}

        {step === 'success' && result && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div style={{ width: 52, height: 52, background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>✓</div>
            <p style={{ color: '#22C55E', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Fatura emitida!</p>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '16px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Número</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{result.numero}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Total (IVA incl.)</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>€{result.valorTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>IVA 23%</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>€{result.ivaTotal.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Fechar</button>
              <a href={result.pdfUrl} target="_blank" rel="noreferrer" style={{ flex: 2, background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                📥 Download PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('cobrancas');
  const [filter, setFilter] = useState('todos');
  const [emitirModal, setEmitirModal] = useState<Pagamento | null>(null);
  const [tocDocumentos, setTocDocumentos] = useState<TocDocumento[]>(mockTocDocumentos);
  const [tocConfig, setTocConfig] = useState<TocConfig>(defaultTocConfig);
  const [tocSearch, setTocSearch] = useState('');
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const filtered = mockPagamentos.filter(p => filter === 'todos' || p.status === filter);
  const totalPago = mockPagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + p.valor, 0);
  const totalPendente = mockPagamentos.filter(p => p.status === 'pendente').reduce((s, p) => s + p.valor, 0);
  const totalVencido = mockPagamentos.filter(p => p.status === 'vencido').reduce((s, p) => s + p.valor, 0);

  const tocFiltrados = tocDocumentos.filter(d =>
    d.alunoNome.toLowerCase().includes(tocSearch.toLowerCase()) ||
    d.numero.toLowerCase().includes(tocSearch.toLowerCase())
  );

  const handleFaturaSuccess = useCallback((doc: TocDocumento) => {
    setTocDocumentos(prev => [doc, ...prev]);
    setEmitirModal(null);
    setTab('toconline');
  }, []);

  const testConnection = async () => {
    setTestingConn(true);
    await new Promise(r => setTimeout(r, 1200));
    setConnStatus(tocConfig.simulationMode ? 'ok' : (tocConfig.clientId ? 'ok' : 'fail'));
    setTestingConn(false);
  };

  return (
    <div>
      {emitirModal && (
        <EmitirFaturaModal
          pagamento={emitirModal}
          tocConfig={tocConfig}
          onClose={() => setEmitirModal(null)}
          onSuccess={handleFaturaSuccess}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Gestão Financeira</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Financeiro</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '3px 0 0' }}>Stripe · TOConline · SAF-T · IVA 23% incluído nos preços</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {tocConfig.simulationMode && (
            <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: 11, padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              ⚡ SIMULAÇÃO
            </span>
          )}
          <button onClick={() => setEmitirModal(mockPagamentos.find(p => p.status === 'pendente') || mockPagamentos[0])}
            style={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 14px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            🧾 Emitir Fatura
          </button>
          <button style={{ background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            💳 Gerar Cobrança Stripe
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Recebido',   value: `€${totalPago}`,     accent: '#22C55E', sub: `${mockPagamentos.filter(p => p.status === 'pago').length} pag.` },
          { label: 'A Receber',  value: `€${totalPendente}`, accent: '#F59E0B', sub: `${mockPagamentos.filter(p => p.status === 'pendente').length} pendentes` },
          { label: 'Vencido',    value: `€${totalVencido}`,  accent: GB.red,    sub: `${mockPagamentos.filter(p => p.status === 'vencido').length} em atraso` },
          { label: 'Faturas AT', value: tocDocumentos.length, accent: '#3B82F6', sub: `TOConline emitidas` },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `2px solid ${k.accent}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '9px 14px', fontSize: 13,
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 600 : 400,
            borderBottom: `2px solid ${tab === t.id ? GB.red : 'transparent'}`,
            marginBottom: -1,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: COBRANÇAS ── */}
      {tab === 'cobrancas' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['todos', 'pago', 'pendente', 'vencido'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? GB.red : 'var(--bg-card)', border: `1px solid ${filter === s ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '6px 14px', color: filter === s ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: filter === s ? 600 : 400, textTransform: 'capitalize', cursor: 'pointer' }}>{s}</button>
            ))}
          </div>

          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Aluno', 'Plano', 'Valor', 'Vencimento', 'Status', 'Stripe', 'TOConline', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const tocDoc = tocDocumentos.find(d => d.stripePaymentId === p.stripePaymentId || d.alunoNome === p.alunoNome);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.alunoNome}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{p.plano}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>€{p.valor}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.vencimento}</td>
                      <td style={{ padding: '11px 14px' }}><StatusBadge status={p.status}/></td>
                      <td style={{ padding: '11px 14px' }}>
                        {p.stripePaymentId
                          ? <span style={{ color: '#635BFF', fontSize: 10.5, fontFamily: 'var(--font-mono)', background: 'rgba(99,91,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>✓ {p.stripePaymentId.slice(-6)}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {tocDoc
                          ? <div>
                              <div style={{ color: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{tocDoc.numero}</div>
                              <TocBadge estado={tocDoc.estado}/>
                            </div>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>não emitida</span>}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {p.status === 'pago' && !tocDoc && (
                            <button onClick={() => setEmitirModal(p)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5, padding: '4px 9px', color: '#3B82F6', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              🧾 Emitir FR
                            </button>
                          )}
                          {tocDoc?.pdfUrl && (
                            <a href={tocDoc.pdfUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, padding: '4px 9px', color: '#22C55E', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                              📥 PDF
                            </a>
                          )}
                          {(p.status === 'pendente' || p.status === 'vencido') && (
                            <button style={{ background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 5, padding: '4px 9px', color: '#635BFF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Cobrar Stripe
                            </button>
                          )}
                          {(p.status === 'pendente' || p.status === 'vencido') && (
                            <button onClick={() => alert(`✅ WhatsApp enviado!\n\nPara: ${p.alunoNome}\nMensagem: "Olá, a tua mensalidade de €${p.valor} está pendente. Paga aqui: gbbraga.com/central-de-pagamento/"`) } style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 5, padding: '4px 9px', color: '#25D366', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              💬 Lembrete
                            </button>
                          )}
                          {p.status === 'pago' && (
                            <button onClick={() => alert(`📄 Recibo gerado!\n${p.alunoNome} · €${p.valor} · ${p.pagamento}`) } style={{ background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 5, padding: '4px 9px', color: '#635BFF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              📄 Recibo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB: TOCONLINE ── */}
      {tab === 'toconline' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Status card */}
            <Card style={{ padding: 20 }}>
              <Label>Estado da Ligação</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: '#1E3A5F', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🇵🇹</div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>TOConline</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Sistema de faturação certificado AT</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {tocConfig.simulationMode
                    ? <Badge color="#F59E0B" bg="rgba(245,158,11,0.12)">SIMULAÇÃO</Badge>
                    : connStatus === 'ok'
                      ? <Badge color="#22C55E" bg="rgba(34,197,94,0.12)">● LIGADO</Badge>
                      : <Badge color={GB.red} bg={GB.redGlow}>● OFFLINE</Badge>}
                </div>
              </div>
              {[
                ['API URL', tocConfig.simulationMode ? 'https://app.toconline.pt (mock)' : tocConfig.apiUrl || '—'],
                ['Empresa', tocConfig.empresaNome],
                ['NIF', tocConfig.empresaNIF],
                ['Série', tocConfig.serieDocumentos],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{v}</span>
                </div>
              ))}
            </Card>

            {/* Stats */}
            <Card style={{ padding: 20 }}>
              <Label>Resumo Faturas</Label>
              {[
                { label: 'Total emitidas', value: tocDocumentos.length },
                { label: 'Total faturado', value: `€${tocDocumentos.reduce((s, d) => s + d.valorTotal, 0).toFixed(2)}` },
                { label: 'IVA liquidado', value: `€${tocDocumentos.reduce((s, d) => s + d.ivaTotal, 0).toFixed(2)}` },
                { label: 'Com Stripe ref.', value: tocDocumentos.filter(d => d.stripePaymentId).length },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                </div>
              ))}
              <button onClick={() => setTab('config')} style={{ width: '100%', marginTop: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                ⚙ Configurar TOConline →
              </button>
            </Card>
          </div>

          {/* Auto-emissão + SAF-T */}
          <Card style={{ padding: 16, marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }}/>
                <div>
                  <div style={{ color: '#16A34A', fontSize: 12.5, fontWeight: 700 }}>Emissão automática ativa</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>FR emitida automaticamente quando Stripe confirma pagamento</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}>
                  {['Maio 2025', 'Abril 2025', 'Março 2025', 'Fevereiro 2025'].map(m => <option key={m}>{m}</option>)}
                </select>
                <button onClick={() => alert('SAF-T XML gerado!\nFicheiro: SAF-T_GBBraga_2025-05.xml\n\nEntregar à AT via portal e-fatura.pt')}
                  style={{ background: '#635BFF', border: 'none', borderRadius: 6, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  📤 Exportar SAF-T
                </button>
              </div>
            </div>
          </Card>

          {/* Documents list */}
          <Card>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Faturas-Recibo emitidas</Label>
              <input value={tocSearch} onChange={e => setTocSearch(e.target.value)} placeholder="Pesquisar..."
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text-primary)', fontSize: 12, width: 180 }}/>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Número', 'Cliente', 'Plano', 'Data', 'Base trib.', 'IVA 23%', 'Total', 'Stripe', 'Estado', 'PDF'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tocFiltrados.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{doc.numero}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-primary)' }}>{doc.alunoNome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-secondary)' }}>{doc.plano}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{doc.dataEmissao}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>€{doc.valorSemIVA.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>€{doc.ivaTotal.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>€{doc.valorTotal.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {doc.stripePaymentId
                        ? <span style={{ color: '#635BFF', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(99,91,255,0.1)', padding: '2px 5px', borderRadius: 3 }}>✓ {doc.stripePaymentId.slice(-6)}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><TocBadge estado={doc.estado}/></td>
                    <td style={{ padding: '10px 14px' }}>
                      {doc.pdfUrl && (
                        <a href={doc.pdfUrl} target="_blank" rel="noreferrer" style={{ color: '#22C55E', fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 4 }}>
                          📥 PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {tocFiltrados.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma fatura encontrada</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB: PLANOS ── */}
      {tab === 'planos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {mockPlanos.map(plano => (
            <Card key={plano.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{plano.nome}</div>
                {plano.ativo && <Badge color="#22C55E" bg="rgba(34,197,94,0.12)">ATIVO</Badge>}
              </div>
              <div style={{ color: GB.red, fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>€{plano.valor}<span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>/mês · IVA incl.</span></div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 14 }}>{plano.descricao}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                {mockAlunos.filter(a => a.plano === plano.nome).length} alunos ativos
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer"
                  style={{ flex: 1, background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 6, padding: '7px 0', color: '#635BFF', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  ↗ Stripe
                </a>
                <button onClick={() => { if(window.confirm(`Cancelar TODAS as subscrições de "${plano.nome}"?\n\nIsto cancelará o débito automático dos ${mockAlunos.filter(a=>a.plano===plano.nome).length} alunos neste plano.`)) alert('Pedido enviado ao Stripe.'); }}
                  style={{ flex: 1, background: 'rgba(200,16,46,0.06)', border: '1px solid rgba(200,16,46,0.15)', borderRadius: 6, padding: '7px 0', color: 'var(--gb-red)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  ⊗ Cancelar
                </button>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Stripe Price ID</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{plano.stripePriceId}</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: 14 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>TOConline item_code</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>GB-{plano.nome.toUpperCase().replace(/\s+/g, '-').slice(0, 12)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>Editar</button>
                <button style={{ flex: 1, background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: 11, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Stripe ↗</button>
              </div>
            </Card>
          ))}
          <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', minHeight: 180 }}>
            <span style={{ fontSize: 24, color: 'var(--text-muted)', marginBottom: 8 }}>+</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Novo Plano</span>
          </Card>
        </div>
      )}

      {/* ── TAB: STRIPE ── */}
      {tab === 'stripe' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, background: '#635BFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>S</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Stripe</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Modo: Teste (sandbox)</div>
              </div>
              <Badge color="#22C55E" bg="rgba(34,197,94,0.12)" children="● LIGADO"/>
            </div>
            {[
              ['Subscriptions ativas', '6'],
              ['Payment Intents (mês)', '24'],
              ['Taxa de sucesso', '96.7%'],
              ['Webhooks', '4 endpoints'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: 14, background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Abrir Stripe Dashboard ↗
            </button>
          </Card>
          <Card style={{ padding: 22 }}>
            <Label>Webhooks configurados</Label>
            {['payment_intent.succeeded → emitir FR TOConline', 'payment_intent.payment_failed → alertar admin', 'customer.subscription.updated → atualizar plano', 'invoice.payment_failed → suspender aluno'].map(w => (
              <div key={w} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#22C55E', fontSize: 12, flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11.5, lineHeight: 1.4 }}>{w}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
              <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, margin: '0 0 4px' }}>Fluxo automático</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                Stripe payment_intent.succeeded → webhook → emitir FR no TOConline → enviar PDF por email ao aluno
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB: CONFIG ── */}
      {tab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <Label>Configuração TOConline</Label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '10px 12px', background: tocConfig.simulationMode ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${tocConfig.simulationMode ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`, borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: tocConfig.simulationMode ? '#F59E0B' : '#22C55E', fontSize: 12, fontWeight: 600 }}>
                {tocConfig.simulationMode ? '⚡ Modo Simulação (sem emissão real)' : '✓ Modo Produção (emite para AT)'}
              </span>
              <button onClick={() => setTocConfig(c => ({ ...c, simulationMode: !c.simulationMode }))}
                style={{ background: tocConfig.simulationMode ? '#F59E0B' : '#22C55E', border: 'none', borderRadius: 20, padding: '4px 12px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {tocConfig.simulationMode ? 'Activar Produção' : 'Activar Simulação'}
              </button>
            </div>

            {[
              { key: 'apiUrl', label: 'API URL', placeholder: 'https://app.toconline.pt' },
              { key: 'clientId', label: 'Client ID (OAUTH_CLIENT_ID)', placeholder: 'obtido em Empresa > Dados API' },
              { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••••••••••••' },
              { key: 'empresaNome', label: 'Nome da Empresa', placeholder: 'Gracie Barra Braga, Lda.' },
              { key: 'empresaNIF', label: 'NIF da Empresa', placeholder: '512345678' },
              { key: 'serieDocumentos', label: 'Série de Documentos', placeholder: 'GB2025' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input
                  type={f.key.includes('Secret') ? 'password' : 'text'}
                  value={(tocConfig as unknown as Record<string, string>)[f.key] || ''}
                  onChange={e => setTocConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, fontFamily: ['clientId','clientSecret','empresaNIF'].includes(f.key) ? 'var(--font-mono)' : 'var(--font-ui)' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={testConnection} disabled={testingConn}
                style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: connStatus === 'ok' ? '#22C55E' : connStatus === 'fail' ? GB.red : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {testingConn ? '⟳ A testar...' : connStatus === 'ok' ? '✓ Ligação OK' : connStatus === 'fail' ? '✕ Falhou' : '⚡ Testar Ligação'}
              </button>
              <button style={{ flex: 1, background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Guardar Configuração
              </button>
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <Label>Como configurar</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { step: '1', title: 'Aceder ao TOConline', desc: 'Faça login em app.toconline.pt e aceda a Empresa → Dados API' },
                { step: '2', title: 'Obter credenciais', desc: 'Descarregue o ficheiro de configuração Postman — contém o Client ID, Secret e OAUTH_URL' },
                { step: '3', title: 'Criar serviço', desc: 'Em Artigos → Serviços, crie um serviço com código "GB-MENSALIDADE" e IVA 23%' },
                { step: '4', title: 'Criar série 2025', desc: 'Em Empresa → Séries, crie a série "GB2025" do tipo Fatura-Recibo (FR)' },
                { step: '5', title: 'Webhook Stripe', desc: 'Configure o webhook payment_intent.succeeded para chamar o endpoint que emite a FR automaticamente' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: GB.red, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{s.step}</div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://api-docs.toconline.pt" target="_blank" rel="noreferrer"
              style={{ display: 'block', marginTop: 18, textAlign: 'center', color: '#3B82F6', fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', padding: '9px' }}>
              📖 Documentação API TOConline →
            </a>
          </Card>
        </div>
      )}
    </div>
  );
}
