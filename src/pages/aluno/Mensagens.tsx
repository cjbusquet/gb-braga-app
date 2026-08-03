import { useEffect, useRef, useState } from 'react';
import { CommentIcon, Ico, ArrowPathIcon } from '../../lib/icons';
import { useAuth } from '../../lib/auth';
import { useAlunoInfoByEmailQuery } from '../../hooks/useAlunoInfo';
import {
  useChatMensagensQuery,
  useEnviarChatMensagem,
  useMarcarChatLida,
  useChatRealtime,
} from '../../hooks/useChat';
import { useMarcarNotificacoesPorLinkLidas } from '../../hooks/useNotificacoes';
import { useToast } from '../../components/common/Toast';
import PortalPageHeader from './PortalPageHeader';
import Badge from '../../components/common/Badge';

function formatHora(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmodia = d.toDateString() === hoje.toDateString();
  return mesmodia
    ? d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Mensagens() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: alunoInfo } = useAlunoInfoByEmailQuery(user?.email);
  const alunoId = alunoInfo?.id;

  const { data: mensagens = [], isLoading } = useChatMensagensQuery(alunoId);
  const enviarMutation = useEnviarChatMensagem();
  const marcarLidaMutation = useMarcarChatLida();
  const marcarNotificacoesLidas = useMarcarNotificacoesPorLinkLidas();
  useChatRealtime(alunoId);

  const [texto, setTexto] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unread = mensagens.filter(m => m.remetenteRole !== 'aluno' && !m.lida).length;

  useEffect(() => {
    if (alunoId) marcarLidaMutation.mutate(alunoId);
    marcarNotificacoesLidas.mutate('mensagens');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = () => {
    if (!texto.trim() || !alunoId || !user) return;
    const corpo = texto.trim();
    setTexto('');
    enviarMutation.mutate(
      { alunoId, remetenteId: user.id, remetenteRole: 'aluno', corpo },
      { onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao enviar a mensagem. Tenta novamente.') }
    );
  };

  return (
    <div>
      <PortalPageHeader
        title="Mensagens"
        description="Fala diretamente com a Gracie Barra Braga."
        trailing={unread > 0 ? <Badge color="brand">{unread} novas</Badge> : undefined}
      />

      <div className="flex overflow-hidden flex-col rounded-lg border border-border bg-card h-[calc(100vh-220px)] min-h-[420px]">
        {/* Messages */}
        <div className="flex overflow-y-auto flex-col flex-1 gap-2 py-4 px-3.5 sm:px-[18px]">
          {isLoading ? (
            <div className="flex flex-1 justify-center items-center text-muted">
              <Ico icon={ArrowPathIcon} />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex flex-col flex-1 gap-2.5 justify-center items-center text-muted">
              <Ico icon={CommentIcon} lg className="opacity-30" />
              <div className="text-sm">Ainda não há mensagens.</div>
              <div className="text-xs">Escreve à academia — respondemos assim que possível.</div>
            </div>
          ) : (
            mensagens.map(msg => {
              const isMine = msg.remetenteRole === 'aluno';
              return (
                <div key={msg.id} className={['flex', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div
                      className="py-2.5 px-3.5 shadow-xs"
                      style={{
                        background: isMine ? 'var(--gb-red)' : 'var(--bg-elevated)',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      }}
                    >
                      <p className={['m-0 text-sm leading-[1.5]', isMine ? 'text-white' : 'text-primary'].join(' ')}>{msg.corpo}</p>
                    </div>
                    <div className={['mt-1', isMine ? 'text-right' : 'text-left'].join(' ')}>
                      <span className="font-mono text-[10px] text-muted">{formatHora(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input bar */}
        <div className="shrink-0 py-3 px-3.5 pb-[calc(env(safe-area-inset-bottom)+12px)] border-t border-border bg-card sm:px-[18px]">
          <div className="flex gap-2 items-end">
            <textarea value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="Escreve uma mensagem..."
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }}}
              className="flex-1 py-2.5 px-3.5 font-ui text-sm leading-[1.5] rounded-md border outline-none transition-all duration-200 resize-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"
            />
            <button onClick={enviar} disabled={!texto.trim() || !alunoId || enviarMutation.isPending}
              className={[
                'flex justify-center items-center w-11 h-11 text-xl rounded-md border-none shrink-0 transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                texto.trim() ? 'text-white shadow-red cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'bg-elevated text-muted',
              ].join(' ')}>
              {enviarMutation.isPending ? <Ico icon={ArrowPathIcon} /> : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
