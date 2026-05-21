import { useState } from 'react';
import { useAlunos } from '../../lib/useData';
import { mockMensagens } from '../../data/mockData';
import { GB } from '../../lib/gbBrand';
import { supabase, isConfigured } from '../../lib/supabaseClient';

type Canal = 'whatsapp' | 'sms' | 'email' | 'push';

const CANAL: Record<Canal, { icon: string; label: string; accent: string; bg: string }> = {
  whatsapp: { icon: '💬', label: 'WhatsApp', accent: '#25D366', bg: 'rgba(37,211,102,0.1)' },
  sms:      { icon: '📱', label: 'SMS',       accent: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  email:    { icon: '📧', label: 'Email',     accent: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  push:     { icon: '🔔', label: 'Push',      accent: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const TEMPLATES = [
  { id: 1, nome: 'Lembrete de Pagamento',  canal: 'whatsapp' as Canal, corpo: 'Olá {nome}! A sua mensalidade de {mes} vence em {dias} dias. Valor: €{valor}. Pague aqui: {link}' },
  { id: 2, nome: 'Pagamento em Atraso',    canal: 'whatsapp' as Canal, corpo: '⚠️ {nome}, a sua mensalidade está em atraso há {dias} dias. Entre em contacto urgentemente.' },
  { id: 3, nome: 'Fatura Emitida',         canal: 'email'    as Canal, corpo: 'Olá {nome}, a sua Fatura-Recibo {numero} foi emitida. Download: {link_pdf}' },
  { id: 4, nome: 'Boas-vindas',            canal: 'email'    as Canal, corpo: 'Bem-vindo(a) à família Gracie Barra Braga, {nome}! A sua jornada começa agora. Oss!' },
  { id: 5, nome: 'Graduação Confirmada',   canal: 'whatsapp' as Canal, corpo: '🎖️ Parabéns {nome}! Foste graduado(a) para a faixa {faixa}! Oss!' },
  { id: 6, nome: 'Cancelamento de Aula',  canal: 'push'     as Canal, corpo: 'Atenção! A aula de {turma} do dia {data} foi cancelada. Pedimos desculpa.' },
  { id: 7, nome: 'Lembrete de Aula',      canal: 'push'     as Canal, corpo: 'Hoje às {hora} — {turma} com Prof. {professor}. Oss!' },
];

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>;
}

function TabBar({ tabs, active, onSelect }: { tabs: { id: string; label: string; icon: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', fontSize: 13, color: active === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active === t.id ? 600 : 400, borderBottom: `2px solid ${active === t.id ? GB.red : 'transparent'}`, marginBottom: -1 }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

export default function ComunicacaoPage() {
  const { data: alunos } = useAlunos();
  const [tab, setTab] = useState<'enviar' | 'historico' | 'templates' | 'automatizacoes'>('enviar');
  const [canal, setCanal] = useState<Canal>('whatsapp');
  const [dest, setDest] = useState('all');
  const [msg, setMsg] = useState('');
  const [assunto, setAssunto] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);

  const handleEnviar = async () => {
    if (!msg.trim()) return;
    setSending(true); setSendErr(''); setSendResult(null);

    // Non-email channels: simulate (WhatsApp/SMS/Push not yet integrated)
    if (canal !== 'email' || !isConfigured) {
      await new Promise(r => setTimeout(r, 800));
      setSending(false);
      setSent(true);
      setMsg('');
      setTimeout(() => { setSent(false); setSendResult(null); }, 4000);
      return;
    }

    // Email: call send-email edge function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON,
          },
          body: JSON.stringify({ dest, assunto, corpo: msg }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setSendErr(data.error || 'Erro ao enviar.');
      } else if (data.sent === 0) {
        // Sent 0 — show first error from batch
        const firstErr = data.errors?.[0] || 'Nenhum email enviado. Verifica as configurações SMTP.';
        setSendErr(firstErr);
      } else {
        setSent(true);
        setSendResult({ sent: data.sent, total: data.total });
        if (data.errors?.length) setSendErr(`${data.errors.length} erro(s): ${data.errors[0]}`);
        setMsg(''); setAssunto('');
        setTimeout(() => { setSent(false); setSendResult(null); setSendErr(''); }, 6000);
      }
    } catch (e) {
      setSendErr(String(e));
    }
    setSending(false);
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setCanal(t.canal);
    setMsg(t.corpo);
    setTab('enviar');
  };

  const totalPorCanal = (c: Canal) => mockMensagens.filter(m => m.canal === c).length;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Academia</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Comunicação</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '3px 0 0' }}>WhatsApp · SMS · Email · Push</p>
      </div>

      {/* Canal stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
          <div key={id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', borderTop: `2px solid ${c.accent}`, cursor: 'pointer' }} onClick={() => { setCanal(id); setTab('enviar'); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ color: c.accent, fontSize: 20, fontWeight: 700 }}>{totalPorCanal(id)}</span>
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginTop: 6 }}>{c.label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>mensagens enviadas</div>
          </div>
        ))}
      </div>

      <TabBar
        active={tab}
        onSelect={s => setTab(s as typeof tab)}
        tabs={[
          { id: 'enviar', label: 'Nova Mensagem', icon: '✉' },
          { id: 'templates', label: 'Templates', icon: '📝' },
          { id: 'automatizacoes', label: 'Automações', icon: '⚡' },
          { id: 'historico', label: 'Histórico', icon: '📋' },
        ]}
      />

      {/* ── ENVIAR ── */}
      {tab === 'enviar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Compor Mensagem</div>

            {/* Canal selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
                <button key={id} onClick={() => setCanal(id)} style={{ background: canal === id ? c.bg : 'var(--bg-elevated)', border: `2px solid ${canal === id ? c.accent : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '8px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ color: canal === id ? c.accent : 'var(--text-muted)', fontSize: 10.5, fontWeight: canal === id ? 700 : 400 }}>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Destinatário */}
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Destinatário</label>
            <select value={dest} onChange={e => setDest(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
              <option value="all">📢 Todos os alunos ativos ({alunos.filter(a => a.status === 'ativo').length})</option>
              <option value="inadimplentes">⚠️ Inadimplentes</option>
              <option value="aniversariantes">🎂 Aniversariantes do mês</option>
              <option value="faixa_branca">⬜ Faixa Branca</option>
              <option value="kids">⭐ Kids</option>
              {alunos.map(a => <option key={a.id} value={a.id}>👤 {a.nome}</option>)}
            </select>

            {/* Assunto (email only) */}
            {canal === 'email' && (
              <>
                <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Assunto</label>
                <input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email..."
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 14 }}/>
              </>
            )}

            {/* Body */}
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Mensagem</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
              placeholder={`Escreva a mensagem...\n\nVariáveis: {nome} {valor} {vencimento} {faixa} {link}`}
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, resize: 'none', fontFamily: 'var(--font-ui)' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{msg.length} caracteres{canal === 'sms' ? ` · ${Math.ceil(msg.length / 160) || 1} SMS` : ''}</span>
              <button onClick={() => setTab('templates')} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>+ Usar template</button>
            </div>

            {sent && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, color: '#22C55E', fontSize: 12, fontWeight: 600 }}>
                ✓ {sendResult ? `${sendResult.sent} de ${sendResult.total} email(s) enviado(s)!` : 'Mensagem enviada com sucesso!'}
              </div>
            )}
            {sendErr && (
              <div style={{ background: 'rgba(200,16,46,0.06)', border: '1px solid rgba(200,16,46,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, color: GB.red, fontSize: 12, fontWeight: 600 }}>
                ⚠ {sendErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>📅 Agendar:</span>
              <input type="datetime-local" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer', flex: 1 }}/>
              <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>ou enviar agora ↓</span>
            </div>
            <button onClick={handleEnviar} disabled={sending || !msg.trim()} style={{ width: '100%', background: sending ? 'var(--bg-elevated)' : CANAL[canal].accent, border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!msg.trim() && !sending) ? 0.5 : 1 }}>
              {sending ? '⟳ A enviar...' : `${CANAL[canal].icon} Enviar via ${CANAL[canal].label}`}
            </button>
          </Card>

          {/* Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Pré-visualização da mensagem</div>

              {canal === 'whatsapp' && (
                <div style={{ background: '#111B21', borderRadius: 10, padding: 14, minHeight: 100 }}>
                  <div style={{ background: '#1F2C34', borderRadius: '8px 8px 8px 0', padding: '10px 12px', maxWidth: '85%', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    <p style={{ fontSize: 13, color: '#E9EDF0', margin: 0, lineHeight: 1.5 }}>{msg || 'A mensagem aparecerá aqui...'}</p>
                    <p style={{ fontSize: 10, color: '#8696A0', margin: '4px 0 0', textAlign: 'right' as const }}>14:32 ✓✓</p>
                  </div>
                </div>
              )}
              {canal === 'sms' && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, minHeight: 100 }}>
                  <div style={{ background: '#3B82F6', borderRadius: '8px 8px 0 8px', padding: '10px 12px', maxWidth: '85%', marginLeft: 'auto' }}>
                    <p style={{ fontSize: 13, color: '#fff', margin: 0, lineHeight: 1.5 }}>{msg || 'Mensagem SMS...'}</p>
                  </div>
                </div>
              )}
              {canal === 'email' && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                    <b style={{ color: 'var(--text-secondary)' }}>De:</b> noreply@graciebarra.pt &nbsp; <b style={{ color: 'var(--text-secondary)' }}>Para:</b> {dest === 'all' ? 'todos os alunos' : dest}
                  </div>
                  {assunto && <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{assunto}</div>}
                  <div style={{ padding: 14, fontSize: 13, color: 'var(--text-secondary)', minHeight: 60, lineHeight: 1.6 }}>{msg || 'Corpo do email...'}</div>
                </div>
              )}
              {canal === 'push' && (
                <div style={{ background: '#1C1C1E', border: '1px solid #2C2C2E', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: GB.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🥋</div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>Gracie Barra Braga</p>
                      <p style={{ fontSize: 12, color: '#ADADAD', margin: 0, lineHeight: 1.4 }}>{msg || 'Notificação push...'}</p>
                      <p style={{ fontSize: 10, color: '#6B6B6B', margin: '4px 0 0' }}>agora</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card style={{ padding: 18 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 12 }}>Estimativa de entrega</div>
              {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{c.icon} {c.label}</span>
                  <span style={{ color: id === canal ? c.accent : 'var(--text-muted)', fontSize: 11, fontWeight: id === canal ? 700 : 400 }}>
                    {id === 'whatsapp' ? '~30s' : id === 'sms' ? '~1min' : id === 'email' ? '~2min' : '~5s'}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TEMPLATES.map(t => {
            const c = CANAL[t.canal];
            return (
              <Card key={t.id} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{t.nome}</span>
                    <span style={{ background: c.bg, color: c.accent, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{c.icon} {c.label}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{t.corpo}</p>
                </div>
                <button onClick={() => applyTemplate(t)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                  Usar →
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── AUTOMAÇÕES ── */}
      {tab === 'automatizacoes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { titulo: 'Lembrete de pagamento', desc: '3 dias antes do vencimento → WhatsApp automático', canal: 'whatsapp' as Canal, ativo: true, trigger: 'Vencimento - 3 dias' },
            { titulo: 'Pagamento em atraso', desc: '1 dia após vencimento → WhatsApp + SMS', canal: 'sms' as Canal, ativo: true, trigger: 'Vencimento + 1 dia' },
            { titulo: 'Fatura emitida', desc: 'Após emissão TOConline → Email com PDF', canal: 'email' as Canal, ativo: true, trigger: 'FR emitida (TOConline)' },
            { titulo: 'Boas-vindas', desc: 'Nova matrícula → Email de boas-vindas', canal: 'email' as Canal, ativo: true, trigger: 'Nova matrícula' },
            { titulo: 'Graduação confirmada', desc: 'Graduação registada → WhatsApp de parabéns', canal: 'whatsapp' as Canal, ativo: false, trigger: 'Graduação registada' },
            { titulo: 'Lembrete de aula', desc: '1h antes da aula → Push notification', canal: 'push' as Canal, ativo: false, trigger: 'Aula - 1 hora' },
          ].map((a, i) => {
            const c = CANAL[a.canal];
            return (
              <Card key={i} style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{a.titulo}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 1 }}>{a.trigger}</div>
                    </div>
                  </div>
                  <div style={{ width: 36, height: 20, background: a.ativo ? '#22C55E' : 'var(--bg-elevated)', border: `1px solid ${a.ativo ? '#22C55E' : 'var(--border)'}`, borderRadius: 99, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: a.ativo ? 18 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }}/>
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <span style={{ background: c.bg, color: c.accent, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{c.label}</span>
                  <span style={{ background: a.ativo ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)', color: a.ativo ? '#22C55E' : 'var(--text-muted)', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{a.ativo ? 'ATIVA' : 'INATIVA'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'historico' && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Canal', 'Destinatário', 'Mensagem', 'Data', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMensagens.map(m => {
                const c = CANAL[m.canal];
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: c.bg, color: c.accent, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{c.icon} {c.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.paraNome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.corpo}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(m.dataEnvio).toLocaleDateString('pt-PT')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: m.status === 'enviado' ? 'rgba(34,197,94,0.1)' : m.status === 'erro' ? 'rgba(200,16,46,0.1)' : 'var(--bg-elevated)', color: m.status === 'enviado' ? '#22C55E' : m.status === 'erro' ? GB.red : 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
