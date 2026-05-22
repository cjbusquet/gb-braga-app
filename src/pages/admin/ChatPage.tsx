import { useState, useRef, useEffect } from 'react';
import { useAlunos } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import type { Aluno } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg {
  id: string;
  remetente: 'admin' | 'aluno';
  texto: string;
  hora: string;
  canal: 'interno' | 'whatsapp' | 'sms';
  lida: boolean;
}

interface Conversa {
  alunoId: string;
  msgs: ChatMsg[];
  ultimaMsg: string;
  naoLidas: number;
}

// ─── Mock conversations ───────────────────────────────────────────────────────
const CONVERSAS_INIT: Record<string, Conversa> = {
  a2: {
    alunoId: 'a2', ultimaMsg: '10:32', naoLidas: 2,
    msgs: [
      { id: 'm1', remetente: 'admin', texto: 'Olá Maria! A tua mensalidade de Maio vence em 3 dias. Valor: €62.', hora: '10:28', canal: 'interno', lida: true },
      { id: 'm2', remetente: 'aluno', texto: 'Obrigada pelo aviso! Vou pagar já hoje.', hora: '10:31', canal: 'interno', lida: false },
      { id: 'm3', remetente: 'aluno', texto: 'Posso pagar por transferência?', hora: '10:32', canal: 'interno', lida: false },
    ]
  },
  a4: {
    alunoId: 'a4', ultimaMsg: '09:15', naoLidas: 0,
    msgs: [
      { id: 'm4', remetente: 'admin', texto: 'Ana, a tua mensalidade de Abril está vencida há 16 dias. Por favor regulariza a situação.', hora: '09:10', canal: 'interno', lida: true },
      { id: 'm5', remetente: 'aluno', texto: 'Peço desculpa, tive uma situação familiar. Posso pagar na sexta?', hora: '09:15', canal: 'interno', lida: true },
    ]
  },
  a1: {
    alunoId: 'a1', ultimaMsg: 'ontem', naoLidas: 0,
    msgs: [
      { id: 'm6', remetente: 'aluno', texto: 'Bom dia! Posso faltar à aula de amanhã? Tenho uma reunião de trabalho.', hora: 'ontem 18:44', canal: 'interno', lida: true },
      { id: 'm7', remetente: 'admin', texto: 'Claro Lucas, sem problema! Podes compensar sábado no Open Mat.', hora: 'ontem 19:02', canal: 'interno', lida: true },
    ]
  },
  a6: {
    alunoId: 'a6', ultimaMsg: '08:50', naoLidas: 1,
    msgs: [
      { id: 'm8', remetente: 'aluno', texto: 'Olá! Queria saber se é possível mudar para o plano Família para incluir o meu marido.', hora: '08:50', canal: 'interno', lida: false },
    ]
  },
};

const TEMPLATES = [
  'A tua mensalidade vence em 3 dias. Paga aqui: gbbraga.com/central-de-pagamento/',
  'Lembrete: aula hoje às {hora}. Não faltes! Oss! 🥋',
  'Parabéns pela graduação! Oss! 🎖️',
  'Bem-vindo(a) à Gracie Barra Braga! A tua conta está ativa.',
  'A tua mensalidade está em atraso. Por favor regulariza urgentemente.',
];

// ─── Components ───────────────────────────────────────────────────────────────
function AlunoAvatar({ aluno, size = 38 }: { aluno: Aluno; size?: number }) {
  const bc = beltConfig[aluno.faixa];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: (bc?.bg || '#888') + '20', border: `2px solid ${(bc?.bg || '#888')}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || '#C8102E'), fontSize: size * 0.35, fontWeight: 800, flexShrink: 0 }}>
      {aluno.nome.charAt(0)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { data: alunos } = useAlunos();
  const { isMobile } = useMobile();
  const [conversas, setConversas] = useState(CONVERSAS_INIT);
  const [alunoAtivo, setAlunoAtivo] = useState<string>('a2');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [texto, setTexto] = useState('');
  const [canal, setCanal] = useState<'interno' | 'whatsapp' | 'sms'>('interno');
  const [showTemplates, setShowTemplates] = useState(false);
  const [busca, setBusca] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectAluno = (id: string) => {
    setAlunoAtivo(id);
    if (isMobile) setMobileView('chat');
  };

  const aluno = alunos.find(a => a.id === alunoAtivo);
  const conversa = conversas[alunoAtivo] || { alunoId: alunoAtivo, msgs: [], ultimaMsg: '—', naoLidas: 0 };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alunoAtivo, conversas]);

  // Mark as read when opening
  useEffect(() => {
    if (alunoAtivo && conversas[alunoAtivo]?.naoLidas > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversas(prev => ({
        ...prev,
        [alunoAtivo]: { ...prev[alunoAtivo], naoLidas: 0, msgs: prev[alunoAtivo].msgs.map(m => ({ ...m, lida: true })) }
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoAtivo]);

  const enviar = () => {
    if (!texto.trim()) return;
    const newMsg: ChatMsg = {
      id: `m${Date.now()}`,
      remetente: 'admin',
      texto: texto.trim(),
      hora: new Date().toTimeString().slice(0, 5),
      canal,
      lida: true,
    };
    setConversas(prev => ({
      ...prev,
      [alunoAtivo]: {
        ...(prev[alunoAtivo] || { alunoId: alunoAtivo, naoLidas: 0 }),
        msgs: [...(prev[alunoAtivo]?.msgs || []), newMsg],
        ultimaMsg: newMsg.hora,
      }
    }));
    setTexto('');
    setShowTemplates(false);
  };

  const totalNaoLidas = Object.values(conversas).reduce((s, c) => s + c.naoLidas, 0);

  const alunosFiltrados = alunos.filter(a =>
    a.status === 'ativo' && a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const CANAL_CONFIG = {
    interno: { icon: '💬', label: 'Chat interno', color: 'var(--gb-red)' },
    whatsapp: { icon: '📱', label: 'WhatsApp', color: '#25D366' },
    sms:      { icon: '📟', label: 'SMS', color: '#3B82F6' },
  };

  // ── shared height: fills viewport minus top bar + bottom nav ─────────────────
  const chatH = isMobile
    ? 'calc(100dvh - 56px - 72px - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 28px)'
    : 'calc(100vh - 160px)';

  // ── reusable contact list ──────────────────────────────────────────────────
  const contactList = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', height: isMobile ? chatH : '100%' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Pesquisar aluno..."
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 11px', fontSize: 14, color: 'var(--text-primary)' }}/>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {alunosFiltrados.map(a => {
          const conv = conversas[a.id];
          const naoLidas = conv?.naoLidas || 0;
          const ultimaMsg = conv?.msgs?.[conv.msgs.length - 1];
          const isActive = !isMobile && a.id === alunoAtivo;
          return (
            <div key={a.id} onClick={() => selectAluno(a.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '13px 16px' : '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: isActive ? 'rgba(200,16,46,0.05)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--gb-red)' : 'transparent'}` }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <AlunoAvatar aluno={a} size={isMobile ? 44 : 38}/>
                {naoLidas > 0 && <div style={{ position: 'absolute', top: -2, right: -2, width: 17, height: 17, borderRadius: '50%', background: 'var(--gb-red)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>{naoLidas}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: isMobile ? 14 : 13, fontWeight: naoLidas > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.nome}</span>
                  {conv && <span style={{ color: 'var(--text-muted)', fontSize: 10.5, flexShrink: 0, marginLeft: 6 }}>{conv.ultimaMsg}</span>}
                </div>
                <div style={{ color: naoLidas > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontWeight: naoLidas > 0 ? 600 : 400 }}>
                  {ultimaMsg ? (ultimaMsg.remetente === 'admin' ? '↩ ' : '') + ultimaMsg.texto : 'Iniciar conversa...'}
                </div>
              </div>
              {isMobile && <span style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>›</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── reusable chat window ───────────────────────────────────────────────────
  const chatWindow = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: isMobile ? 0 : 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', height: isMobile ? chatH : '100%' }}>
      {aluno ? (
        <>
          {/* Header */}
          <div style={{ padding: isMobile ? '10px 14px' : '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg-card)' }}>
            {/* Back button — mobile only */}
            {isMobile && (
              <button onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', color: 'var(--gb-red)', fontSize: 20, cursor: 'pointer', padding: '4px 6px 4px 0', lineHeight: 1, flexShrink: 0 }}>
                ‹
              </button>
            )}
            <AlunoAvatar aluno={aluno} size={isMobile ? 36 : 38}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: isMobile ? 14 : 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{aluno.nome}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <div style={{ width: 12, height: 4, background: beltConfig[aluno.faixa]?.bg || '#888', borderRadius: 2, border: aluno.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none', flexShrink: 0 }}/>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{beltConfig[aluno.faixa]?.label}{!isMobile && ` · ${aluno.plano}`}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {aluno.whatsapp && (
                <a href={`https://wa.me/${aluno.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--radius-sm)', padding: isMobile ? '6px 10px' : '6px 12px', color: '#25D366', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isMobile ? '📱' : '📱 WhatsApp'}
                </a>
              )}
              {!isMobile && (
                <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                  Ver perfil →
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px' : '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversa.msgs.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>💬</div>
                <div style={{ fontSize: 14 }}>Inicia a conversa com {aluno.nome.split(' ')[0]}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Usa um template ou escreve uma mensagem</div>
              </div>
            ) : (
              conversa.msgs.map(msg => {
                const isAdmin = msg.remetente === 'admin';
                const cCfg = CANAL_CONFIG[msg.canal];
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: isMobile ? '85%' : '72%' }}>
                      <div style={{ background: isAdmin ? 'var(--gb-red)' : 'var(--bg-elevated)', borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 13px', boxShadow: 'var(--shadow-xs)' }}>
                        <p style={{ color: isAdmin ? '#fff' : 'var(--text-primary)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{msg.texto}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{msg.hora}</span>
                        {msg.canal !== 'interno' && <span style={{ fontSize: 10, color: cCfg.color, fontWeight: 600 }}>{cCfg.icon}</span>}
                        {isAdmin && <span style={{ color: msg.lida ? '#25D366' : 'var(--text-muted)', fontSize: 11 }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Templates panel */}
          {showTemplates && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', background: 'var(--bg-elevated)', flexShrink: 0, maxHeight: isMobile ? 180 : 170, overflowY: 'auto' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 7 }}>Templates Rápidos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => { setTexto(t); setShowTemplates(false); }}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 11px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left' as const, cursor: 'pointer', lineHeight: 1.4 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gb-red)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: isMobile ? '10px 12px' : '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-card)' }}>
            {/* Canal + templates row */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'center' }}>
              {(Object.entries(CANAL_CONFIG) as [typeof canal, typeof CANAL_CONFIG[typeof canal]][]).map(([id, cfg]) => (
                <button key={id} onClick={() => setCanal(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 5, background: canal === id ? cfg.color + '15' : 'var(--bg-elevated)', border: `1px solid ${canal === id ? cfg.color : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: isMobile ? '5px 10px' : '4px 10px', fontSize: isMobile ? 16 : 11.5, color: canal === id ? cfg.color : 'var(--text-muted)', fontWeight: canal === id ? 700 : 400, cursor: 'pointer' }}>
                  {cfg.icon}{!isMobile && ` ${cfg.label}`}
                </button>
              ))}
              <div style={{ flex: 1 }}/>
              <button onClick={() => setShowTemplates(!showTemplates)}
                style={{ background: showTemplates ? 'rgba(200,16,46,0.08)' : 'var(--bg-elevated)', border: `1px solid ${showTemplates ? 'var(--gb-red)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: isMobile ? 15 : 11.5, color: showTemplates ? 'var(--gb-red)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {isMobile ? '⚡' : '⚡ Templates'}
              </button>
            </div>
            {/* Textarea + send */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea value={texto} onChange={e => setTexto(e.target.value)}
                placeholder={`Mensagem via ${CANAL_CONFIG[canal].label}...`}
                rows={isMobile ? 1 : 2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }}}
                style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 13px', fontSize: 14, color: 'var(--text-primary)', resize: 'none' as const, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
              />
              <button onClick={enviar} disabled={!texto.trim()}
                style={{ background: texto.trim() ? 'var(--gb-red)' : 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-md)', width: 44, height: 44, flexShrink: 0, color: texto.trim() ? '#fff' : 'var(--text-muted)', fontSize: 20, cursor: texto.trim() ? 'pointer' : 'not-allowed', boxShadow: texto.trim() ? 'var(--shadow-red)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ↑
              </button>
            </div>
            {!isMobile && <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 5 }}>Enter para enviar · Shift+Enter para nova linha</div>}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 36, opacity: 0.25 }}>💬</div>
          <div style={{ fontSize: 13 }}>Seleciona um aluno para iniciar</div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Page header — hidden on mobile when in chat view */}
      {(!isMobile || mobileView === 'list') && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Academia</div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 10 }}>
              Chat
              {totalNaoLidas > 0 && <span style={{ background: 'var(--gb-red)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>{totalNaoLidas}</span>}
            </h1>
          </div>
        </div>
      )}

      {/* Desktop: side-by-side grid */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: chatH }}>
          {contactList}
          {chatWindow}
        </div>
      )}

      {/* Mobile: single-panel navigation */}
      {isMobile && (
        <div>
          {mobileView === 'list' && contactList}
          {mobileView === 'chat' && chatWindow}
        </div>
      )}
    </div>
  );
}
