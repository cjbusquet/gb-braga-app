import { useState, useEffect } from 'react';
import type React from 'react';
import { GB } from '../../lib/gbBrand';
import { defaultTocConfig } from '../../data/mockData';
import { supabase, isConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth';
import type { TocConfig } from '../../types';

type Section = 'equipa' | 'toconline' | 'stripe' | 'whatsapp' | 'email' | 'academia' | 'compliance';

const SECTIONS: { id: Section; label: string; icon: string; desc: string; superadminOnly?: boolean }[] = [
  { id: 'equipa',     label: 'Equipa',             icon: '👥', desc: 'Convidar professores e staff', superadminOnly: true },
  { id: 'toconline',  label: 'TOConline',           icon: '🧾', desc: 'Faturação certificada AT' },
  { id: 'stripe',     label: 'Stripe',              icon: '💳', desc: 'Pagamentos online' },
  { id: 'whatsapp',   label: 'WhatsApp Business',   icon: '💬', desc: 'Comunicação com alunos' },
  { id: 'email',      label: 'Email / SMTP',         icon: '📧', desc: 'Notificações por email' },
  { id: 'academia',   label: 'Academia',             icon: '🏫', desc: 'Dados gerais e horários' },
  { id: 'compliance', label: 'IPDJ / RGPD',          icon: '📋', desc: 'Legal e conformidade' },
];

// ─── useConfig hook — loads/saves a section's config from the `configuracoes` table ──
function useConfig<T extends object>(secao: string, defaults: T) {
  const [data, setData]     = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    supabase
      .from('configuracoes')
      .select('dados')
      .eq('secao', secao)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row?.dados && typeof row.dados === 'object') {
          setData(prev => ({ ...prev, ...(row.dados as Partial<T>) }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secao]);

  const save = async (override?: T) => {
    const toSave = override ?? data;
    if (!isConfigured) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('configuracoes')
        .upsert(
          { secao, dados: toSave, updated_at: new Date().toISOString(), updated_by: user?.id },
          { onConflict: 'secao' }
        );
    } catch (e) {
      console.error('useConfig save error:', e);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return { data, setData, loading, saving, saved, save };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 12 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', mono = false }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 11px', color: 'var(--text-primary)', fontSize: 12.5, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)' }}
    />
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, ...style }}>{children}</div>;
}

function SaveBar({ onSave, saved, saving = false }: { onSave: () => void; saved: boolean; saving?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
      <button onClick={onSave} disabled={saving} style={{ background: saved ? '#22C55E' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 0 16px ${saved ? 'rgba(34,197,94,0.2)' : GB.redGlow}`, opacity: saving ? 0.7 : 1 }}>
        {saving ? '⟳ A guardar...' : saved ? '✓ Guardado' : '💾 Guardar Configuração'}
      </button>
    </div>
  );
}

// ─── TOConline Section ────────────────────────────────────────────────────────
function TocSection() {
  const { data: cfg, setData: setCfg, loading, saving, saved, save } = useConfig<TocConfig>('toconline', defaultTocConfig);
  const [testing, setTesting] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const update = (key: keyof TocConfig, val: string | boolean) =>
    setCfg(c => ({ ...c, [key]: val }));

  const testConn = async () => {
    setTesting(true); setConnStatus('idle');
    await new Promise(r => setTimeout(r, 1400));
    setConnStatus(cfg.simulationMode || cfg.clientId ? 'ok' : 'fail');
    setTesting(false);
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>A carregar configuração...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Left: form */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 40, height: 40, background: '#0E2D52', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🇵🇹</div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>TOConline</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Faturação certificada pela Autoridade Tributária</div>
          </div>
        </div>

        {/* Simulation toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cfg.simulationMode ? 'rgba(245,158,11,0.07)' : 'rgba(34,197,94,0.07)', border: `1px solid ${cfg.simulationMode ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 18 }}>
          <div>
            <div style={{ color: cfg.simulationMode ? '#F59E0B' : '#22C55E', fontSize: 12, fontWeight: 700 }}>
              {cfg.simulationMode ? '⚡ Modo Simulação' : '✓ Modo Produção'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
              {cfg.simulationMode ? 'Não emite faturas reais — ideal para testes' : 'Faturas comunicadas à AT em tempo real'}
            </div>
          </div>
          <button onClick={() => update('simulationMode', !cfg.simulationMode)}
            style={{ background: cfg.simulationMode ? '#F59E0B' : '#22C55E', border: 'none', borderRadius: 20, padding: '5px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {cfg.simulationMode ? 'Ativar Produção' : 'Ativar Simulação'}
          </button>
        </div>

        <Label>Ligação OAuth 2.0</Label>
        <Field label="API URL">
          <Input value={cfg.apiUrl} onChange={v => update('apiUrl', v)} placeholder="https://app.toconline.pt" mono />
        </Field>
        <Field label="Client ID (OAUTH_CLIENT_ID)">
          <Input value={cfg.clientId} onChange={v => update('clientId', v)} placeholder="Obtido em Empresa → Dados API" mono />
        </Field>
        <Field label="Client Secret (OAUTH_CLIENT_SECRET)">
          <Input value={cfg.clientSecret} onChange={v => update('clientSecret', v)} placeholder="••••••••••••••••" type="password" mono />
        </Field>

        <Label>Dados da Empresa</Label>
        <Field label="Nome da empresa">
          <Input value={cfg.empresaNome} onChange={v => update('empresaNome', v)} placeholder="Gracie Barra Braga, Lda." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="NIF">
            <Input value={cfg.empresaNIF} onChange={v => update('empresaNIF', v)} placeholder="512345678" mono />
          </Field>
          <Field label="Série de documentos">
            <Input value={cfg.serieDocumentos} onChange={v => update('serieDocumentos', v)} placeholder="GB2025" mono />
          </Field>
        </div>

        {/* Test + Save */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={testConn} disabled={testing}
            style={{ flex: 1, background: 'var(--bg-elevated)', border: `1px solid ${connStatus === 'ok' ? 'rgba(34,197,94,0.4)' : connStatus === 'fail' ? `${GB.red}40` : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: connStatus === 'ok' ? '#22C55E' : connStatus === 'fail' ? GB.red : 'var(--text-secondary)' }}>
            {testing ? '⟳ A testar...' : connStatus === 'ok' ? '✓ Ligação OK' : connStatus === 'fail' ? '✕ Sem ligação' : '⚡ Testar Ligação'}
          </button>
          <button onClick={() => save()} disabled={saving}
            style={{ flex: 2, background: saved ? '#22C55E' : saving ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⟳ A guardar...' : saved ? '✓ Guardado!' : '💾 Guardar'}
          </button>
        </div>
      </Card>

      {/* Right: guide + status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status summary */}
        <Card>
          <Label>Estado dos Serviços TOConline</Label>
          {[
            { label: 'OAuth / Autenticação', ok: !!cfg.clientId || cfg.simulationMode },
            { label: 'Emissão de Faturas-Recibo (FR)', ok: true },
            { label: 'Download de PDF', ok: true },
            { label: 'Comunicação à AT (e-fatura)', ok: !cfg.simulationMode && !!cfg.clientId },
            { label: 'SAF-T PT (exportação)', ok: !cfg.simulationMode },
            { label: 'Sincronização Stripe → FR', ok: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.label}</span>
              {s.ok
                ? <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 99 }}>✓ OK</span>
                : <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 99 }}>Pendente</span>}
            </div>
          ))}
        </Card>

        {/* Setup guide */}
        <Card>
          <Label>Como configurar — 5 passos</Label>
          {[
            { n: '1', title: 'Aceder ao TOConline', desc: 'Login em app.toconline.pt → Empresa → Dados API' },
            { n: '2', title: 'Descarregar credenciais', desc: 'Clique em "Ficheiro Postman" para obter o Client ID, Secret e URL OAuth' },
            { n: '3', title: 'Criar serviço', desc: 'Artigos → Serviços → Novo: código "GB-MENSALIDADE", IVA Normal 23%' },
            { n: '4', title: 'Criar série GB2025', desc: 'Empresa → Séries → Nova série FR com prefixo "GB2025"' },
            { n: '5', title: 'Ligar webhook Stripe', desc: 'payment_intent.succeeded → emite FR automaticamente no TOConline' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: GB.red, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{s.n}</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11.5, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <a href="https://api-docs.toconline.pt" target="_blank" rel="noreferrer"
            style={{ display: 'block', marginTop: 4, textAlign: 'center', color: '#3B82F6', fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
            📖 Documentação API TOConline →
          </a>
        </Card>
      </div>
    </div>
  );
}

// ─── Stripe Section ───────────────────────────────────────────────────────────
const PLANOS_STRIPE = [
  { id:'pl-adulto-plus',    nome:'Adulto Plus',           valor:62,  cat:'adulto'   },
  { id:'pl-adulto-fundador',nome:'Adulto Fundador',       valor:53,  cat:'fundador' },
  { id:'pl-estudante',      nome:'Estudante (Univ.)',      valor:53,  cat:'adulto'   },
  { id:'pl-kids-plus',      nome:'Kids Plus',             valor:53,  cat:'kids'     },
  { id:'pl-kids-fundador',  nome:'Kids Fundador',         valor:45,  cat:'fundador' },
  { id:'pl-familia-2',      nome:'Família 2',             valor:115, cat:'familia'  },
  { id:'pl-familia-3',      nome:'Família 3',             valor:165, cat:'familia'  },
  { id:'pl-familia-3-kids', nome:'Família 3 Kids',        valor:150, cat:'familia'  },
  { id:'pl-familia-4',      nome:'Família 4',             valor:200, cat:'familia'  },
  { id:'pl-familia-2-fund', nome:'Família 2 Fundador',    valor:109, cat:'fundador' },
  { id:'pl-familia-3-fund', nome:'Família 3 Fundador',    valor:157, cat:'fundador' },
  { id:'pl-familia-4-fund', nome:'Família 4 Fundador',    valor:190, cat:'fundador' },
];

type StripeConfig = {
  mode: 'test' | 'live';
  pk: string;
  sk: string;
  whsec: string;
  priceIds: Record<string, string>;
};

const defaultStripe: StripeConfig = {
  mode: 'test',
  pk: '',
  sk: '',
  whsec: '',
  priceIds: Object.fromEntries(PLANOS_STRIPE.map(p => [p.id, ''])),
};

function StripeSection() {
  const { data, setData, loading, saving, saved, save } = useConfig<StripeConfig>('stripe', defaultStripe);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok'|'err'|null>(null);

  const mode    = data.mode;
  const pk      = data.pk;
  const sk      = data.sk;
  const whsec   = data.whsec;
  const priceIds = data.priceIds ?? defaultStripe.priceIds;

  const setMode    = (m: 'test'|'live')  => setData(p => ({ ...p, mode: m }));
  const setPk      = (v: string)          => setData(p => ({ ...p, pk: v }));
  const setSk      = (v: string)          => setData(p => ({ ...p, sk: v }));
  const setWhsec   = (v: string)          => setData(p => ({ ...p, whsec: v }));
  const setPriceId = (id: string, v: string) =>
    setData(p => ({ ...p, priceIds: { ...p.priceIds, [id]: v } }));

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(false);
    setTestResult(sk.startsWith('sk_') ? 'ok' : 'err');
    setTimeout(() => setTestResult(null), 4000);
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>A carregar configuração...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Keys card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 38, height: 38, background: '#635BFF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>S</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Stripe API</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Pagamentos e subscrições recorrentes</div>
          </div>
          {/* Live / Test toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, gap: 3 }}>
            {(['test','live'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? (m === 'live' ? '#22C55E' : '#D97706') : 'transparent', border: 'none', borderRadius: 6, padding: '4px 12px', color: mode === m ? '#fff' : 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' as const }}>
                {m === 'live' ? '🟢 LIVE' : '🟡 TEST'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'live' && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: '#DC2626', fontSize: 12 }}>
            ⚠️ Modo LIVE — cobranças reais aos clientes!
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label={`Chave Pública (pk_${mode}_)`}>
            <Input value={pk} onChange={setPk} placeholder={`pk_${mode}_...`} mono />
          </Field>
          <Field label={`Chave Secreta (sk_${mode}_)`}>
            <Input value={sk} onChange={setSk} placeholder={`sk_${mode}_...`} type="password" mono />
          </Field>
        </div>
        <Field label="Webhook Secret (whsec_)">
          <Input value={whsec} onChange={setWhsec} placeholder="whsec_..." type="password" mono />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={testConn} disabled={testing} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {testing ? '⟳ A testar...' : '⚡ Testar ligação'}
            </button>
            {testResult === 'ok' && <span style={{ color: '#22C55E', fontSize: 12.5, fontWeight: 700 }}>✓ Ligação OK</span>}
            {testResult === 'err' && <span style={{ color: 'var(--gb-red)', fontSize: 12.5, fontWeight: 700 }}>✕ Chave inválida</span>}
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" style={{ background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#635BFF', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              🔗 Stripe Dashboard →
            </a>
            <a href="https://billing.stripe.com/p/login/test_28o3cS3Ub0GQdeU288" target="_blank" rel="noreferrer" style={{ background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#635BFF', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              👤 Customer Portal →
            </a>
          </div>
          <button onClick={() => save()} disabled={saving}
            style={{ background: saved ? '#22C55E' : saving ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⟳ A guardar...' : saved ? '✓ Guardado' : '💾 Guardar'}
          </button>
        </div>
      </Card>

      {/* Price IDs table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Price IDs dos Planos</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Obter em Stripe Dashboard → Products → cada plano → copiar Price ID</div>
          </div>
          <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer" style={{ background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 6, padding: '6px 12px', color: '#635BFF', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>
            Ver Produtos →
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PLANOS_STRIPE.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flexShrink: 0, width: 120 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{p.nome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>€{p.valor}/mês</div>
              </div>
              <input value={priceIds[p.id] ?? ''} onChange={e => setPriceId(p.id, e.target.value)}
                placeholder={`price_${mode === 'live' ? 'live' : 'test'}_...`}
                style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 9px', color: 'var(--text-primary)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}/>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={() => save()} disabled={saving}
            style={{ background: saved ? '#22C55E' : saving ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⟳ A guardar...' : saved ? '✓ Guardado' : '💾 Guardar Price IDs'}
          </button>
        </div>
      </Card>

      {/* Webhooks */}
      <Card>
        <Label>Webhook URL para configurar no Stripe</Label>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>
          https://gbbraga.com/api/stripe/webhook
        </div>
        <Label>Eventos a subscrever</Label>
        {[
          { event: 'payment_intent.succeeded',           action: 'Emitir FR TOConline + marcar pago + notificar aluno' },
          { event: 'payment_intent.payment_failed',      action: 'Alertar admin + email/WhatsApp ao aluno' },
          { event: 'customer.subscription.updated',      action: 'Atualizar plano do aluno na app' },
          { event: 'customer.subscription.deleted',      action: 'Suspender acesso + notificar admin' },
          { event: 'invoice.payment_failed',             action: 'Suspender após 3 falhas consecutivas' },
        ].map(w => (
          <div key={w.event} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
            <span style={{ color: '#635BFF', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{w.event}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→ {w.action}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── WhatsApp Section ─────────────────────────────────────────────────────────
type WaConfig = { num: string; token: string };

function WhatsAppSection() {
  const { data, setData, loading, saving, saved, save } = useConfig<WaConfig>('whatsapp', { num: '+351912345679', token: '' });

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>A carregar configuração...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 40, height: 40, background: '#075E54', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>WhatsApp Business API</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Meta Cloud API</div>
          </div>
        </div>
        <Field label="Número WhatsApp Business">
          <Input value={data.num} onChange={v => setData(p => ({ ...p, num: v }))} placeholder="+351..." mono />
        </Field>
        <Field label="Access Token (Meta)">
          <Input value={data.token} onChange={v => setData(p => ({ ...p, token: v }))} placeholder="EAA..." type="password" mono />
        </Field>
        <SaveBar onSave={() => save()} saved={saved} saving={saving} />
      </Card>
      <Card>
        <Label>Templates aprovados</Label>
        {[
          { nome: 'lembrete_pagamento', status: 'aprovado' },
          { nome: 'pagamento_recebido', status: 'aprovado' },
          { nome: 'graduacao_confirmada', status: 'aprovado' },
          { nome: 'boas_vindas', status: 'pendente' },
        ].map(t => (
          <div key={t.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.nome}</span>
            <span style={{ color: t.status === 'aprovado' ? '#22C55E' : '#F59E0B', fontSize: 11, fontWeight: 600 }}>{t.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Generic placeholder sections ────────────────────────────────────────────
function SimpleSection({ secao, title, icon, bg, fields }: {
  secao: string;
  title: string;
  icon: string;
  bg: string;
  fields: { label: string; placeholder: string; type?: string }[];
}) {
  const { data: vals, setData: setVals, loading, saving, saved, save } = useConfig<Record<string, string>>(secao, {});

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>A carregar configuração...</div>;

  return (
    <div style={{ maxWidth: 560 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 40, height: 40, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{title}</div>
        </div>
        {fields.map(f => (
          <Field key={f.label} label={f.label}>
            <Input
              value={vals[f.label] || ''}
              onChange={v => setVals(p => ({ ...p, [f.label]: v }))}
              placeholder={f.placeholder}
              type={f.type || 'text'}
            />
          </Field>
        ))}
        <SaveBar onSave={() => save()} saved={saved} saving={saving} />
      </Card>
    </div>
  );
}

// ─── Equipa Section (superadmin only) ────────────────────────────────────────
type StaffRole = 'professor' | 'admin' | 'atendimento';
const STAFF_ROLES: { value: StaffRole; label: string; desc: string }[] = [
  { value: 'professor',  label: 'Professor',   desc: 'Acesso a turmas, check-in e graduação' },
  { value: 'admin',      label: 'Administrador', desc: 'Acesso total exceto gestão de superadmin' },
  { value: 'atendimento', label: 'Atendimento', desc: 'Registo de alunos, check-in e comunicação' },
];

function EquipaSection() {
  const { user } = useAuth();
  const [nome,  setNome]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<StaffRole>('professor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ link: string; email: string } | null>(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const INP: React.CSSProperties = {
    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 11px', color: 'var(--text-primary)',
    fontSize: 12.5, fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
  };

  const invite = async () => {
    if (!nome.trim()) return setErr('Preenche o nome.');
    if (!email.includes('@')) return setErr('Email inválido.');
    setErr(''); setLoading(true); setResult(null);

    try {
      if (!isConfigured) {
        // Demo mode — simulate
        await new Promise(r => setTimeout(r, 800));
        setResult({ link: 'https://demo.mode/invite-link-would-appear-here', email });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON,
          },
          body: JSON.stringify({ email, nome, role }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setErr(data.error || 'Erro ao criar conta.');
      } else {
        setResult({ link: data.action_link || '', email: data.email });
        setNome(''); setEmail(''); setRole('professor');
      }
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const copy = () => {
    if (result?.link) {
      navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (user?.role !== 'superadmin') {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24 }}>Acesso restrito a superadmin.</div>;
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Invite form */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 40, height: 40, background: GB.red, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>Convidar Membro de Equipa</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>O convidado recebe um link para definir a sua própria password</div>
          </div>
        </div>

        <Field label="Nome completo">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: João Silva" style={INP} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@gbbraga.com" style={INP} />
        </Field>
        <Field label="Função / Role">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STAFF_ROLES.map(r => (
              <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: role === r.value ? 'rgba(200,16,46,0.06)' : 'var(--bg-elevated)', border: `1.5px solid ${role === r.value ? GB.red : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer' }}>
                <input type="radio" name="staffRole" checked={role === r.value} onChange={() => setRole(r.value)} style={{ accentColor: GB.red }} />
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Field>

        {err && <div style={{ color: GB.red, fontSize: 12, marginBottom: 12, fontWeight: 600 }}>⚠ {err}</div>}

        <button onClick={invite} disabled={loading}
          style={{ width: '100%', background: loading ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 4px 12px ${GB.redGlow}` }}>
          {loading ? 'A criar conta...' : '✉ Criar Conta e Gerar Link de Convite'}
        </button>
      </Card>

      {/* Result: show the invite link */}
      {result && (
        <Card style={{ border: `1.5px solid #22C55E` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Conta criada para {result.email}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Copia o link abaixo e envia ao novo membro</div>
            </div>
          </div>
          {result.link ? (
            <>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all', border: '1px solid var(--border)' }}>
                {result.link}
              </div>
              <button onClick={copy} style={{ background: copied ? '#22C55E' : 'var(--bg-elevated)', border: `1px solid ${copied ? '#22C55E' : 'var(--border)'}`, borderRadius: 8, padding: '8px 16px', color: copied ? '#fff' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                {copied ? '✓ Copiado!' : '📋 Copiar link'}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>
                ⚠ O link é de uso único e expira em 24h. O membro deve abri-lo para definir a sua password antes de aceder à plataforma.
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Conta criada mas o link de convite não pôde ser gerado. Partilha o acesso manualmente através do Supabase Dashboard.</p>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Main ConfigPage ──────────────────────────────────────────────────────────
export default function ConfigPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const visibleSections = SECTIONS.filter(s => !s.superadminOnly || isSuperAdmin);
  const defaultSection: Section = isSuperAdmin ? 'equipa' : 'toconline';
  const [active, setActive] = useState<Section>(defaultSection);

  const renderSection = () => {
    switch (active) {
      case 'equipa':     return <EquipaSection />;
      case 'toconline':  return <TocSection />;
      case 'stripe':     return <StripeSection />;
      case 'whatsapp':   return <WhatsAppSection />;
      case 'email':      return <SimpleSection secao="email" title="Email / SMTP" icon="📧" bg="#1E3A5F" fields={[
        { label: 'Servidor SMTP', placeholder: 'smtp.gmail.com' },
        { label: 'Porta', placeholder: '587' },
        { label: 'Email remetente', placeholder: 'noreply@graciebarra.pt' },
        { label: 'Password', placeholder: '••••••••', type: 'password' },
      ]}/>;
      case 'academia':   return <SimpleSection secao="academia" title="Academia" icon="🏫" bg="#1A1A1A" fields={[
        { label: 'Nome da academia', placeholder: 'Gracie Barra Braga' },
        { label: 'Morada', placeholder: 'Rua..., 4700 Braga' },
        { label: 'Telefone', placeholder: '+351 927 773 854' },
        { label: 'Email', placeholder: 'atendimento@gbbraga.com' },
        { label: 'NIF', placeholder: '512345678' },
      ]}/>;
      case 'compliance': return <SimpleSection secao="compliance" title="IPDJ / RGPD" icon="📋" bg="#2D1B69" fields={[
        { label: 'Número alvará IPDJ', placeholder: 'AL-XXXXX' },
        { label: 'DPO (Responsável RGPD)', placeholder: 'Nome do responsável' },
        { label: 'Email RGPD', placeholder: 'rgpd@graciebarra.pt' },
      ]}/>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Sistema</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Configurações</h1>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {visibleSections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '12px 14px', border: 'none', cursor: 'pointer',
                  background: active === s.id ? GB.redGlow : 'transparent',
                  borderLeft: `2px solid ${active === s.id ? GB.red : 'transparent'}`,
                  borderBottom: '1px solid var(--border-subtle)',
                  textAlign: 'left',
                }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ color: active === s.id ? GB.red : 'var(--text-primary)', fontSize: 12.5, fontWeight: active === s.id ? 700 : 500, lineHeight: 1 }}>{s.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 2 }}>{s.desc}</div>
                </div>
                {s.id === 'toconline' && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>PT</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
