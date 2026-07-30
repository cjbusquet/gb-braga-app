import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';

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

const STATUS_COLOR: Record<WebhookStatus, string> = { ok: '#16A34A', warn: '#D97706', error: '#C8102E', idle: '#9896A4' };
const STATUS_LABEL: Record<WebhookStatus, string> = { ok: 'Ativo', warn: 'Aviso', error: 'Erro', idle: 'Inativo' };

function StatusDot({ status }: { status: WebhookStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <div className="flex gap-1.5 items-center">
      <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: status === 'ok' ? `0 0 6px ${c}66` : 'none' }}/>
      <span className="text-[11px] font-semibold" style={{ color: c }}>{STATUS_LABEL[status]}</span>
    </div>
  );
}

const LOG_LEVEL_COLOR: Record<LogLevel, string> = { success: '#16A34A', info: '#2563EB', error: '#C8102E', warn: '#D97706' };

function LogRow({ log }: { log: WebhookLog }) {
  const [expanded, setExpanded] = useState(false);
  const c = LOG_LEVEL_COLOR[log.level];
  return (
    <div className="border-b border-border-subtle">
      <button onClick={() => setExpanded(!expanded)}
        className="flex gap-3 items-center py-2.5 px-3.5 w-full min-h-11 sm:min-h-0 text-left bg-transparent border-none cursor-pointer transition-colors duration-200 hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c }}/>
        <span className="w-14 font-mono text-[11px] shrink-0 text-muted">{log.time}</span>
        <span className="flex-1 font-mono text-[12.5px] text-primary truncate">{log.event}</span>
        <span
          className="py-0.5 px-[7px] font-mono text-[11px] font-bold rounded shrink-0"
          style={{ background: log.status === 200 ? 'rgba(22,163,74,0.08)' : 'rgba(200,16,46,0.08)', color: log.status === 200 ? '#16A34A' : '#C8102E' }}
        >{log.status}</span>
        <span className="w-[50px] font-mono text-[11px] text-right shrink-0 text-muted">{log.duration}</span>
        <span className="ml-1 text-xs shrink-0 text-muted">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="py-2 px-3.5 pb-3 pl-[34px]">
          <div className="py-2.5 px-3 font-mono text-[11.5px] leading-[1.6] rounded-sm bg-elevated text-secondary">
            {log.payload}
          </div>
        </div>
      )}
    </div>
  );
}

const ROW_CLASS = 'flex justify-between py-2 border-b border-border-subtle';

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
      <PageHeader eyebrow="Sistema" title="Integrações" subtitle="Stripe · TOConline · Webhooks · AT Certificado" />

      {/* Status pills */}
      <div className="flex overflow-x-auto flex-wrap gap-2.5 mb-[18px]">
        {[
          { label: 'Stripe', status: 'ok' as WebhookStatus, sub: 'Modo sandbox' },
          { label: 'TOConline', status: 'warn' as WebhookStatus, sub: 'Simulação ativa' },
          { label: 'Webhooks', status: 'ok' as WebhookStatus, sub: '3 endpoints' },
          { label: 'AT / e-fatura', status: 'warn' as WebhookStatus, sub: 'Aguarda produção' },
        ].map(s => (
          <div key={s.label} className="flex gap-2.5 py-2.5 px-3.5 rounded-sm border shadow-xs border-border bg-card">
            <StatusDot status={s.status}/>
            <div className="ml-1">
              <div className="text-[12.5px] font-semibold text-primary">{s.label}</div>
              <div className="text-[10.5px] text-muted">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-0.5 mb-[18px] border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={[
              'flex gap-1.5 items-center py-2.5 px-3.5 -mb-px min-h-11 sm:min-h-0 text-[13px] whitespace-nowrap bg-none border-none border-b-2 cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              tab === t.id ? 'font-bold border-gb-red text-primary' : 'font-normal border-transparent text-muted hover:text-primary active:text-primary',
            ].join(' ')}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── FLUXO ── */}
      {tab === 'fluxo' && (
        <div>
          <Card padding="lg" className="mb-4">
            <div className="mb-5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Fluxo Completo: Stripe → TOConline → AT</div>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {TOC_FLOW_STEPS.map((s, i) => {
                if (s.icon === '→') return <div key={i} className="text-lg font-bold text-gb-red">→</div>;
                return (
                  <div key={i} className="py-3.5 px-[18px] text-center rounded-md border min-w-[110px] border-border bg-elevated">
                    <div className="mb-1.5 text-[28px]">{s.icon}</div>
                    <div className="mb-1 text-xs font-bold text-primary">{s.label}</div>
                    <div className="text-[10.5px] leading-[1.4] text-muted">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {[
              { titulo: 'Pagamento confirmado',      icon: '✓', desc: 'Stripe recebe o pagamento e emite payment_intent.succeeded', color: '#16A34A' },
              { titulo: 'Webhook disparado',          icon: '⚡', desc: 'Servidor GB recebe o evento e valida a assinatura (whsec_)', color: '#2563EB' },
              { titulo: 'Fatura emitida (FR)',        icon: '🧾', desc: 'TOConline cria o documento fiscal e comunica à AT automaticamente', color: '#635BFF' },
              { titulo: 'Notificação ao aluno',      icon: '💬', desc: 'Email com PDF da fatura + WhatsApp de confirmação de pagamento', color: '#25D366' },
            ].map(c => (
              <div key={c.titulo} className="flex gap-3 py-4 px-[18px] rounded-md border shadow-xs border-border bg-card">
                <div className="flex justify-center items-center w-9 h-9 text-lg rounded-sm shrink-0" style={{ background: c.color + '14' }}>{c.icon}</div>
                <div>
                  <div className="mb-1 text-[13px] font-bold text-primary">{c.titulo}</div>
                  <div className="text-xs leading-[1.5] text-muted">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STRIPE ── */}
      {tab === 'stripe' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card padding="lg">
            <div className="flex gap-3 items-center mb-5">
              <div className="flex justify-center items-center w-11 h-11 text-lg font-extrabold text-white rounded-[10px] bg-[#635BFF]">S</div>
              <div>
                <div className="text-[15px] font-bold text-primary">Stripe</div>
                <div className="text-[11px] text-muted">Pagamentos e subscrições recorrentes</div>
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
              <div key={r.k} className={ROW_CLASS}>
                <span className="text-xs text-muted">{r.k}</span>
                <span className="font-mono text-xs font-medium text-primary">{r.v}</span>
              </div>
            ))}
            <button onClick={testStripe} disabled={testingStripe}
              className={[
                'py-2.5 mt-4 min-h-11 sm:min-h-0 w-full text-[13px] font-bold text-white rounded-sm border-none cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                testingStripe ? 'bg-elevated' : stripeStatus === 'ok' ? 'bg-green-600 hover:bg-green-700 active:bg-green-700' : 'bg-[#635BFF] hover:bg-[#524ae0] active:bg-[#524ae0]',
              ].join(' ')}>
              {testingStripe ? '⟳ A testar...' : stripeStatus === 'ok' ? '✓ Ligação OK' : '⚡ Testar Ligação'}
            </button>
          </Card>

          <Card padding="lg">
            <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Webhooks configurados</div>
            {STRIPE_ENDPOINTS.map(ep => (
              <div key={ep.id} className="py-3 px-3.5 mb-2.5 rounded-sm border border-border bg-elevated">
                <div className="flex justify-between mb-1.5">
                  <StatusDot status={ep.status}/>
                  <span className="text-[11px] font-semibold text-green-600">{ep.successRate}</span>
                </div>
                <div className="mb-1 font-mono text-[11.5px] break-all text-primary">{ep.url}</div>
                <div className="flex flex-wrap gap-1">
                  {ep.events.map(e => (
                    <span key={e} className="py-0.5 px-1.5 font-mono text-[10px] rounded text-[#635BFF] bg-[#635BFF]/[0.08]">{e}</span>
                  ))}
                </div>
                <div className="mt-1 text-[10.5px] text-muted">Último: {ep.lastFired}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── TOCONLINE ── */}
      {tab === 'toconline' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card padding="lg">
            <div className="flex gap-3 items-center mb-5">
              <div className="flex justify-center items-center w-11 h-11 text-xl rounded-[10px] bg-[#0E2D52]">🇵🇹</div>
              <div>
                <div className="text-[15px] font-bold text-primary">TOConline</div>
                <div className="text-[11px] text-muted">Faturação certificada AT · Portugal</div>
              </div>
              <StatusDot status="warn"/>
            </div>
            <div className="py-2.5 px-3 mb-4 rounded-sm border border-amber-600/20 bg-amber-600/[0.06]">
              <div className="mb-0.5 text-[11.5px] font-bold text-amber-700">⚡ Modo Simulação Ativo</div>
              <div className="text-[11px] text-muted">Faturas não são comunicadas à AT. Ativa o modo produção nas Configurações.</div>
            </div>
            {[
              { k: 'API URL',      v: 'https://app.toconline.pt' },
              { k: 'Client ID',    v: '—  (configurar)' },
              { k: 'Empresa',      v: 'Gracie Barra Braga' },
              { k: 'NIF',         v: '512345678' },
              { k: 'Série',       v: 'GB2025' },
            ].map(r => (
              <div key={r.k} className={ROW_CLASS}>
                <span className="text-xs text-muted">{r.k}</span>
                <span className={['font-mono text-xs', r.v.includes('configurar') ? 'text-amber-700' : 'text-primary'].join(' ')}>{r.v}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={testToc} disabled={testingToc}
                className={[
                  'flex-1 py-2.5 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border cursor-pointer border-border transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                  testingToc ? 'bg-elevated text-secondary' : tocStatus === 'ok' ? 'text-white bg-green-600 hover:bg-green-700 active:bg-green-700' : 'bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle',
                ].join(' ')}>
                {testingToc ? '⟳ A testar...' : tocStatus === 'ok' ? '✓ OK' : 'Testar'}
              </button>
              <button className="flex-[2] py-2.5 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none cursor-pointer transition-colors duration-200 bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                ⚙ Configurar → Config.
              </button>
            </div>
          </Card>

          <Card padding="lg">
            <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Documentos TOConline</div>
            {[
              { tipo: 'Faturas-Recibo (FR)', count: 3 },
              { tipo: 'Notas de Crédito',   count: 0 },
              { tipo: 'Com erro',           count: 0 },
              { tipo: 'Pendentes de envio', count: 0 },
            ].map(r => (
              <div key={r.tipo} className="flex justify-between py-2.5 border-b border-border-subtle">
                <span className="text-[13px] text-secondary">{r.tipo}</span>
                <span className="text-sm font-bold text-primary">{r.count}</span>
              </div>
            ))}
            <div className="py-2.5 px-3 mt-4 rounded-sm border border-[#635BFF]/15 bg-[#635BFF]/5">
              <div className="mb-1 text-[11.5px] font-bold text-[#635BFF]">Próxima ação</div>
              <div className="text-[11.5px] leading-[1.5] text-muted">
                Insere o Client ID e Client Secret TOConline em <strong>Config. → TOConline</strong> para ativar a emissão real de faturas.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div>
          <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
            <div className="text-xs text-muted">Últimos 24h · {MOCK_LOGS.length} eventos</div>
            <div className="flex gap-2">
              <button className="py-1.5 px-3 min-h-11 sm:min-h-0 text-[11.5px] rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">⟳ Refresh</button>
              <button className="py-1.5 px-3 min-h-11 sm:min-h-0 text-[11.5px] rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">📥 Exportar</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border shadow-xs border-border bg-card">
            <div className="overflow-x-auto">
            <div className="min-w-[480px] grid grid-cols-[20px_56px_1fr_52px_50px_20px] gap-3 py-2.5 px-3.5 text-[10px] font-semibold tracking-[0.5px] uppercase border-b border-border bg-elevated text-muted">
              <div/>
              <div>Hora</div>
              <div>Evento</div>
              <div>Status</div>
              <div className="text-right">Duração</div>
              <div/>
            </div>
            <div className="min-w-[480px]">
              {MOCK_LOGS.map(log => <LogRow key={log.id} log={log}/>)}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
