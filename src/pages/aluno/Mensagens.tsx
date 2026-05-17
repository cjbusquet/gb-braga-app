// @ts-nocheck
import { useState } from 'react';
import { useAlunos } from '../../lib/useData';
import { mockMensagens } from '../../data/mockData';
import { GB } from '../../lib/gbBrand';
import { useAuth } from '../../lib/auth';

const CANAL_CONFIG = {
  whatsapp: { icon: '💬', label: 'WhatsApp', accent: '#25D366' },
  sms:      { icon: '📱', label: 'SMS',      accent: '#3B82F6' },
  email:    { icon: '📧', label: 'Email',    accent: '#7C3AED' },
  push:     { icon: '🔔', label: 'Push',     accent: '#F59E0B' },
};

const MOCK_INBOX = [
  { id: 'i1', de: 'Gracie Barra Braga', canal: 'whatsapp', assunto: 'Lembrete de Pagamento', corpo: 'Olá Lucas! A tua mensalidade de Maio vence em 3 dias. Valor: €89. Paga aqui: link.graciebarra.pt/pagar', data: '2025-05-02T10:30:00', lida: true,  tipo: 'financeiro' },
  { id: 'i2', de: 'Prof. João Santos',  canal: 'push',     assunto: 'Aula de amanhã',         corpo: 'Amanhã às 7h — Gi Intermediário. Prepara o kimono! Oss! 🥋', data: '2025-05-04T18:00:00', lida: false, tipo: 'turma' },
  { id: 'i3', de: 'Gracie Barra Braga', canal: 'email',    assunto: 'Seminário Especial — Prof. Ricardo Vieira', corpo: 'Temos o prazer de anunciar um seminário especial com o Prof. Ricardo Vieira (Faixa Preta 4° Grau) no próximo sábado, 17 de Maio.\n\nHorário: 10h00 às 13h00\nLocal: Tatame Principal\nInvestimento: €30 (alunos GB com desconto de 50%)\n\nInscrições abertas até dia 14. Vagas limitadas!', data: '2025-04-28T09:00:00', lida: true, tipo: 'evento' },
  { id: 'i4', de: 'Sistema GB',         canal: 'push',     assunto: 'Graduação confirmada! 🎖️', corpo: 'Parabéns Lucas! Foste graduado para Faixa Azul 2° Grau. Cerimónia no próximo sábado. Oss!', data: '2025-03-16T11:00:00', lida: true, tipo: 'graduacao' },
  { id: 'i5', de: 'Gracie Barra Braga', canal: 'email',    assunto: 'Fatura-Recibo emitida — Março 2025', corpo: 'A tua Fatura-Recibo FR 2025/1001 foi emitida.\n\nPlano: Mensal Completo\nValor: €89 (IVA incluído)\nData: 03-03-2025\n\nO PDF está disponível em anexo e também no teu portal.', data: '2025-03-03T14:00:00', lida: true, tipo: 'financeiro' },
];

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  financeiro: { bg: 'rgba(99,91,255,0.08)',  color: '#635BFF' },
  turma:      { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6' },
  evento:     { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
  graduacao:  { bg: 'rgba(167,139,250,0.08)',color: '#A78BFA' },
};

export default function Mensagens() {
  const { data: alunos } = useAlunos();
  const [selected, setSelected] = useState(MOCK_INBOX[1]);
  const [filterCanal, setFilterCanal] = useState('todos');
  const [replyText, setReplyText] = useState('');

  const filtered = MOCK_INBOX.filter(m => filterCanal === 'todos' || m.canal === filterCanal);
  const unread = MOCK_INBOX.filter(m => !m.lida).length;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Aluno</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Mensagens</h1>
          {unread > 0 && <span style={{ background: GB.red, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{unread} novas</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>
        {/* Inbox list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {['todos','email','whatsapp','push'].map(c => (
                <button key={c} onClick={() => setFilterCanal(c)} style={{ background: filterCanal === c ? GB.red : 'var(--bg-elevated)', border: `1px solid ${filterCanal === c ? GB.red : 'var(--border)'}`, borderRadius: 6, padding: '4px 10px', color: filterCanal === c ? '#fff' : 'var(--text-secondary)', fontSize: 11, fontWeight: filterCanal === c ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                  {c === 'todos' ? 'Todos' : CANAL_CONFIG[c as keyof typeof CANAL_CONFIG]?.icon + ' ' + CANAL_CONFIG[c as keyof typeof CANAL_CONFIG]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(msg => {
              const cc = CANAL_CONFIG[msg.canal as keyof typeof CANAL_CONFIG];
              const tc = TIPO_COLORS[msg.tipo] || { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
              const isSelected = selected.id === msg.id;
              return (
                <div key={msg.id} onClick={() => setSelected(msg)} style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                  background: isSelected ? 'rgba(200,16,46,0.04)' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? GB.red : 'transparent'}`,
                }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!msg.lida && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GB.red, flexShrink: 0 }}/>}
                      <span style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: msg.lida ? 500 : 700 }}>{msg.de}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' as const, marginLeft: 8 }}>
                      {new Date(msg.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: msg.lida ? 400 : 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {msg.assunto}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: 'rgba(0,0,0,0.05)', color: cc?.accent || 'var(--text-muted)', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{cc?.icon} {cc?.label}</span>
                    <span style={{ background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{msg.tipo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message detail */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 16 }}>{selected.assunto}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {(() => {
                  const cc = CANAL_CONFIG[selected.canal as keyof typeof CANAL_CONFIG];
                  return <span style={{ background: 'var(--bg-elevated)', color: cc?.accent, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap' as const }}>{cc?.icon} {cc?.label}</span>;
                })()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
              {[
                ['De', selected.de],
                ['Data', new Date(selected.data).toLocaleString('pt-PT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{k}: </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
            <div style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' as const }}>
              {selected.corpo}
            </div>
            {selected.tipo === 'financeiro' && (
              <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                <button style={{ background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  💳 Pagar agora
                </button>
                <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 18px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  📥 Ver fatura PDF
                </button>
              </div>
            )}
          </div>

          {/* Quick reply for WhatsApp */}
          {selected.canal === 'whatsapp' && (
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Responder por WhatsApp..."
                  style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13 }}
                />
                <button style={{ background: '#25D366', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
