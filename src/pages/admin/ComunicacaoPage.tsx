import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { useAlunos, useMensagens, useTemplates, db } from '../../lib/useData';
import { isConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth';
import { sendEmail } from '../../services/api/edgeFunctions';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Tabs from '../../components/common/Tabs';
import Button from '../../components/common/Button';
import {
  Ico,
  type HeroIcon,
  ChatBubbleLeftRightIcon,
  DeviceMobileIcon,
  EnvelopeIcon,
  BellIcon,
  PencilIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SaveIcon,
  TrashIcon,
  CheckIcon,
  CalendarIcon,
  MartialArtsIcon,
} from '../../lib/icons';

type Canal = 'whatsapp' | 'sms' | 'email' | 'push';

const CANAL: Record<Canal, { icon: HeroIcon; label: string; accent: string; bg: string }> = {
  whatsapp: { icon: ChatBubbleLeftRightIcon, label: 'WhatsApp', accent: '#25D366', bg: 'rgba(37,211,102,0.1)' },
  sms:      { icon: DeviceMobileIcon,        label: 'SMS',       accent: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  email:    { icon: EnvelopeIcon,            label: 'Email',     accent: 'var(--gb-red)', bg: 'rgba(200,16,46,0.1)' },
  push:     { icon: BellIcon,                label: 'Push',      accent: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border transition-all duration-200 border-border bg-elevated text-primary outline-none focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const FIELD_LABEL_CLASS = 'block mb-1 text-[10.5px] font-bold tracking-[0.8px] uppercase text-muted';

function TemplatesTab({ templates, onUse, onRefresh }: {
  templates: any[];
  onUse: (t: any) => void;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [nome,    setNome]    = useState('');
  const [canal,   setCanal]   = useState<Canal>('email');
  const [assunto, setAssunto] = useState('');
  const [corpo,   setCorpo]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!nome.trim() || !corpo.trim()) return setErr('Nome e corpo são obrigatórios.');
    setErr(''); setSaving(true);
    try {
      await db.criarTemplate({ nome, canal, assunto, corpo });
      setNome(''); setAssunto(''); setCorpo(''); setCanal('email');
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      setErr(e.message || 'Erro ao guardar template.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este template?')) return;
    setDeleting(id);
    try {
      await db.apagarTemplate(id);
      onRefresh();
    } catch {/* ignore */}
    setDeleting(null);
  };

  return (
    <div>
      {/* Header + novo botão */}
      <div className="flex justify-between items-center mb-3.5">
        <div className="text-xs text-muted">{templates.length} template{templates.length !== 1 ? 's' : ''}</div>
        <Button
          variant={showForm ? 'secondary' : 'primary'} size="sm"
          onClick={() => { setShowForm(s => !s); setErr(''); }}
        >
          {showForm
            ? <><Ico icon={XMarkIcon} sm />Cancelar</>
            : <><Ico icon={PlusIcon} sm />Novo Template</>}
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card padding="lg" className="mb-4">
          <div className="mb-4 text-sm font-bold text-primary">Novo Template</div>
          <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
            <div>
              <div className={FIELD_LABEL_CLASS}>Nome</div>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: Lembrete de pagamento" className={FIELD_CLASS} />
            </div>
            <div>
              <Select label="Canal" value={canal} onChange={e => setCanal(e.target.value as Canal)}>
                {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
                  <option key={id} value={id}>{c.label}</option>
                ))}
              </Select>
            </div>
          </div>
          {canal === 'email' && (
            <div className="mb-3">
              <div className={FIELD_LABEL_CLASS}>Assunto</div>
              <input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" className={FIELD_CLASS} />
            </div>
          )}
          <div className="mb-3">
            <div className={FIELD_LABEL_CLASS}>
              Corpo da mensagem
            </div>
            <textarea
              value={corpo} onChange={e => setCorpo(e.target.value)} rows={4}
              placeholder={'Variáveis: {nome} {valor} {vencimento} {faixa} {link}'}
              className={[FIELD_CLASS, 'resize-y'].join(' ')}
            />
            <div className="mt-1 text-[10.5px] text-muted">
              Variáveis disponíveis: <code>{'{nome}'}</code> <code>{'{valor}'}</code> <code>{'{vencimento}'}</code> <code>{'{faixa}'}</code> <code>{'{link}'}</code>
            </div>
          </div>
          {err && <div className="inline-flex gap-1.5 items-center mb-2.5 text-[11.5px] font-semibold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />{err}</div>}
          <div className="flex justify-end">
            <button onClick={handleCreate} disabled={saving}
              className={[
                'py-2 px-[22px] min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                saving ? 'bg-neutral-400' : 'cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark',
              ].join(' ')}>
              {saving
                ? <span className="inline-flex gap-1.5 items-center"><Ico icon={ArrowPathIcon} sm />A guardar...</span>
                : <span className="inline-flex gap-1.5 items-center"><Ico icon={SaveIcon} sm />Guardar Template</span>}
            </button>
          </div>
        </Card>
      )}

      {/* Lista de templates */}
      <div className="flex flex-col gap-2">
        {templates.length === 0 ? (
          <div className="p-6 text-[13px] text-center text-muted">
            Nenhum template criado ainda.
          </div>
        ) : templates.map((t: any) => {
          const c = CANAL[t.canal as Canal] || CANAL.email;
          return (
            <Card key={t.id} padding="none" className="flex flex-wrap gap-4 justify-between items-center py-3.5 px-[18px]">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 items-center mb-1">
                  <span className="text-[13px] font-semibold text-primary">{t.nome}</span>
                  <span className="inline-flex gap-1 items-center py-0.5 px-1.5 text-[10.5px] font-bold rounded-full shrink-0" style={{ background: c.bg, color: c.accent }}><FontAwesomeIcon icon={c.icon} className="w-2.5 h-2.5" />{c.label}</span>
                </div>
                {t.assunto && <div className="mb-1 text-[11.5px] font-semibold text-secondary">{t.assunto}</div>}
                <p className="overflow-hidden m-0 text-xs leading-[1.5] whitespace-nowrap text-ellipsis text-muted">{t.corpo}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onUse(t)}
                  className="py-1.5 px-3 min-h-11 sm:min-h-0 text-xs font-semibold whitespace-nowrap rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-primary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  Usar →
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  className={[
                    'py-1.5 px-2.5 min-h-11 sm:min-h-0 text-[13px] rounded-sm border transition-colors duration-200 border-gb-red/20 text-gb-red bg-gb-red/[0.07] hover:bg-gb-red/[0.14] active:bg-gb-red/[0.14]',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    deleting === t.id ? 'cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}>
                  {deleting === t.id ? <Ico icon={ArrowPathIcon} sm /> : <Ico icon={TrashIcon} sm />}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ComunicacaoPage() {
  const { user } = useAuth();
  const { data: alunos } = useAlunos();
  const { data: mensagensDB, refetch: refreshMensagens } = useMensagens(200);
  const { data: templatesDB, refetch: refreshTemplates } = useTemplates();
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
      const data = await sendEmail({ dest, assunto, corpo: msg });
      if (data.sent === 0) {
        // Sent 0 — show first error from batch
        const firstErr = data.errors?.[0] || 'Nenhum email enviado. Verifica as configurações SMTP.';
        setSendErr(firstErr);
      } else {
        setSent(true);
        setSendResult({ sent: data.sent, total: data.total });
        if (data.errors?.length) setSendErr(`${data.errors.length} erro(s): ${data.errors[0]}`);

        // Guardar no histórico de mensagens
        const destLabel = dest === 'all' ? 'Todos os alunos ativos'
          : dest === 'inadimplentes' ? 'Inadimplentes'
          : dest === 'aniversariantes' ? 'Aniversariantes do mês'
          : dest === 'faixa_branca' ? 'Faixa Branca'
          : dest === 'kids' ? 'Kids'
          : alunos.find(a => a.id === dest)?.nome || dest;
        try {
          await db.enviarMensagem({
            paraId:    dest,
            paraNome:  destLabel,
            canal:     'email',
            assunto:   assunto || null,
            corpo:     msg,
            remetente: user?.nome || user?.email || 'Staff',
          });
          refreshMensagens();
        } catch { /* não bloquear o fluxo se falhar o registo */ }

        setMsg(''); setAssunto('');
        setTimeout(() => { setSent(false); setSendResult(null); setSendErr(''); }, 6000);
      }
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : String(e));
    }
    setSending(false);
  };

  const mensagens = mensagensDB ?? [];
  const totalPorCanal = (c: Canal) => mensagens.filter((m: any) => m.canal === c).length;

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Comunicação" subtitle="WhatsApp · SMS · Email · Push" />

      {/* Canal stats */}
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
          <button key={id}
            className="py-3 px-3.5 text-left rounded-md border cursor-pointer transition-colors duration-200 border-border bg-card hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
            onClick={() => { setCanal(id); setTab('enviar'); }}>
            <div className="flex justify-between items-start">
              <FontAwesomeIcon icon={c.icon} className="w-5 h-5" style={{ color: c.accent }} />
              <span className="text-xl font-bold" style={{ color: c.accent }}>{totalPorCanal(id)}</span>
            </div>
            <div className="mt-1.5 text-xs font-semibold text-primary">{c.label}</div>
            <div className="text-[10.5px] text-muted">mensagens enviadas</div>
          </button>
        ))}
      </div>

      <Tabs
        active={tab}
        onChange={s => setTab(s as typeof tab)}
        tabs={[
          { id: 'enviar', label: 'Nova Mensagem', icon: <Ico icon={EnvelopeIcon} sm /> },
          { id: 'templates', label: 'Templates', icon: <Ico icon={PencilIcon} sm /> },
          { id: 'automatizacoes', label: 'Automações', icon: <Ico icon={BoltIcon} sm /> },
          { id: 'historico', label: 'Histórico', icon: <Ico icon={ClipboardDocumentIcon} sm /> },
        ]}
      />

      {/* ── ENVIAR ── */}
      {tab === 'enviar' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Compor Mensagem</div>

            {/* Canal selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
                <button key={id} onClick={() => setCanal(id)}
                  className="flex flex-col gap-1 items-center py-2 px-1 min-h-11 rounded-sm border-2 cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                  style={{ background: canal === id ? c.bg : 'var(--bg-elevated)', borderColor: canal === id ? c.accent : 'var(--border)' }}
                >
                  <FontAwesomeIcon icon={c.icon} className="w-[18px] h-[18px]" style={{ color: canal === id ? c.accent : 'var(--text-muted)' }} />
                  <span className="text-[10.5px]" style={{ color: canal === id ? c.accent : 'var(--text-muted)', fontWeight: canal === id ? 700 : 400 }}>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Destinatário */}
            <Select label="Destinatário" value={dest} onChange={e => setDest(e.target.value)} className="mb-3.5">
              <option value="all">Todos os alunos ativos ({alunos.filter(a => a.status === 'ativo').length})</option>
              <option value="inadimplentes">Inadimplentes</option>
              <option value="aniversariantes">Aniversariantes do mês</option>
              <option value="faixa_branca">Faixa Branca</option>
              <option value="kids">Kids</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </Select>

            {/* Assunto (email only) */}
            {canal === 'email' && (
              <>
                <label className={FIELD_LABEL_CLASS}>Assunto</label>
                <input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email..."
                  className={[FIELD_CLASS, 'mb-3.5'].join(' ')}/>
              </>
            )}

            {/* Body */}
            <label className={FIELD_LABEL_CLASS}>Mensagem</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
              placeholder={`Escreva a mensagem...\n\nVariáveis: {nome} {valor} {vencimento} {faixa} {link}`}
              className={[FIELD_CLASS, 'resize-none'].join(' ')}/>
            <div className="flex justify-between mt-1 mb-4">
              <span className="text-[10.5px] text-muted">{msg.length} caracteres{canal === 'sms' ? ` · ${Math.ceil(msg.length / 160) || 1} SMS` : ''}</span>
              <button onClick={() => setTab('templates')} className="py-1 text-[11px] font-semibold text-gb-red bg-none border-none cursor-pointer transition-colors duration-200 hover:text-gb-red-dark active:text-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">+ Usar template</button>
            </div>

            {sent && (
              <div className="inline-flex gap-1.5 items-center py-2.5 px-3.5 mb-3.5 text-xs font-semibold text-gb-green rounded-sm border border-gb-green/25 bg-gb-green/[0.08]">
                <Ico icon={CheckIcon} sm />{sendResult ? `${sendResult.sent} de ${sendResult.total} email(s) enviado(s)!` : 'Mensagem enviada com sucesso!'}
              </div>
            )}
            {sendErr && (
              <div className="inline-flex gap-1.5 items-center py-2.5 px-3.5 mb-3.5 text-xs font-semibold rounded-sm border border-gb-red/20 text-gb-red bg-gb-red/[0.06]">
                <Ico icon={ExclamationTriangleIcon} sm />{sendErr}
              </div>
            )}

            <div className="flex gap-2 items-center py-2 px-3 mb-2.5 rounded-sm bg-elevated">
              <span className="inline-flex gap-1 items-center text-xs text-muted"><Ico icon={CalendarIcon} sm />Agendar:</span>
              <input type="datetime-local" className="flex-1 font-mono text-xs bg-none border-none cursor-pointer text-primary"/>
              <span className="text-[10.5px] text-muted">ou enviar agora ↓</span>
            </div>
            <button onClick={handleEnviar} disabled={sending || !msg.trim()}
              className={[
                'flex gap-2 justify-center items-center py-3 w-full min-h-11 text-[13px] font-bold text-white rounded-sm border-none transition-all duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                sending ? 'bg-elevated' : 'cursor-pointer hover:brightness-90 active:brightness-90',
                (!msg.trim() && !sending) ? 'opacity-50' : 'opacity-100',
              ].join(' ')}
              style={{ background: sending ? undefined : CANAL[canal].accent }}
            >
              {sending
                ? <span className="inline-flex gap-1.5 items-center"><Ico icon={ArrowPathIcon} sm />A enviar...</span>
                : <span className="inline-flex gap-1.5 items-center"><FontAwesomeIcon icon={CANAL[canal].icon} className="w-3.5 h-3.5" />{`Enviar via ${CANAL[canal].label}`}</span>}
            </button>
          </Card>

          {/* Preview */}
          <div className="flex flex-col gap-3.5">
            <Card padding="lg">
              <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Pré-visualização da mensagem</div>

              {canal === 'whatsapp' && (
                <div className="p-3.5 min-h-[100px] rounded-md bg-[#111B21]">
                  <div className="py-2.5 px-3 max-w-[85%] rounded-[8px_8px_8px_0] bg-[#1F2C34]">
                    <p className="m-0 text-[13px] leading-[1.5] text-[#E9EDF0]">{msg || 'A mensagem aparecerá aqui...'}</p>
                    <p className="flex gap-1 justify-end items-center mt-1 mb-0 text-[10px] text-[#8696A0]">14:32 <FontAwesomeIcon icon={faCheckDouble} className="w-2.5 h-2.5" /></p>
                  </div>
                </div>
              )}
              {canal === 'sms' && (
                <div className="p-3.5 min-h-[100px] rounded-md bg-elevated">
                  <div className="py-2.5 px-3 ml-auto max-w-[85%] rounded-[8px_8px_0_8px] bg-[#6B7280]">
                    <p className="m-0 text-[13px] leading-[1.5] text-white">{msg || 'Mensagem SMS...'}</p>
                  </div>
                </div>
              )}
              {canal === 'email' && (
                <div className="rounded-lg border border-border bg-elevated">
                  <div className="py-2 px-3.5 text-[11px] border-b border-border text-muted bg-elevated">
                    <b className="text-secondary">De:</b> noreply@graciebarra.pt &nbsp; <b className="text-secondary">Para:</b> {dest === 'all' ? 'todos os alunos' : dest}
                  </div>
                  {assunto && <div className="py-2 px-3.5 text-xs font-semibold border-b border-border text-primary">{assunto}</div>}
                  <div className="p-3.5 min-h-[60px] text-[13px] leading-[1.6] text-secondary">{msg || 'Corpo do email...'}</div>
                </div>
              )}
              {canal === 'push' && (
                <div className="p-3.5 rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E]">
                  <div className="flex gap-2.5 items-start">
                    <div className="flex justify-center items-center w-10 h-10 rounded-md shrink-0 bg-gb-red"><FontAwesomeIcon icon={MartialArtsIcon} className="w-5 h-5 text-white" /></div>
                    <div>
                      <p className="my-0 mb-0.5 text-xs font-bold text-white">Gracie Barra Braga</p>
                      <p className="m-0 text-xs leading-[1.4] text-[#ADADAD]">{msg || 'Notificação push...'}</p>
                      <p className="mt-1 mb-0 text-[10px] text-[#6B6B6B]">agora</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card padding="lg">
              <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Estimativa de entrega</div>
              {(Object.entries(CANAL) as [Canal, typeof CANAL[Canal]][]).map(([id, c]) => (
                <div key={id} className="flex justify-between py-1.5 border-b border-border-subtle">
                  <span className="inline-flex gap-1 items-center text-xs text-secondary"><FontAwesomeIcon icon={c.icon} className="w-3 h-3" />{c.label}</span>
                  <span className="text-[11px]" style={{ color: id === canal ? c.accent : 'var(--text-muted)', fontWeight: id === canal ? 700 : 400 }}>
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
        <TemplatesTab
          templates={templatesDB ?? []}
          onUse={(t: any) => {
            setCanal(t.canal as Canal);
            setAssunto(t.assunto || '');
            setMsg(t.corpo);
            setTab('enviar');
          }}
          onRefresh={refreshTemplates}
        />
      )}

      {/* ── AUTOMAÇÕES ── */}
      {tab === 'automatizacoes' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
              <Card key={i} padding="lg">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex gap-2 items-center">
                    <FontAwesomeIcon icon={c.icon} className="w-[18px] h-[18px]" style={{ color: c.accent }} />
                    <div>
                      <div className="text-[13px] font-semibold text-primary">{a.titulo}</div>
                      <div className="mt-px text-[10.5px] text-muted">{a.trigger}</div>
                    </div>
                  </div>
                  <div
                    className={['relative w-9 h-5 rounded-full border shrink-0', a.ativo ? 'border-gb-green bg-gb-green' : 'border-border bg-elevated'].join(' ')}
                  >
                    <div className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-[left] duration-200" style={{ left: a.ativo ? 18 : 2 }}/>
                  </div>
                </div>
                <p className="m-0 text-xs leading-[1.5] text-muted">{a.desc}</p>
                <div className="flex gap-1.5 mt-2.5">
                  <Badge color="neutral" style={{ background: c.bg, color: c.accent }}>{c.label}</Badge>
                  <Badge color={a.ativo ? 'success' : 'neutral'}>{a.ativo ? 'ATIVA' : 'INATIVA'}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'historico' && (
        <Card padding="none">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Canal', 'Destinatário', 'Mensagem', 'Data', 'Estado'].map(h => (
                  <th key={h} className="py-2.5 px-3.5 text-[10.5px] font-semibold tracking-[0.5px] text-left uppercase text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mensagens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-[13px] text-center text-muted">
                    Nenhuma mensagem enviada ainda.
                  </td>
                </tr>
              ) : mensagens.map((m: any) => {
                const c = CANAL[m.canal as Canal] || CANAL.email;
                const data = m.enviado_em || m.created_at;
                return (
                  <tr key={m.id} className="border-b border-border-subtle">
                    <td className="py-2.5 px-3.5">
                      <span className="inline-flex gap-1 items-center py-0.5 px-2 text-[11px] font-semibold rounded" style={{ background: c.bg, color: c.accent }}><FontAwesomeIcon icon={c.icon} className="w-2.5 h-2.5" />{c.label}</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-[13px] font-semibold text-primary">{m.para_nome}</td>
                    <td className="py-2.5 px-3.5 text-xs text-secondary max-w-[280px]">
                      {m.assunto && <div className="overflow-hidden mb-0.5 font-semibold whitespace-nowrap text-ellipsis">{m.assunto}</div>}
                      <div className="overflow-hidden whitespace-nowrap text-ellipsis">{m.corpo}</div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] whitespace-nowrap text-muted">
                      {data ? new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <Badge color={m.status === 'enviado' ? 'success' : m.status === 'erro' ? 'danger' : 'neutral'}>
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}
