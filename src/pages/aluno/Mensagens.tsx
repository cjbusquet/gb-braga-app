import { useState } from 'react';
import { BellIcon, ChatBubbleLeftRightIcon, CreditCardIcon, DocumentArrowDownIcon, EnvelopeIcon, Ico, PhoneIcon } from '../../lib/icons';
import PortalPageHeader from './PortalPageHeader';
import Badge from '../../components/common/Badge';

const CANAL_CONFIG = {
  whatsapp: { icon: ChatBubbleLeftRightIcon, label: 'WhatsApp', accent: '#25D366' },
  sms:      { icon: PhoneIcon,               label: 'SMS',      accent: '#3B82F6' },
  email:    { icon: EnvelopeIcon,            label: 'Email',    accent: '#7C3AED' },
  push:     { icon: BellIcon,                label: 'Push',     accent: '#F59E0B' },
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
  const [selected, setSelected] = useState(MOCK_INBOX[1]);
  const [filterCanal, setFilterCanal] = useState('todos');
  const [replyText, setReplyText] = useState('');

  const filtered = MOCK_INBOX.filter(m => filterCanal === 'todos' || m.canal === filterCanal);
  const unread = MOCK_INBOX.filter(m => !m.lida).length;

  return (
    <div>
      <PortalPageHeader
        title="Mensagens"
        description="Consulta as comunicações da Gracie Barra Braga."
        trailing={
          unread > 0 ? <Badge color="brand">{unread} novas</Badge> : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 h-auto lg:grid-cols-[320px_1fr] lg:h-[calc(100vh-160px)]">
        {/* Inbox list */}
        <div className="flex overflow-hidden flex-col rounded-lg border border-border bg-card">
          {/* Filters */}
          <div className="shrink-0 py-3 px-3.5 border-b border-border">
            <div className="flex flex-wrap gap-1.5">
              {['todos','email','whatsapp','push'].map(c => (
                <button key={c} onClick={() => setFilterCanal(c)}
                  className={[
                    'py-1 px-2.5 min-h-11 sm:min-h-0 text-[11px] capitalize rounded-md border cursor-pointer transition-colors duration-200',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    filterCanal === c ? 'font-bold text-white bg-gb-red border-gb-red active:bg-gb-red-dark' : 'font-normal text-secondary bg-elevated border-border hover:bg-card active:bg-card',
                  ].join(' ')}>
                  {c === 'todos' ? 'Todos' : CANAL_CONFIG[c as keyof typeof CANAL_CONFIG]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message list */}
          <div className="overflow-y-auto flex-1">
            {filtered.map(msg => {
              const cc = CANAL_CONFIG[msg.canal as keyof typeof CANAL_CONFIG];
              const tc = TIPO_COLORS[msg.tipo] || { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
              const isSelected = selected.id === msg.id;
              return (
                <div key={msg.id} onClick={() => setSelected(msg)}
                  className={[
                    'py-3 px-3.5 border-b border-border-subtle cursor-pointer transition-colors duration-200',
                    isSelected ? 'bg-gb-red/[0.04]' : 'bg-transparent hover:bg-elevated',
                  ].join(' ')}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex gap-1.5 items-center">
                      {!msg.lida && <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gb-red"/>}
                      <span className={['text-[12.5px] text-primary', msg.lida ? 'font-medium' : 'font-bold'].join(' ')}>{msg.de}</span>
                    </div>
                    <span className="ml-2 text-[10px] whitespace-nowrap text-muted">
                      {new Date(msg.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className={['overflow-hidden mb-1 text-xs whitespace-nowrap text-ellipsis text-primary', msg.lida ? 'font-normal' : 'font-semibold'].join(' ')}>
                    {msg.assunto}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="inline-flex gap-1 items-center py-px px-1.5 text-[10px] font-semibold rounded bg-black/5" style={{ color: cc?.accent || 'var(--text-muted)' }}>{cc && <Ico icon={cc.icon} sm />}{cc?.label}</span>
                    <span className="py-px px-1.5 text-[10px] font-semibold rounded" style={{ background: tc.bg, color: tc.color }}>{msg.tipo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message detail */}
        <div className="flex overflow-hidden flex-col rounded-lg border border-border bg-card">
          {/* Header */}
          <div className="shrink-0 py-[18px] px-[22px] border-b border-border">
            <div className="flex justify-between items-start mb-2.5">
              <h2 className="flex-1 pr-4 m-0 text-base font-bold leading-[1.3] text-primary">{selected.assunto}</h2>
              <div className="flex gap-1.5">
                {(() => {
                  const cc = CANAL_CONFIG[selected.canal as keyof typeof CANAL_CONFIG];
                  return (
                    <span className="inline-flex gap-1.5 items-center py-1 px-2.5 text-[11px] font-semibold whitespace-nowrap rounded-md bg-elevated" style={{ color: cc?.accent }}>
                      {cc && <Ico icon={cc.icon} sm />}{cc?.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                ['De', selected.de],
                ['Data', new Date(selected.data).toLocaleString('pt-PT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-[11px] text-muted">{k}: </span>
                  <span className="text-[11px] font-medium text-secondary">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-[22px]">
            <div className="text-sm leading-[1.8] whitespace-pre-wrap text-primary">
              {selected.corpo}
            </div>
            {selected.tipo === 'financeiro' && (
              <div className="flex gap-2.5 mt-6">
                <button className="py-2 px-[18px] min-h-11 sm:min-h-0 text-[13px] font-semibold text-white rounded-sm border-none cursor-pointer bg-[#635BFF] transition-all duration-200 hover:bg-[#5851E6] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2">
                  <span className="inline-flex gap-1.5 items-center"><Ico icon={CreditCardIcon} sm />Pagar agora</span>
                </button>
                <button className="py-2 px-[18px] min-h-11 sm:min-h-0 text-[13px] rounded-sm border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card hover:text-primary active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  <span className="inline-flex gap-1.5 items-center"><Ico icon={DocumentArrowDownIcon} sm />Ver fatura PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick reply for WhatsApp */}
          {selected.canal === 'whatsapp' && (
            <div className="shrink-0 py-3.5 px-[22px] border-t border-border">
              <div className="flex gap-2.5">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Responder por WhatsApp..."
                  className="flex-1 py-2 px-3 min-h-11 sm:min-h-0 text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"
                />
                <button className="py-2 px-4 min-h-11 sm:min-h-0 text-[13px] font-semibold text-white rounded-sm border-none cursor-pointer bg-[#25D366] transition-all duration-200 hover:bg-[#1FB157] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2">
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
