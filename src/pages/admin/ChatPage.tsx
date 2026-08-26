import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAlunos } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/common/Toast';
import {
  useConversasQuery,
  useChatMensagensQuery,
  useEnviarChatMensagem,
  useMarcarChatLida,
  useChatRealtime,
} from '../../hooks/useChat';
import { useMarcarNotificacoesPorLinkLidas } from '../../hooks/useNotificacoes';
import { beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import type { Aluno } from '../../types';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import BeltBadge from '../../components/common/BeltBadge';
import {
  Ico,
  CommentIcon,
  DeviceMobileIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  BoltIcon,
  ArrowPathIcon,
} from '../../lib/icons';

const TEMPLATES = [
  'A tua mensalidade vence em 3 dias. Paga aqui: gbbraga.com/central-de-pagamento/',
  'Lembrete: aula hoje às {hora}. Não faltes! Oss!',
  'Parabéns pela graduação! Oss!',
  'Bem-vindo(a) à Gracie Barra Braga! A tua conta está ativa.',
  'A tua mensalidade está em atraso. Por favor regulariza urgentemente.',
];

function formatHora(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmodia = d.toDateString() === hoje.toDateString();
  return mesmodia
    ? d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

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
export default function ChatPage({ onNavigate, initialAlunoId }: { onNavigate?: (page: string, param?: string) => void; initialAlunoId?: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: alunos } = useAlunos();
  const { isMobile } = useMobile();
  const { data: conversas = [] } = useConversasQuery();
  const [alunoAtivo, setAlunoAtivo] = useState<string>('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [texto, setTexto] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [busca, setBusca] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: mensagens = [], isLoading: loadingMsgs } = useChatMensagensQuery(alunoAtivo || undefined);
  const enviarMutation = useEnviarChatMensagem();
  const marcarLidaMutation = useMarcarChatLida();
  const marcarNotificacoesLidas = useMarcarNotificacoesPorLinkLidas();
  useChatRealtime(alunoAtivo || undefined);

  // Opening the Chat page itself clears the bell badge for chat notifications
  useEffect(() => { marcarNotificacoesLidas.mutate('chat'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectAluno = (id: string) => {
    setAlunoAtivo(id);
    if (isMobile) setMobileView('chat');
  };

  // Deep link from "Ver perfil →" (AlunosPage) back into this conversation
  useEffect(() => {
    if (initialAlunoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      selectAluno(initialAlunoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAlunoId]);

  const aluno = alunos.find(a => a.id === alunoAtivo);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alunoAtivo, mensagens]);

  // Mark as read when opening a conversation — the RPC no-ops if there's nothing unread
  useEffect(() => {
    if (alunoAtivo) marcarLidaMutation.mutate(alunoAtivo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoAtivo]);

  const enviar = () => {
    if (!texto.trim() || !alunoAtivo || !user) return;
    const corpo = texto.trim();
    setTexto('');
    setShowTemplates(false);
    enviarMutation.mutate(
      { alunoId: alunoAtivo, remetenteId: user.id, remetenteRole: user.role, corpo },
      { onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao enviar a mensagem. Tenta novamente.') }
    );
  };

  const totalNaoLidas = conversas.reduce((s, c) => s + c.naoLidas, 0);

  const alunosFiltrados = alunos.filter(a =>
    a.status === 'ativo' && a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // ── shared height ─────────────────────────────────────────────────────────────
  const chatH = 'calc(100vh - 160px)';

  // ── reusable contact list ──────────────────────────────────────────────────
  const contactList = (
    <div className={['flex overflow-hidden flex-col rounded-lg border border-border bg-card', isMobile ? '' : 'h-full'].join(' ')}>
      <div className="py-3 px-3.5 border-b border-border">
        <div className="relative">
          <Ico icon={MagnifyingGlassIcon} sm className="absolute top-1/2 left-2.5 text-muted -translate-y-1/2 pointer-events-none" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar aluno..."
            className="py-2 pr-2.5 pl-8 w-full min-h-11 sm:min-h-0 text-sm rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"/>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {alunosFiltrados.map(a => {
          const conv = conversas.find(c => c.alunoId === a.id);
          const naoLidas = conv?.naoLidas || 0;
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
                  {conv?.ultimaData && <span className="ml-1.5 text-[10.5px] shrink-0 text-muted">{formatHora(conv.ultimaData)}</span>}
                </div>
                <div className={['overflow-hidden text-xs whitespace-nowrap text-ellipsis', naoLidas > 0 ? 'font-semibold text-secondary' : 'font-normal text-muted'].join(' ')}>
                  {conv?.ultimaMensagem || 'Iniciar conversa...'}
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
  const chatWindow = (
    <div
      className={[
        'flex overflow-hidden flex-col bg-card',
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
                <BeltBadge faixa={aluno.faixa} grau={aluno.grau || 0} size="sm" />
                {!isMobile && <span className="overflow-hidden text-[11px] whitespace-nowrap text-ellipsis text-muted">· {aluno.plano}</span>}
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
                  {isMobile ? <Ico icon={DeviceMobileIcon} sm /> : <><Ico icon={DeviceMobileIcon} sm /> WhatsApp</>}
                </a>
              )}
              {!isMobile && (
                <button onClick={() => onNavigate?.('alunos', alunoAtivo)} className="py-1.5 px-3 text-xs rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  Ver perfil →
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className={['flex overflow-y-auto flex-col flex-1 gap-2', isMobile ? 'py-3 px-3.5' : 'py-4 px-[18px]'].join(' ')}>
            {loadingMsgs ? (
              <div className="flex flex-1 justify-center items-center text-muted">
                <Ico icon={ArrowPathIcon} />
              </div>
            ) : mensagens.length === 0 ? (
              <div className="flex flex-col flex-1 justify-center items-center p-10 text-muted">
                <FontAwesomeIcon icon={CommentIcon} className="mb-3 w-9 h-9 opacity-30" />
                <div className="text-sm">Inicia a conversa com {aluno.nome.split(' ')[0]}</div>
                <div className="mt-1 text-xs">Usa um template ou escreve uma mensagem</div>
              </div>
            ) : (
              mensagens.map(msg => {
                const isAdmin = msg.remetenteRole !== 'aluno';
                return (
                  <div key={msg.id} className={['flex', isAdmin ? 'justify-end' : 'justify-start'].join(' ')}>
                    <div className={isMobile ? 'max-w-[85%]' : 'max-w-[72%]'}>
                      <div
                        className="py-2.5 px-3.5"
                        style={{
                          background: isAdmin ? 'var(--gb-red)' : 'var(--bg-elevated)',
                          borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        }}
                      >
                        <p className={['m-0 text-sm leading-[1.5]', isAdmin ? 'text-white' : 'text-primary'].join(' ')}>{msg.corpo}</p>
                      </div>
                      <div className={['flex gap-1.5 items-center mt-1', isAdmin ? 'justify-end' : 'justify-start'].join(' ')}>
                        <span className="font-mono text-[10px] text-muted">{formatHora(msg.createdAt)}</span>
                        {isAdmin && (
                          <span className={['flex items-center', msg.lida ? 'text-[#25D366]' : 'text-muted'].join(' ')}>
                            <Ico icon={CheckIcon} sm />
                            <Ico icon={CheckIcon} sm className="-ml-1.5" />
                          </span>
                        )}
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
            <div className="flex gap-1.5 items-center mb-2">
              <div className="flex-1"/>
              <button onClick={() => setShowTemplates(!showTemplates)}
                className={[
                  'py-1 px-2.5 min-h-11 sm:min-h-0 rounded-sm border cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  isMobile ? 'text-[15px]' : 'text-[11.5px]',
                  showTemplates ? 'border-gb-red text-gb-red bg-gb-red/8 hover:bg-gb-red/15 active:bg-gb-red/15' : 'border-border bg-elevated text-muted hover:bg-border-subtle active:bg-border-subtle',
                  'inline-flex gap-1 items-center',
                ].join(' ')}>
                {isMobile ? <Ico icon={BoltIcon} sm /> : <><Ico icon={BoltIcon} sm /> Templates</>}
              </button>
            </div>
            {/* Textarea + send */}
            <div className="flex gap-2 items-end">
              <textarea value={texto} onChange={e => setTexto(e.target.value)}
                placeholder="Escreve uma mensagem..."
                rows={isMobile ? 1 : 2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }}}
                className="flex-1 py-2.5 px-3.5 font-ui text-sm leading-[1.5] rounded-md border outline-none transition-all duration-200 resize-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"
              />
              <button onClick={enviar} disabled={!texto.trim() || enviarMutation.isPending}
                className={[
                  'flex justify-center items-center w-11 h-11 text-xl rounded-md border-none shrink-0 transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                  texto.trim() ? 'text-white cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'bg-elevated text-muted',
                ].join(' ')}>
                {enviarMutation.isPending ? <Ico icon={ArrowPathIcon} /> : '↑'}
              </button>
            </div>
            {!isMobile && <div className="mt-1.5 text-[10.5px] text-muted">Enter para enviar · Shift+Enter para nova linha</div>}
          </div>
        </>
      ) : (
        <div className="flex flex-col flex-1 gap-2.5 justify-center items-center text-muted">
          <FontAwesomeIcon icon={CommentIcon} className="w-9 h-9 opacity-25" />
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
