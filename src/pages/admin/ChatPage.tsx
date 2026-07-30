import { useState, useRef, useEffect } from 'react';
import { useAlunos } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import type { Aluno } from '../../types';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

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
    <div
      className="flex justify-center items-center font-extrabold rounded-full shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.35,
        background: (bc?.bg || '#888') + '20',
        border: `2px solid ${(bc?.bg || '#888')}40`,
        color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || '#C8102E'),
      }}
    >
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

  // ── shared height ─────────────────────────────────────────────────────────────
  // Desktop: fixed-height panels inside the scrollable layout column
  // Mobile: the window scrolls naturally; chat window fills the viewport
  //         (body scroll lets Chrome auto-hide the address bar — the list is
  //          just a normal list; chat view stretches to 100dvh via position:fixed)
  const chatH = 'calc(100vh - 160px)';

  // ── reusable contact list ──────────────────────────────────────────────────
  const contactList = (
    <div className={['flex overflow-hidden flex-col rounded-lg border shadow-sm border-border bg-card', isMobile ? '' : 'h-full'].join(' ')}>
      <div className="py-3 px-3.5 border-b border-border">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Pesquisar aluno..."
          className="py-2 px-2.5 w-full min-h-11 sm:min-h-0 text-sm rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"/>
      </div>
      <div className="overflow-y-auto flex-1">
        {alunosFiltrados.map(a => {
          const conv = conversas[a.id];
          const naoLidas = conv?.naoLidas || 0;
          const ultimaMsg = conv?.msgs?.[conv.msgs.length - 1];
          const isActive = !isMobile && a.id === alunoAtivo;
          return (
            <button key={a.id} onClick={() => selectAluno(a.id)}
              className={[
                'flex gap-3 items-center w-full text-left cursor-pointer border-b border-border-subtle border-l-[3px] transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
                isMobile ? 'py-3.5 px-4' : 'py-2.5 px-3.5',
                isActive ? 'bg-gb-red/5 border-l-gb-red' : 'bg-transparent border-l-transparent hover:bg-elevated active:bg-elevated',
              ].join(' ')}
            >
              <div className="relative shrink-0">
                <AlunoAvatar aluno={a} size={isMobile ? 44 : 38}/>
                {naoLidas > 0 && (
                  <div className="flex absolute -top-0.5 -right-0.5 justify-center items-center w-[17px] h-[17px] text-[9px] font-extrabold text-white rounded-full border-2 border-card bg-gb-red">
                    {naoLidas}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={['overflow-hidden whitespace-nowrap text-ellipsis text-primary', isMobile ? 'text-sm' : 'text-[13px]', naoLidas > 0 ? 'font-bold' : 'font-medium'].join(' ')}>{a.nome}</span>
                  {conv && <span className="ml-1.5 text-[10.5px] shrink-0 text-muted">{conv.ultimaMsg}</span>}
                </div>
                <div className={['overflow-hidden text-xs whitespace-nowrap text-ellipsis', naoLidas > 0 ? 'font-semibold text-secondary' : 'font-normal text-muted'].join(' ')}>
                  {ultimaMsg ? (ultimaMsg.remetente === 'admin' ? '↩ ' : '') + ultimaMsg.texto : 'Iniciar conversa...'}
                </div>
              </div>
              {isMobile && <span className="text-base shrink-0 text-muted">›</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── reusable chat window ───────────────────────────────────────────────────
  // On mobile: position fixed so it covers the full screen (sits above body scroll)
  const chatWindow = (
    <div
      className={[
        'flex overflow-hidden flex-col shadow-sm bg-card',
        isMobile ? 'fixed inset-0 z-[150]' : 'h-full rounded-lg border border-border',
      ].join(' ')}
    >
      {aluno ? (
        <>
          {/* Header — on mobile has extra top padding for notch */}
          <div
            className={[
              'flex gap-2.5 items-center shrink-0 border-b border-border bg-card',
              isMobile ? 'py-2.5 px-3.5 pt-[calc(env(safe-area-inset-top)+10px)]' : 'py-3 px-[18px]',
            ].join(' ')}
          >
            {/* Back button — mobile only */}
            {isMobile && (
              <button onClick={() => setMobileView('list')}
                className="py-1 pr-1.5 min-h-11 min-w-11 text-xl leading-none bg-none border-none cursor-pointer transition-colors duration-200 shrink-0 text-gb-red hover:text-gb-red-dark active:text-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                ‹
              </button>
            )}
            <AlunoAvatar aluno={aluno} size={isMobile ? 36 : 38}/>
            <div className="flex-1 min-w-0">
              <div className="overflow-hidden text-sm font-bold whitespace-nowrap text-ellipsis text-primary">{aluno.nome}</div>
              <div className="flex gap-1.5 items-center mt-px">
                <div
                  className="w-3 h-1 rounded-sm shrink-0"
                  style={{ background: beltConfig[aluno.faixa]?.bg || '#888', border: aluno.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}
                />
                <span className="overflow-hidden text-[11px] capitalize whitespace-nowrap text-ellipsis text-muted">{beltConfig[aluno.faixa]?.label}{!isMobile && ` · ${aluno.plano}`}</span>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {aluno.whatsapp && (
                <a href={`https://wa.me/${aluno.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className={[
                    'flex gap-1 items-center min-h-11 sm:min-h-0 text-xs font-semibold text-[#25D366] no-underline rounded-sm border transition-colors duration-200 border-[#25D366]/20 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/20',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    isMobile ? 'py-1.5 px-2.5' : 'py-1.5 px-3',
                  ].join(' ')}>
                  {isMobile ? '📱' : '📱 WhatsApp'}
                </a>
              )}
              {!isMobile && (
                <button className="py-1.5 px-3 text-xs rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  Ver perfil →
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className={['flex overflow-y-auto flex-col flex-1 gap-2', isMobile ? 'py-3 px-3.5' : 'py-4 px-[18px]'].join(' ')}>
            {conversa.msgs.length === 0 ? (
              <div className="flex flex-col flex-1 justify-center items-center p-10 text-muted">
                <div className="mb-3 text-4xl opacity-30">💬</div>
                <div className="text-sm">Inicia a conversa com {aluno.nome.split(' ')[0]}</div>
                <div className="mt-1 text-xs">Usa um template ou escreve uma mensagem</div>
              </div>
            ) : (
              conversa.msgs.map(msg => {
                const isAdmin = msg.remetente === 'admin';
                const cCfg = CANAL_CONFIG[msg.canal];
                return (
                  <div key={msg.id} className={['flex', isAdmin ? 'justify-end' : 'justify-start'].join(' ')}>
                    <div className={isMobile ? 'max-w-[85%]' : 'max-w-[72%]'}>
                      <div
                        className="py-2.5 px-3.5 shadow-xs"
                        style={{
                          background: isAdmin ? 'var(--gb-red)' : 'var(--bg-elevated)',
                          borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        }}
                      >
                        <p className={['m-0 text-sm leading-[1.5]', isAdmin ? 'text-white' : 'text-primary'].join(' ')}>{msg.texto}</p>
                      </div>
                      <div className={['flex gap-1.5 items-center mt-1', isAdmin ? 'justify-end' : 'justify-start'].join(' ')}>
                        <span className="font-mono text-[10px] text-muted">{msg.hora}</span>
                        {msg.canal !== 'interno' && <span className="text-[10px] font-semibold" style={{ color: cCfg.color }}>{cCfg.icon}</span>}
                        {isAdmin && <span className={['text-[11px]', msg.lida ? 'text-[#25D366]' : 'text-muted'].join(' ')}>✓✓</span>}
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
            <div className={['overflow-y-auto py-2.5 px-3.5 border-t shrink-0 border-border bg-elevated', isMobile ? 'max-h-[180px]' : 'max-h-[170px]'].join(' ')}>
              <div className="mb-2 text-[10px] font-bold tracking-[0.8px] uppercase text-muted">Templates Rápidos</div>
              <div className="flex flex-col gap-1.5">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => { setTexto(t); setShowTemplates(false); }}
                    className="py-2 px-2.5 min-h-11 text-[13px] leading-[1.4] text-left rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-card text-primary hover:border-gb-red active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar — extra bottom padding for iPhone home indicator */}
          <div
            className={[
              'shrink-0 border-t border-border bg-card',
              isMobile ? 'py-2.5 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]' : 'py-3 px-3.5',
            ].join(' ')}
          >
            {/* Canal + templates row */}
            <div className="flex gap-1.5 items-center mb-2">
              {(Object.entries(CANAL_CONFIG) as [typeof canal, typeof CANAL_CONFIG[typeof canal]][]).map(([id, cfg]) => (
                <button key={id} onClick={() => setCanal(id)}
                  className={[
                    'flex items-center min-h-11 sm:min-h-0 rounded-sm border cursor-pointer transition-colors duration-200',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    isMobile ? 'gap-0 py-1.5 px-2.5 text-base' : 'gap-1.5 py-1 px-2.5 text-[11.5px]',
                    canal === id ? 'font-bold' : 'font-normal border-border bg-elevated text-muted hover:bg-border-subtle active:bg-border-subtle',
                  ].join(' ')}
                  style={canal === id ? { background: cfg.color + '15', borderColor: cfg.color, color: cfg.color } : undefined}
                >
                  {cfg.icon}{!isMobile && ` ${cfg.label}`}
                </button>
              ))}
              <div className="flex-1"/>
              <button onClick={() => setShowTemplates(!showTemplates)}
                className={[
                  'py-1 px-2.5 min-h-11 sm:min-h-0 rounded-sm border cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  isMobile ? 'text-[15px]' : 'text-[11.5px]',
                  showTemplates ? 'border-gb-red text-gb-red bg-gb-red/8 hover:bg-gb-red/15 active:bg-gb-red/15' : 'border-border bg-elevated text-muted hover:bg-border-subtle active:bg-border-subtle',
                ].join(' ')}>
                {isMobile ? '⚡' : '⚡ Templates'}
              </button>
            </div>
            {/* Textarea + send */}
            <div className="flex gap-2 items-end">
              <textarea value={texto} onChange={e => setTexto(e.target.value)}
                placeholder={`Mensagem via ${CANAL_CONFIG[canal].label}...`}
                rows={isMobile ? 1 : 2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }}}
                className="flex-1 py-2.5 px-3.5 font-ui text-sm leading-[1.5] rounded-md border outline-none transition-all duration-200 resize-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"
              />
              <button onClick={enviar} disabled={!texto.trim()}
                className={[
                  'flex justify-center items-center w-11 h-11 text-xl rounded-md border-none shrink-0 transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                  texto.trim() ? 'text-white shadow-red cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'bg-elevated text-muted',
                ].join(' ')}>
                ↑
              </button>
            </div>
            {!isMobile && <div className="mt-1.5 text-[10.5px] text-muted">Enter para enviar · Shift+Enter para nova linha</div>}
          </div>
        </>
      ) : (
        <div className="flex flex-col flex-1 gap-2.5 justify-center items-center text-muted">
          <div className="text-4xl opacity-25">💬</div>
          <div className="text-[13px]">Seleciona um aluno para iniciar</div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Page header — hidden on mobile when in chat view */}
      {(!isMobile || mobileView === 'list') && (
        <PageHeader
          eyebrow="Academia"
          title={<>Chat{totalNaoLidas > 0 && <Badge color="brand">{totalNaoLidas}</Badge>}</>}
        />
      )}

      {/* Desktop: side-by-side grid */}
      {!isMobile && (
        <div className="grid grid-cols-[300px_1fr] gap-4" style={{ height: chatH }}>
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
