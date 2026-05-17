import { useState } from 'react';

type WebhookStatus = 'ok' | 'warn' | 'error' | 'idle';
type LogLevel = 'success' | 'info' | 'error' | 'warn';

interface WebhookLog {
  id: string;
  time: string;
  event: string;
  status: number;
  duration: string;
  payload: string;
  level: LogLevel;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  lastFired: string;
  successRate: string;
}

const MOCK_LOGS: WebhookLog[] = [
  { id: 'wh1', time: '18:34:12', event: 'payment_intent.succeeded',        status: 200, duration: '234ms', payload: '{ "amount": 8900, "currency": "eur", "customer": "cus_demo001" }', level: 'success' },
  { id: 'wh2', time: '18:34:13', event: 'invoice.payment_succeeded',        status: 200, duration: '187ms', payload: '{ "invoice_id": "inv_XXX", "amount_paid": 8900 }',               level: 'success' },
  { id: 'wh3', time: '17:02:44', event: 'customer.subscription.updated',    status: 200, duration: '312ms', payload: '{ "subscription": "sub_XXX", "status": "active" }',              level: 'info'    },
  { id: 'wh4', time: '16:45:01', event: 'payment_intent.payment_failed',    status: 200, duration: '198ms', payload: '{ "error": "card_declined", "customer": "cus_demo004" }',        level: 'error'   },
  { id: 'wh5', time: '09:11:33', event: 'payment_intent.succeeded',        status: 200, duration: '221ms', payload: '{ "amount": 8900, "currency": "eur" }',                           level: 'success' },
];

const STRIPE_ENDPOINTS: WebhookEndpoint[] = [
  { id: 'whe1', url: 'https://gbbraga.com/api/webhooks/stripe/pagamento',    events: ['payment_intent.succeeded','payment_intent.failed'], status: 'ok',   lastFired: '18:34:12', successRate: '98.5%' },
  { id: 'whe2', url: 'https://gbbraga.com/api/webhooks/stripe/subscricao',   events: ['customer.subscription.updated','invoice.payment_failed'], status: 'ok', lastFired: '17:02:44', successRate: '100%' },
  { id: 'whe3', url: 'https://gbbraga.com/api/webhooks/toconline/fatura',    events: ['payment_intent.succeeded'], status: 'ok', lastFired: '18:34:14', successRate: '97.2%' },
];

const TOC_FLOW_STEPS = [
  { icon: '💳', label: 'Stripe Checkout', desc: 'Aluno paga com cartão' },
  { icon: '→',  label: '', desc: '' },
  { icon: '⚡', label: 'Webhook Stripe', desc: 'payment_intent.succeeded' },
  { icon: '→',  label: '', desc: '' },
  { icon: '🖥',  label: 'Servidor GB', desc: 'gbbraga.com/api/webhooks' },
  { icon: '→',  label: '', desc: '' },
  { icon: '🧾', label: 'TOConline API', desc: 'POST /commercial_sales_documents' },
  { icon: '→',  label: '', desc: '' },
  { icon: '📧', label: 'Email + PDF', desc: 'Fatura enviada ao aluno' },
];

function StatusDot({ status }: { status: WebhookStatus }) {
  const c = { ok: '#16A34A', warn: '#D97706', error: '#C8102E', idle: '#9896A4' }[status];
  const l = { ok: 'Ativo', warn: 'Aviso', error: 'Erro', idle: 'Inativo' }[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: status === 'ok' ? `0 0 6px ${c}66` : 'none' }}/>
      <span style={{ color: c, fontSize: 11, fontWeight: 600 }}>{l}</span>
    </div>
  );
}

function LogRow({ log }: { log: WebhookLog }) {
  const [expanded, setExpanded] = useState(false);
  const colors = { success: '#16A34A', info: '#2563EB', error: '#C8102E', warn: '#D97706' };
  const c = colors[log.level];
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }}/>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', width: 56, flexShrink: 0 }}>{log.time}</span>
        <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{log.event}</span>
        <span style={{ background: log.status === 200 ? 'rgba(22,163,74,0.08)' : 'rgba(200,16,46,0.08)', color: log.status === 200 ? '#16A34A' : '#C8102E', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{log.status}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', width: 50, textAlign: 'right' as const }}>{log.duration}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 4 }}>{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '8px 14px 12px 34px' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {log.payload}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegracoesPage() {
  const [tab, setTab] = useState<'stripe' | 'toconline' | 'logs' | 'fluxo'>('fluxo');
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingToc, setTestingToc] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<'idle'|'ok'|'fail'>('idle');
  const [tocStatus, setTocStatus] = useState<'idle'|'ok'|'fail'>('idle');

  const testStripe = async () => {
    setTestingStripe(true);
    await new Promise(r => setTimeout(r, 1400));
    setStripeStatus('ok');
    setTestingStripe(false);
  };

  const testToc = async () => {
    setTestingToc(true);
    await new Promise(r => setTimeout(r, 1600));
    setTocStatus('ok');
    setTestingToc(false);
  };

  const TABS = [
    { id: 'fluxo',    label: 'Fluxo de Pagamento', icon: '⚡' },
    { id: 'stripe',   label: 'Stripe',              icon: '💳' },
    { id: 'toconline',label: 'TOConline',            icon: '🧾' },
    { id: 'logs',     label: 'Webhook Logs',        icon: '📋' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Sistema</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const }}>Integrações</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>Stripe · TOConline · Webhooks · AT Certificado</p>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Stripe', status: 'ok' as WebhookStatus, sub: 'Modo sandbox' },
          { label: 'TOConline', status: 'warn' as WebhookStatus, sub: 'Simulação ativa' },
          { label: 'Webhooks', status: 'ok' as WebhookStatus, sub: '3 endpoints' },
          { label: 'AT / e-fatura', status: 'warn' as WebhookStatus, sub: 'Aguarda produção' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
            <StatusDot status={s.status}/>
            <div style={{ marginLeft: 4 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600 }}>{s.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', fontSize: 13, color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: tab === t.id ? 700 : 400, borderBottom: `2px solid ${tab === t.id ? 'var(--gb-red)' : 'transparent'}`, marginBottom: -1 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── FLUXO ── */}
      {tab === 'fluxo' && (
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 20 }}>Fluxo Completo: Stripe → TOConline → AT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {TOC_FLOW_STEPS.map((s, i) => {
                if (s.icon === '→') return <div key={i} style={{ color: 'var(--gb-red)', fontSize: 18, fontWeight: 700 }}>→</div>;
                return (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', textAlign: 'center' as const, minWidth: 110 }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10.5, lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { titulo: 'Pagamento confirmado',       icon: '✓', desc: 'Stripe recebe o pagamento e emite payment_intent.succeeded', color: '#16A34A' },
              { titulo: 'Webhook disparado',          icon: '⚡', desc: 'Servidor GB recebe o evento e valida a assinatura (whsec_)', color: '#2563EB' },
              { titulo: 'Fatura emitida (FR)',        icon: '🧾', desc: 'TOConline cria o documento fiscal e comunica à AT automaticamente', color: '#635BFF' },
              { titulo: 'Notificação ao aluno',      icon: '💬', desc: 'Email com PDF da fatura + WhatsApp de confirmação de pagamento', color: '#25D366' },
            ].map(c => (
              <div key={c.titulo} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', gap: 12, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: c.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{c.titulo}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STRIPE ── */}
      {tab === 'stripe' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, background: '#635BFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>S</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>Stripe</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Pagamentos e subscrições recorrentes</div>
              </div>
              <StatusDot status="ok"/>
            </div>
            {[
              { k: 'Chave pública (pk_test_)',   v: 'pk_test_••••••••••••••••' },
              { k: 'Chave secreta (sk_test_)',   v: 'sk_test_••••••••••••••••' },
              { k: 'Webhook Secret (whsec_)',    v: 'whsec_••••••••••••••••' },
              { k: 'Moeda',                      v: 'EUR (€) — Portugal' },
              { k: 'Modo',                       v: 'Sandbox (test)' },
            ].map(r => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.k}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
            <button onClick={testStripe} disabled={testingStripe} style={{ width: '100%', marginTop: 16, background: testingStripe ? 'var(--bg-elevated)' : stripeStatus === 'ok' ? '#16A34A' : '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {testingStripe ? '⟳ A testar...' : stripeStatus === 'ok' ? '✓ Ligação OK' : '⚡ Testar Ligação'}
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Webhooks configurados</div>
            {STRIPE_ENDPOINTS.map(ep => (
              <div key={ep.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <StatusDot status={ep.status}/>
                  <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 600 }}>{ep.successRate}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: 11.5, fontFamily: 'var(--font-mono)', marginBottom: 5, wordBreak: 'break-all' as const }}>{ep.url}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                  {ep.events.map(e => (
                    <span key={e} style={{ background: 'rgba(99,91,255,0.08)', color: '#635BFF', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{e}</span>
                  ))}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 5 }}>Último: {ep.lastFired}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOCONLINE ── */}
      {tab === 'toconline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, background: '#0E2D52', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🇵🇹</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>TOConline</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Faturação certificada AT · Portugal</div>
              </div>
              <StatusDot status="warn"/>
            </div>
            <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16 }}>
              <div style={{ color: 'var(--warning)', fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>⚡ Modo Simulação Ativo</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Faturas não são comunicadas à AT. Ativa o modo produção nas Configurações.</div>
            </div>
            {[
              { k: 'API URL',      v: 'https://app.toconline.pt' },
              { k: 'Client ID',    v: '—  (configurar)' },
              { k: 'Empresa',      v: 'Gracie Barra Braga' },
              { k: 'NIF',         v: '512345678' },
              { k: 'Série',       v: 'GB2025' },
            ].map(r => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.k}</span>
                <span style={{ color: r.v.includes('configurar') ? 'var(--warning)' : 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{r.v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={testToc} disabled={testingToc} style={{ flex: 1, background: testingToc ? 'var(--bg-elevated)' : tocStatus === 'ok' ? '#16A34A' : 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px', color: tocStatus === 'ok' ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {testingToc ? '⟳ A testar...' : tocStatus === 'ok' ? '✓ OK' : 'Testar'}
              </button>
              <button style={{ flex: 2, background: 'var(--gb-red)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ⚙ Configurar → Config.
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Documentos TOConline</div>
            {[
              { tipo: 'Faturas-Recibo (FR)', count: 3,   status: 'ok'   },
              { tipo: 'Notas de Crédito',   count: 0,   status: 'ok'   },
              { tipo: 'Com erro',           count: 0,   status: 'ok'   },
              { tipo: 'Pendentes de envio', count: 0,   status: 'ok'   },
            ].map(r => (
              <div key={r.tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.tipo}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{r.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, background: 'rgba(99,91,255,0.05)', border: '1px solid rgba(99,91,255,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <div style={{ color: '#635BFF', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Próxima ação</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11.5, lineHeight: 1.5 }}>
                Insere o Client ID e Client Secret TOConline em <strong>Config. → TOConline</strong> para ativar a emissão real de faturas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Últimos 24h · {MOCK_LOGS.length} eventos</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 11.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>⟳ Refresh</button>
              <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 11.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>📥 Exportar</button>
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '20px 56px 1fr 52px 50px 20px', gap: 12, padding: '9px 14px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              <div/>
              <div>Hora</div>
              <div>Evento</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' as const }}>Duração</div>
              <div/>
            </div>
            {MOCK_LOGS.map(log => <LogRow key={log.id} log={log}/>)}
          </div>
        </div>
      )}
    </div>
  );
}
