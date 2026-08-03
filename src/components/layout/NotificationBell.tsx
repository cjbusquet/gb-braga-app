import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BellIcon, CheckIcon } from '../../lib/icons';
import {
  useNotificacoesQuery,
  useMarcarNotificacaoLida,
  useMarcarTodasNotificacoesLidas,
  useNotificacoesRealtime,
} from '../../hooks/useNotificacoes';
import type { Notificacao } from '../../types';

const TIPO_DOT: Record<Notificacao['tipo'], string> = {
  info: '#3B82F6',
  sucesso: '#22C55E',
  aviso: '#F59E0B',
  erro: 'var(--gb-red)',
};

function formatRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

interface NotificationBellProps {
  onNavigate: (page: string) => void;
  accent: string;
}

export default function NotificationBell({ onNavigate, accent }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: notificacoes = [] } = useNotificacoesQuery();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasNotificacoesLidas();
  useNotificacoesRealtime();

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSelect = (n: Notificacao) => {
    if (!n.lida) marcarLida.mutate(n.id);
    if (n.link) onNavigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notificações"
        className="flex relative justify-center items-center p-2 -m-2 text-muted bg-transparent rounded-full border-none outline-none transition-colors duration-200 cursor-pointer hover:text-primary hover:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card active:bg-elevated"
      >
        <FontAwesomeIcon icon={BellIcon} className="w-[18px] h-[18px]" />
        {naoLidas > 0 && (
          <span className="flex absolute top-0.5 right-0.5 justify-center items-center min-w-[15px] h-[15px] px-1 text-[9px] font-bold text-white rounded-full bg-gb-red">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="overflow-hidden absolute right-0 top-full z-[300] mt-2 w-[min(340px,88vw)] rounded-lg border shadow-[0_12px_32px_rgba(0,0,0,0.18)] border-border bg-card">
          <div className="flex justify-between items-center py-2.5 px-3.5 border-b border-border">
            <span className="text-[12.5px] font-bold text-primary">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="inline-flex gap-1 items-center text-[11px] font-semibold bg-none border-none cursor-pointer transition-colors duration-200 outline-none"
                style={{ color: accent }}
              >
                <FontAwesomeIcon icon={CheckIcon} className="w-2.5 h-2.5" />Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[360px]">
            {notificacoes.length === 0 ? (
              <div className="p-6 text-[12.5px] text-center text-muted">Sem notificações.</div>
            ) : notificacoes.map(n => (
              <button
                key={n.id}
                onClick={() => handleSelect(n)}
                className={[
                  'flex gap-2.5 items-start py-2.5 px-3.5 w-full text-left border-b border-border-subtle cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset',
                  n.lida ? 'bg-transparent hover:bg-elevated' : 'bg-gb-red/[0.04] hover:bg-gb-red/[0.07]',
                ].join(' ')}
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: n.lida ? 'transparent' : TIPO_DOT[n.tipo] }} />
                <div className="flex-1 min-w-0">
                  <div className={['text-[12.5px] text-primary', n.lida ? 'font-medium' : 'font-bold'].join(' ')}>{n.titulo}</div>
                  <div className="overflow-hidden mt-0.5 text-xs text-ellipsis line-clamp-2 text-secondary">{n.corpo}</div>
                  <div className="mt-1 text-[10.5px] text-muted">{formatRelativo(n.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
