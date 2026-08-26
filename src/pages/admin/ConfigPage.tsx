import { useState } from 'react';
import type React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GB } from '../../lib/gbBrand';
import { defaultTocConfig } from '../../data/mockData';
import { supabase, isConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth';
import { useMobile } from '../../lib/useMobile';
import { useConfiguracaoSection } from '../../hooks/useConfiguracoes';
import { useStaffListQuery, useUpdateProfile, type StaffMember } from '../../hooks/useProfile';
import { inviteStaff } from '../../services/api/edgeFunctions';
import { haversineDistanceMeters } from '../../services/geo';
import type { TocConfig } from '../../types';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import BeltBadge from '../../components/common/BeltBadge';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Ico,
  type HeroIcon,
  UsersIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  SchoolIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  SaveIcon,
  BoltIcon,
  BookIcon,
  CrownIcon,
  PhoneIcon,
  KeyIcon,
  MartialArtsIcon,
  Cog6ToothIcon,
  PlusIcon,
  UserIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FlaskIcon,
  MapPinIcon,
} from '../../lib/icons';

type Section = 'equipa' | 'toconline' | 'stripe' | 'whatsapp' | 'email' | 'academia' | 'compliance';

const SECTIONS: { id: Section; label: string; icon: HeroIcon; desc: string; superadminOnly?: boolean }[] = [
  { id: 'equipa',     label: 'Equipa',             icon: UsersIcon, desc: 'Convidar professores e staff' },
  { id: 'toconline',  label: 'TOConline',           icon: ReceiptPercentIcon, desc: 'Faturação certificada AT' },
  { id: 'stripe',     label: 'Stripe',              icon: CreditCardIcon, desc: 'Pagamentos online' },
  { id: 'whatsapp',   label: 'WhatsApp Business',   icon: ChatBubbleLeftRightIcon, desc: 'Comunicação com alunos' },
  { id: 'email',      label: 'Email / SMTP',         icon: EnvelopeIcon, desc: 'Notificações por email' },
  { id: 'academia',   label: 'Academia',             icon: SchoolIcon, desc: 'Dados gerais e horários' },
  { id: 'compliance', label: 'IPDJ / RGPD',          icon: ClipboardDocumentIcon, desc: 'Legal e conformidade' },
];

// Config sections now load/save via useConfiguracaoSection (src/hooks/useConfiguracoes.ts),
// a TanStack Query hook wrapping the `configuracoes` table.

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', mono = false }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={[
        'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25',
        mono ? 'font-mono' : 'font-ui',
      ].join(' ')}
    />
  );
}

function SaveBar({ onSave, saved, saving = false }: { onSave: () => void; saved: boolean; saving?: boolean }) {
  return (
    <div className="flex justify-end mt-5">
      <button onClick={onSave} disabled={saving}
        className={[
          'flex gap-2 items-center py-2.5 px-[22px] min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none transition-all duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
          saving ? 'opacity-70' : 'cursor-pointer opacity-100 hover:brightness-90 active:brightness-90',
        ].join(' ')}
        style={{ background: saved ? '#22C55E' : GB.red }}
      >
        {saving
          ? <span className="inline-flex gap-1.5 items-center"><Ico icon={ArrowPathIcon} sm />A guardar...</span>
          : saved
          ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Guardado</span>
          : <span className="inline-flex gap-1.5 items-center"><Ico icon={SaveIcon} sm />Guardar Configuração</span>}
      </button>
    </div>
  );
}

// ─── TOConline Section ────────────────────────────────────────────────────────
function TocSection() {
  const { data: cfg, setData: setCfg, loading, saving, saved, save } = useConfiguracaoSection<TocConfig>('toconline', defaultTocConfig);

  const update = (key: keyof TocConfig, val: string | boolean) =>
    setCfg(c => ({ ...c, [key]: val }));

  if (loading) return <div className="p-6 text-[13px] text-muted">A carregar configuração...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left: form */}
      <Card padding="none" className="p-[22px]">
        <div className="flex gap-2.5 items-center pb-4 mb-5 border-b border-border-subtle">
          <div className="flex justify-center items-center w-10 h-10 rounded-md bg-gb-red-glow"><FontAwesomeIcon icon={ReceiptPercentIcon} className="w-5 h-5 text-gb-red" /></div>
          <div>
            <div className="text-[15px] font-bold text-primary">TOConline</div>
            <div className="text-[11px] text-muted">Faturação certificada pela Autoridade Tributária</div>
          </div>
        </div>

        {/* Simulation toggle */}
        <div
          className={[
            'flex justify-between items-center py-2.5 px-3.5 mb-[18px] rounded-sm border',
            cfg.simulationMode ? 'border-amber-500/25 bg-amber-500/[0.07]' : 'border-gb-green/25 bg-gb-green/[0.07]',
          ].join(' ')}
        >
          <div>
            <div className={['text-xs font-bold', cfg.simulationMode ? 'text-amber-500' : 'text-gb-green'].join(' ')}>
              {cfg.simulationMode
                ? <span className="inline-flex gap-1.5 items-center"><Ico icon={BoltIcon} sm />Modo Simulação</span>
                : <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Modo Produção</span>}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">
              {cfg.simulationMode ? 'Não emite faturas reais — ideal para testes' : 'Faturas comunicadas à AT em tempo real'}
            </div>
          </div>
          <button onClick={() => update('simulationMode', !cfg.simulationMode)}
            className={[
              'py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[11px] font-bold text-white rounded-full border-none cursor-pointer transition-all duration-200 hover:brightness-90 active:brightness-90',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              cfg.simulationMode ? 'bg-amber-500' : 'bg-gb-green',
            ].join(' ')}>
            {cfg.simulationMode ? 'Ativar Produção' : 'Ativar Simulação'}
          </button>
        </div>

        <div className="py-2.5 px-3.5 mb-[18px] text-xs rounded-lg border border-border-subtle bg-elevated text-secondary">
          Client ID e Client Secret são geridos como variáveis de ambiente no deployment, nunca nesta interface.
        </div>

        <Label>Dados da Empresa</Label>
        <Field label="Nome da empresa">
          <Input value={cfg.empresaNome} onChange={v => update('empresaNome', v)} placeholder="Gracie Barra Braga, Lda." />
        </Field>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="NIF">
            <Input value={cfg.empresaNIF} onChange={v => update('empresaNIF', v)} placeholder="512345678" mono />
          </Field>
          <Field label="Série de documentos">
            <Input value={cfg.serieDocumentos} onChange={v => update('serieDocumentos', v)} placeholder="GB2025" mono />
          </Field>
        </div>

        <div className="flex gap-2 mt-1.5">
          <Button2 saving={saving} saved={saved} onClick={() => save()} className="flex-1" />
        </div>
      </Card>

      {/* Right: guide + status */}
      <div className="flex flex-col gap-3.5">
        {/* Status summary */}
        <Card padding="none" className="p-[22px]">
          <Label>Estado dos Serviços TOConline</Label>
          {[
            { label: 'OAuth / Autenticação', ok: true },
            { label: 'Emissão de Faturas-Recibo (FR)', ok: true },
            { label: 'Download de PDF', ok: true },
            { label: 'Comunicação à AT (e-fatura)', ok: !cfg.simulationMode },
            { label: 'SAF-T PT (exportação)', ok: !cfg.simulationMode },
            { label: 'Sincronização Stripe → FR', ok: true },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-border-subtle">
              <span className="text-xs text-secondary">{s.label}</span>
              <Badge color={s.ok ? 'success' : 'warning'}>{s.ok ? 'OK' : 'Pendente'}</Badge>
            </div>
          ))}
        </Card>

        {/* Setup guide */}
        <Card padding="none" className="p-[22px]">
          <Label>Como configurar — 5 passos</Label>
          {[
            { n: '1', title: 'Aceder ao TOConline', desc: 'Login em app.toconline.pt → Empresa → Dados API' },
            { n: '2', title: 'Descarregar credenciais', desc: 'Clique em "Ficheiro Postman" para obter o Client ID e Secret — entregar ao developer para configurar no deployment' },
            { n: '3', title: 'Criar serviço', desc: 'Artigos → Serviços → Novo: código "GB-MENSALIDADE", IVA Normal 23%' },
            { n: '4', title: 'Criar série GB2025', desc: 'Empresa → Séries → Nova série FR com prefixo "GB2025"' },
            { n: '5', title: 'Ligar webhook Stripe', desc: 'payment_intent.succeeded → emite FR automaticamente no TOConline' },
          ].map(s => (
            <div key={s.n} className="flex gap-2.5 mb-3">
              <div className="flex justify-center items-center mt-0.5 w-5 h-5 text-[10px] font-bold text-white rounded-full shrink-0 bg-gb-red">{s.n}</div>
              <div>
                <div className="mb-0.5 text-[12.5px] font-semibold text-primary">{s.title}</div>
                <div className="text-[11.5px] leading-[1.5] text-muted">{s.desc}</div>
              </div>
            </div>
          ))}
          <a href="https://api-docs.toconline.pt" target="_blank" rel="noreferrer"
            className="block py-2 mt-1 min-h-11 sm:min-h-0 text-xs font-semibold text-center no-underline rounded-sm border transition-colors duration-200 border-border bg-elevated text-secondary hover:border-gb-red hover:text-gb-red active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <span className="inline-flex gap-1.5 items-center"><Ico icon={BookIcon} sm />Documentação API TOConline →</span>
          </a>
        </Card>
      </div>
    </div>
  );
}

// Small shared "Guardar" button matching the saved/saving three-state pattern used across sections
const defaultButton2Label = <span className="inline-flex gap-1.5 items-center"><Ico icon={SaveIcon} sm />Guardar</span>;
function Button2({ saving, saved, onClick, className = '', label = defaultButton2Label }: { saving: boolean; saved: boolean; onClick: () => void; className?: string; label?: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={[
        'py-2.5 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-sm border-none transition-all duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        saving ? 'opacity-70' : 'cursor-pointer opacity-100 hover:brightness-90 active:brightness-90',
        className,
      ].join(' ')}
      style={{ background: saved ? '#22C55E' : saving ? '#aaa' : GB.red }}>
      {saving
        ? <span className="inline-flex gap-1.5 items-center"><Ico icon={ArrowPathIcon} sm />A guardar...</span>
        : saved
        ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Guardado!</span>
        : label}
    </button>
  );
}

// ─── Stripe Section ───────────────────────────────────────────────────────────
// Chaves reais (sk_/whsec_/pk_) vivem só nas env vars do deployment (Vercel) —
// api/stripe-webhook.ts nunca leu a tabela `configuracoes`, por isso os campos
// de chaves que existiam aqui não tinham qualquer efeito real. Mesma razão
// para a tabela de Price IDs: os price IDs realmente usados (api/stripe-
// webhook.ts, src/lib/supabase.ts) vêm de planos.stripe_price_id_live/test,
// não de configuracoes.stripe.priceIds.
function StripeSection() {
  return (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="p-[22px]">
        <div className="flex gap-2.5 items-center pb-3.5 mb-[18px] border-b border-border-subtle">
          <div className="flex justify-center items-center w-[38px] h-[38px] text-[15px] font-extrabold text-white rounded-md bg-[#635BFF]">S</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-primary">Stripe API</div>
            <div className="text-[11px] text-muted">Pagamentos e subscrições recorrentes</div>
          </div>
        </div>
        <div className="py-2.5 px-3.5 mb-3.5 text-xs rounded-lg border border-border-subtle bg-elevated text-secondary">
          As chaves de API e o Webhook Secret são geridos como variáveis de ambiente no deployment (Vercel), nunca nesta interface.
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer"
            className="py-2 px-3 min-h-11 sm:min-h-0 text-[11.5px] font-semibold text-[#635BFF] no-underline rounded-sm border transition-colors duration-200 border-[#635BFF]/20 bg-[#635BFF]/[0.08] hover:bg-[#635BFF]/[0.16] active:bg-[#635BFF]/[0.16] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <span className="inline-flex gap-1.5 items-center"><Ico icon={LinkIcon} sm />Dashboard →</span>
          </a>
          <a href="https://billing.stripe.com/p/login/test_28o3cS3Ub0GQdeU288" target="_blank" rel="noreferrer"
            className="py-2 px-3 min-h-11 sm:min-h-0 text-[11.5px] font-semibold text-[#635BFF] no-underline rounded-sm border transition-colors duration-200 border-[#635BFF]/20 bg-[#635BFF]/[0.08] hover:bg-[#635BFF]/[0.16] active:bg-[#635BFF]/[0.16] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <span className="inline-flex gap-1.5 items-center"><Ico icon={UserIcon} sm />Portal →</span>
          </a>
        </div>
      </Card>

      {/* Webhooks */}
      <Card padding="none" className="p-[22px]">
        <Label>Webhook URL para configurar no Stripe</Label>
        <div className="py-2.5 px-3.5 mb-3.5 font-mono text-xs rounded-lg bg-elevated text-primary">
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
          <div key={w.event} className="flex gap-2.5 py-2.5 border-b border-border-subtle">
            <span className="font-mono text-[11px] text-[#635BFF] shrink-0">{w.event}</span>
            <span className="text-[11px] text-muted">→ {w.action}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── WhatsApp Section ─────────────────────────────────────────────────────────
// Access Token removido: é geridos como variável de ambiente no deployment
// (META_WHATSAPP_TOKEN, lido só por api/stripe-webhook.ts) — o campo aqui
// nunca teve qualquer efeito real.
type WaConfig = { num: string };

function WhatsAppSection() {
  const { data, setData, loading, saving, saved, save } = useConfiguracaoSection<WaConfig>('whatsapp', { num: '+351912345679' });

  if (loading) return <div className="p-6 text-[13px] text-muted">A carregar configuração...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card padding="none" className="p-[22px]">
        <div className="flex gap-2.5 items-center pb-4 mb-[18px] border-b border-border-subtle">
          <div className="flex justify-center items-center w-10 h-10 text-xl rounded-md bg-[#075E54]"><FontAwesomeIcon icon={ChatBubbleLeftRightIcon} className="w-5 h-5 text-white" /></div>
          <div>
            <div className="text-[15px] font-bold text-primary">WhatsApp Business API</div>
            <div className="text-[11px] text-muted">Meta Cloud API</div>
          </div>
        </div>
        <Field label="Número WhatsApp Business">
          <Input value={data.num} onChange={v => setData(p => ({ ...p, num: v }))} placeholder="+351..." mono />
        </Field>
        <div className="py-2.5 px-3.5 mb-3.5 text-xs rounded-lg border border-border-subtle bg-elevated text-secondary">
          O Access Token é gerido como variável de ambiente no deployment, nunca nesta interface.
        </div>
        <SaveBar onSave={() => save()} saved={saved} saving={saving} />
      </Card>
      <Card padding="none" className="p-[22px]">
        <Label>Templates aprovados</Label>
        {[
          { nome: 'lembrete_pagamento', status: 'aprovado' },
          { nome: 'pagamento_recebido', status: 'aprovado' },
          { nome: 'graduacao_confirmada', status: 'aprovado' },
          { nome: 'boas_vindas', status: 'pendente' },
        ].map(t => (
          <div key={t.nome} className="flex justify-between py-2 border-b border-border-subtle">
            <span className="font-mono text-xs text-secondary">{t.nome}</span>
            <Badge color={t.status === 'aprovado' ? 'success' : 'warning'}>{t.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Generic placeholder sections ────────────────────────────────────────────
function SimpleSection({ secao, title, icon, fields }: {
  secao: string;
  title: string;
  icon: HeroIcon;
  fields: { label: string; placeholder: string; type?: string }[];
}) {
  const { data: vals, setData: setVals, loading, saving, saved, save } = useConfiguracaoSection<Record<string, string>>(secao, {});

  if (loading) return <div className="p-6 text-[13px] text-muted">A carregar configuração...</div>;

  return (
    <div className="max-w-[560px]">
      <Card padding="none" className="p-[22px]">
        <div className="flex gap-2.5 items-center pb-4 mb-5 border-b border-border-subtle">
          <div className="flex justify-center items-center w-10 h-10 rounded-md bg-gb-red-glow"><FontAwesomeIcon icon={icon} className="w-5 h-5 text-gb-red" /></div>
          <div className="text-[15px] font-bold text-primary">{title}</div>
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
  { value: 'professor',   label: 'Professor',     desc: 'Acesso a turmas, check-in e graduação' },
  { value: 'admin',       label: 'Administrador', desc: 'Acesso total exceto gestão de superadmin' },
  { value: 'atendimento', label: 'Atendimento',   desc: 'Registo de alunos, check-in e comunicação' },
];

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  superadmin:  { label: 'Superadmin',     color: 'var(--gb-red)', bg: 'rgba(200,16,46,0.10)' },
  admin:       { label: 'Administrador',  color: 'var(--text-primary)', bg: 'var(--bg-elevated)'  },
  professor:   { label: 'Professor',      color: '#EA580C', bg: 'rgba(234,88,12,0.10)'  },
  atendimento: { label: 'Atendimento',    color: '#16A34A', bg: 'rgba(22,163,74,0.10)'  },
};

// Ordered list of belts for the staff faixa selector (adult + kids)
const STAFF_FAIXAS = [
  { value: '', label: 'Sem faixa definida' },
  { value: 'branca',         label: 'Branca' },
  { value: 'cinza-branca',   label: 'Cinza/Branca' },
  { value: 'cinza',          label: 'Cinza' },
  { value: 'cinza-preta',    label: 'Cinza/Preta' },
  { value: 'amarela-branca', label: 'Amarela/Branca' },
  { value: 'amarela',        label: 'Amarela' },
  { value: 'amarela-preta',  label: 'Amarela/Preta' },
  { value: 'laranja-branca', label: 'Laranja/Branca' },
  { value: 'laranja',        label: 'Laranja' },
  { value: 'laranja-preta',  label: 'Laranja/Preta' },
  { value: 'verde-branca',   label: 'Verde/Branca' },
  { value: 'verde',          label: 'Verde' },
  { value: 'verde-preta',    label: 'Verde/Preta' },
  { value: 'azul',           label: 'Azul' },
  { value: 'roxa',           label: 'Roxa' },
  { value: 'marrom',         label: 'Marrom' },
  { value: 'preta',          label: 'Preta' },
  { value: 'vermelha',       label: 'Vermelha' },
];

const STAFF_INP = 'box-border w-full py-2 px-2.5 min-h-11 sm:min-h-0 font-ui text-[12.5px] rounded-sm border transition-all duration-200 border-border bg-elevated text-primary outline-none focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const STAFF_LBL = 'block mb-1 text-[10px] font-bold tracking-[0.8px] uppercase text-muted';

function StaffCard({ member, onSaved }: { member: StaffMember; onSaved: () => void }) {
  const [open, setOpen]     = useState(false);
  const [d, setD]           = useState(member);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const updateProfile = useUpdateProfile();
  const saving = updateProfile.isPending;

  const sendPasswordReset = async () => {
    setResetting(true); setErr('');
    const { error } = await supabase.auth.resetPasswordForEmail(d.email, {
      redirectTo: window.location.origin,
    });
    setResetting(false);
    if (error) { setErr(`Reset: ${error.message}`); return; }
    setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
  };

  const saveStaff = async () => {
    setErr('');
    try {
      await updateProfile.mutateAsync({
        id: d.id,
        patch: {
          nome:     d.nome,
          telefone: d.telefone || null,
          nif:      d.nif      || null,
          morada:   d.morada   || null,
          faixa:    d.faixa    || null,
          ativo:    d.ativo,
        },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved();
  };

  const badge     = ROLE_BADGE[d.role] ?? ROLE_BADGE['atendimento'];

  return (
    <div
      className={['overflow-hidden rounded-lg border transition-colors', d.ativo ? 'opacity-100' : 'opacity-65'].join(' ')}
      style={{ borderColor: open ? GB.red : d.ativo ? 'var(--border)' : 'var(--border-subtle)' }}
    >
      {/* Header row */}
      <button onClick={() => setOpen(o => !o)}
        className="flex gap-3 items-center py-3.5 px-[18px] w-full text-left bg-transparent border-none cursor-pointer transition-colors duration-200 hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset">
        {/* Avatar */}
        <div
          className="flex justify-center items-center w-[38px] h-[38px] text-base rounded-full border-2 shrink-0"
          style={{ background: badge.bg, borderColor: badge.color }}
        >
          <FontAwesomeIcon
            icon={d.role === 'professor' ? MartialArtsIcon : d.role === 'admin' ? Cog6ToothIcon : d.role === 'superadmin' ? CrownIcon : PhoneIcon}
            className="w-4 h-4"
            style={{ color: badge.color }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="overflow-hidden text-[13.5px] font-bold whitespace-nowrap text-ellipsis text-primary">{d.nome}</div>
          <div className="flex flex-wrap gap-1.5 items-center text-[11px] text-muted">
            <span className="overflow-hidden whitespace-nowrap text-ellipsis">{d.email}</span>
            {d.faixa && <BeltBadge faixa={d.faixa} grau={0} size="sm" />}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-1 items-end shrink-0">
          <span className="py-0.5 px-1.5 text-[10px] font-bold rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
          <Badge color={d.ativo ? 'success' : 'neutral'}>{d.ativo ? 'Ativo' : 'Inativo'}</Badge>
        </div>
        <span className="ml-1 text-sm text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded edit form */}
      {open && (
        <div className="pb-[18px] px-[18px] border-t border-border-subtle">
          <div className="grid grid-cols-1 gap-2.5 mt-3.5 sm:grid-cols-2">

            <div>
              <label className={STAFF_LBL}>Nome completo</label>
              <input value={d.nome} onChange={e => setD(p => ({ ...p, nome: e.target.value }))} className={STAFF_INP} />
            </div>
            <div>
              <label className={STAFF_LBL}>Email</label>
              <input value={d.email} readOnly className={[STAFF_INP, 'opacity-55 cursor-not-allowed'].join(' ')} title="O email não pode ser alterado aqui" />
            </div>
            <div>
              <label className={STAFF_LBL}>Telefone</label>
              <input value={d.telefone} onChange={e => setD(p => ({ ...p, telefone: e.target.value }))} placeholder="+351 9xx xxx xxx" className={STAFF_INP} />
            </div>
            <div>
              <label className={STAFF_LBL}>NIF</label>
              <input value={d.nif} onChange={e => setD(p => ({ ...p, nif: e.target.value }))} placeholder="123456789" className={STAFF_INP} />
            </div>

            {/* Faixa */}
            <div>
              <Select variant="sm" label="Faixa" value={d.faixa} onChange={e => setD(p => ({ ...p, faixa: e.target.value }))}>
                {STAFF_FAIXAS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </div>

            {/* Status ativo/inativo */}
            <div>
              <label className={STAFF_LBL}>Estado</label>
              <div className="flex gap-2">
                {[{ v: true, l: 'Ativo', icon: CheckIcon, bg: '#16A34A' }, { v: false, l: 'Inativo', icon: XMarkIcon, bg: '#6B7280' }].map(opt => (
                  <button key={String(opt.v)} onClick={() => setD(p => ({ ...p, ativo: opt.v }))}
                    className="flex flex-1 gap-1.5 justify-center items-center p-2 min-h-11 text-xs font-bold rounded-sm border-[1.5px] cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                    style={{
                      borderColor: d.ativo === opt.v ? opt.bg : 'var(--border)',
                      background: d.ativo === opt.v ? `${opt.bg}18` : 'var(--bg-elevated)',
                      color: d.ativo === opt.v ? opt.bg : 'var(--text-muted)',
                    }}>
                    <Ico icon={opt.icon} sm />
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-full">
              <label className={STAFF_LBL}>Morada</label>
              <input value={d.morada} onChange={e => setD(p => ({ ...p, morada: e.target.value }))} placeholder="Rua..., 4700 Braga" className={STAFF_INP} />
            </div>
          </div>

          {err && <div className="inline-flex gap-1.5 items-center mt-2 text-[11.5px] font-semibold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />{err}</div>}
          <div className="flex flex-wrap gap-2.5 justify-between items-center mt-3">
            {/* Reset password */}
            <button
              onClick={sendPasswordReset}
              disabled={resetting || resetDone}
              className={[
                'flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                resetDone ? 'border-gb-green text-gb-green bg-gb-green/10' : 'border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle',
                (resetting || resetDone) ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <Ico icon={resetDone ? CheckIcon : KeyIcon} sm />
              {resetting ? 'A enviar...' : resetDone ? 'Email enviado!' : 'Enviar reset de password'}
            </button>

            {/* Save */}
            <Button2 saving={saving} saved={saved} onClick={saveStaff} className="px-5" />
          </div>
        </div>
      )}
    </div>
  );
}

function EquipaSection() {
  const { user } = useAuth();

  // ── Staff list state ──────────────────────────────────────────────────────
  const { data: staff = [], isLoading: loadingList, refetch: loadStaff } = useStaffListQuery();
  const [showInvite, setShowInvite]   = useState(false);

  // ── Invite form state ─────────────────────────────────────────────────────
  const [nome,  setNome]   = useState('');
  const [email, setEmail]  = useState('');
  const [role,  setRole]   = useState<StaffRole>('professor');
  const [inviting, setInviting] = useState(false);
  const [result,   setResult]  = useState<{ link: string; email: string } | null>(null);
  const [err,      setErr]     = useState('');
  const [copied,   setCopied]  = useState(false);

  const invite = async () => {
    if (!nome.trim()) return setErr('Preenche o nome.');
    if (!email.includes('@')) return setErr('Email inválido.');
    setErr(''); setInviting(true); setResult(null);
    try {
      if (!isConfigured) {
        await new Promise(r => setTimeout(r, 800));
        setResult({ link: 'https://demo.mode/invite-link-would-appear-here', email });
        setInviting(false);
        return;
      }
      const data = await inviteStaff({ email, nome, role });
      setResult({ link: data.action_link || '', email: data.email });
      setNome(''); setEmail(''); setRole('professor');
      loadStaff(); // refresh list
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setInviting(false);
  };

  const copy = () => {
    if (result?.link) {
      navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!['superadmin', 'admin'].includes(user?.role ?? '')) {
    return <div className="p-6 text-[13px] text-muted">Acesso restrito a administradores.</div>;
  }

  // Admin pode convidar professor e atendimento, mas não criar novos admin
  const availableRoles = STAFF_ROLES.filter(r =>
    user?.role === 'superadmin' ? true : r.value !== 'admin'
  );

  return (
    <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-[1fr_420px]">

      {/* ── Left: staff list ── */}
      <div>
        <div className="flex justify-between items-center mb-3.5">
          <div>
            <div className="text-[15px] font-bold text-primary">Equipa</div>
            <div className="text-[11.5px] text-muted">{staff.length} membro{staff.length !== 1 ? 's' : ''}</div>
          </div>
          <Button
            variant={showInvite ? 'secondary' : 'primary'} size="sm"
            onClick={() => { setShowInvite(s => !s); setResult(null); setErr(''); }}
          >
            {showInvite
              ? <><Ico icon={XMarkIcon} sm />Fechar</>
              : <><Ico icon={PlusIcon} sm />Convidar membro</>}
          </Button>
        </div>

        {loadingList ? (
          <div className="p-4 text-[13px] text-muted">A carregar equipa...</div>
        ) : staff.length === 0 ? (
          <div className="p-4 text-[13px] text-center text-muted">Nenhum membro de equipa encontrado.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {staff.map(m => (
              <StaffCard key={m.id} member={m} onSaved={loadStaff} />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: invite form (toggle) ── */}
      {showInvite && (
        <div>
          <Card padding="none" className={['p-[22px]', result ? 'mb-4' : 'mb-0'].join(' ')}>
            <div className="flex gap-3 items-center pb-3.5 mb-[18px] border-b border-border-subtle">
              <div className="flex justify-center items-center w-[38px] h-[38px] text-lg rounded-md bg-gb-red"><FontAwesomeIcon icon={EnvelopeIcon} className="w-4 h-4 text-white" /></div>
              <div>
                <div className="text-sm font-bold text-primary">Convidar Membro</div>
                <div className="text-[11px] text-muted">O convidado define a sua própria password</div>
              </div>
            </div>
            <Field label="Nome completo">
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: João Silva" className={STAFF_INP} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@gbbraga.com" className={STAFF_INP} />
            </Field>
            <Field label="Função">
              <div className="flex flex-col gap-1.5">
                {availableRoles.map(r => (
                  <label key={r.value}
                    className={[
                      'flex gap-2.5 items-center py-2.5 px-3 min-h-11 rounded-lg border-[1.5px] cursor-pointer transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gb-red has-[:focus-visible]:ring-offset-2',
                      role === r.value ? 'border-gb-red bg-gb-red/[0.06]' : 'border-border bg-elevated hover:bg-border-subtle active:bg-border-subtle',
                    ].join(' ')}>
                    <input type="radio" name="staffRole" checked={role === r.value} onChange={() => setRole(r.value)} className="accent-gb-red" />
                    <div>
                      <div className="text-[12.5px] font-semibold text-primary">{r.label}</div>
                      <div className="text-[10.5px] text-muted">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            {err && <div className="inline-flex gap-1.5 items-center mb-2.5 text-xs font-semibold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />{err}</div>}
            <button onClick={invite} disabled={inviting}
              className={[
                'py-2.5 w-full min-h-11 text-[13px] font-bold text-white rounded-sm border-none transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                inviting ? 'cursor-not-allowed bg-neutral-400' : 'cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark',
              ].join(' ')}>
              {inviting
                ? 'A criar conta...'
                : <span className="inline-flex gap-1.5 items-center"><Ico icon={EnvelopeIcon} sm />Criar e Gerar Link</span>}
            </button>
          </Card>

          {result && (
            <Card padding="none" className="p-[22px] !border-[1.5px] !border-gb-green">
              <div className="flex gap-2.5 items-center mb-3">
                <FontAwesomeIcon icon={CheckCircleIcon} className="w-5 h-5 text-gb-green" />
                <div>
                  <div className="text-[13px] font-bold text-primary">Conta criada!</div>
                  <div className="text-[11px] text-muted">{result.email}</div>
                </div>
              </div>
              {result.link ? (
                <>
                  <div className="p-2 mb-2 font-mono text-[10.5px] break-all rounded-lg border border-border bg-elevated text-secondary">
                    {result.link}
                  </div>
                  <button onClick={copy}
                    className={[
                      'py-1.5 px-3.5 w-full min-h-11 sm:min-h-0 text-xs font-semibold rounded-lg border cursor-pointer transition-colors duration-200',
                      'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                      copied ? 'text-white bg-gb-green border-gb-green hover:bg-gb-green-dark active:bg-gb-green-dark' : 'border-border bg-elevated text-primary hover:bg-border-subtle active:bg-border-subtle',
                    ].join(' ')}>
                    {copied
                      ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Copiado!</span>
                      : <span className="inline-flex gap-1.5 items-center"><Ico icon={ClipboardDocumentIcon} sm />Copiar link</span>}
                  </button>
                  <p className="inline-flex gap-1.5 items-center mt-2 text-[10.5px] leading-[1.5] text-muted"><Ico icon={ExclamationTriangleIcon} sm />Link de uso único — expira em 24h.</p>
                </>
              ) : (
                <p className="text-xs text-muted">Conta criada. Gera o link manualmente no Supabase Dashboard.</p>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ConfigPage ──────────────────────────────────────────────────────────
export default function ConfigPage() {
  return <ConfigPageInner />;
}

// ─── Academia + GPS Fence Section ────────────────────────────────────────────
function AcademiaSection() {
  const { data: cfg, setData: setCfg, loading, saving, saved, save } =
    useConfiguracaoSection<Record<string, string>>('academia', {});

  const [locating, setLocating]   = useState(false);
  const [locErr,   setLocErr]     = useState('');
  const [testDist, setTestDist]   = useState<number | null>(null);
  const [testing,  setTesting]    = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) { setLocErr('Geolocalização não suportada.'); return; }
    setLocating(true); setLocErr('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCfg(p => ({
          ...p,
          'GPS Latitude':  pos.coords.latitude.toFixed(7),
          'GPS Longitude': pos.coords.longitude.toFixed(7),
          'GPS Precisão':  `${Math.round(pos.coords.accuracy)}m`,
        }));
        setLocating(false);
      },
      err => { setLocErr(`Erro GPS: ${err.message}`); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const testMyPosition = () => {
    if (!navigator.geolocation) return;
    const lat = parseFloat(cfg['GPS Latitude'] ?? '');
    const lng = parseFloat(cfg['GPS Longitude'] ?? '');
    if (isNaN(lat) || isNaN(lng)) { setLocErr('Define primeiro o ponto de referência.'); return; }
    setTesting(true); setLocErr('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const d = haversineDistanceMeters(lat, lng, pos.coords.latitude, pos.coords.longitude);
        setTestDist(Math.round(d));
        setTesting(false);
      },
      err => { setLocErr(`Erro GPS: ${err.message}`); setTesting(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const radius   = parseInt(cfg['GPS Raio (m)'] ?? '100');
  const hasPoint = !isNaN(parseFloat(cfg['GPS Latitude'] ?? '')) && !isNaN(parseFloat(cfg['GPS Longitude'] ?? ''));

  if (loading) return <div className="p-6 text-[13px] text-muted">A carregar...</div>;

  return (
    <div className="max-w-[560px]">
      {/* Dados básicos */}
      <Card padding="none" className="p-[22px]">
        <div className="flex gap-2.5 items-center pb-3.5 mb-5 border-b border-border-subtle">
          <div className="flex justify-center items-center w-10 h-10 rounded-md bg-gb-red-glow"><FontAwesomeIcon icon={SchoolIcon} className="w-5 h-5 text-gb-red" /></div>
          <div className="text-[15px] font-bold text-primary">Academia</div>
        </div>
        {[
          { label: 'Nome da academia', placeholder: 'Gracie Barra Braga' },
          { label: 'Morada', placeholder: 'Rua..., 4700 Braga' },
          { label: 'Telefone', placeholder: '+351 927 773 854' },
          { label: 'Email', placeholder: 'atendimento@gbbraga.com' },
          { label: 'NIF', placeholder: '512345678' },
        ].map(f => (
          <Field key={f.label} label={f.label}>
            <Input
              value={cfg[f.label] || ''}
              onChange={v => setCfg(p => ({ ...p, [f.label]: v }))}
              placeholder={f.placeholder}
            />
          </Field>
        ))}
        <SaveBar onSave={() => save()} saved={saved} saving={saving} />
      </Card>

      {/* GPS Fence */}
      <Card padding="none" className="p-[22px] mt-4">
        <div className="flex gap-2.5 items-center pb-3.5 mb-5 border-b border-border-subtle">
          <div className="flex justify-center items-center w-10 h-10 rounded-md bg-gb-red-glow"><FontAwesomeIcon icon={MapPinIcon} className="w-5 h-5 text-gb-red" /></div>
          <div>
            <div className="text-[15px] font-bold text-primary">GPS Fence — Check-in</div>
            <div className="text-[11px] text-muted">Ponto de referência para validar presenças</div>
          </div>
        </div>

        {/* Capture button */}
        <button
          onClick={captureLocation}
          disabled={locating}
          className={[
            'flex gap-2 justify-center items-center py-3 mb-4 w-full min-h-11 text-[13px] font-bold text-white rounded-sm border-none transition-colors duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
            locating ? 'bg-neutral-400' : 'cursor-pointer bg-gb-green hover:bg-gb-green-dark active:bg-gb-green-dark',
          ].join(' ')}
        >
          {locating
            ? <span className="inline-flex gap-1.5 items-center"><Ico icon={ArrowPathIcon} sm />A obter localização...</span>
            : <span className="inline-flex gap-1.5 items-center"><Ico icon={MapPinIcon} sm />Usar localização actual como referência</span>}
        </button>

        {/* Coords */}
        <div className="grid grid-cols-1 gap-2.5 mb-2.5 sm:grid-cols-2">
          <div>
            <label className={STAFF_LBL}>Latitude</label>
            <input
              value={cfg['GPS Latitude'] || ''}
              onChange={e => setCfg(p => ({ ...p, 'GPS Latitude': e.target.value }))}
              placeholder="41.5503700"
              className={STAFF_INP}
            />
          </div>
          <div>
            <label className={STAFF_LBL}>Longitude</label>
            <input
              value={cfg['GPS Longitude'] || ''}
              onChange={e => setCfg(p => ({ ...p, 'GPS Longitude': e.target.value }))}
              placeholder="-8.4200000"
              className={STAFF_INP}
            />
          </div>
        </div>

        {/* Radius */}
        <div className="mb-3.5">
          <label className={STAFF_LBL}>Raio do fence (metros)</label>
          <div className="flex flex-wrap gap-2">
            {[50, 100, 150, 200, 300].map(r => (
              <button key={r} onClick={() => setCfg(p => ({ ...p, 'GPS Raio (m)': String(r) }))}
                className="py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border-[1.5px] cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                style={{
                  borderColor: radius === r ? '#16A34A' : 'var(--border)',
                  background: radius === r ? 'rgba(22,163,74,0.1)' : 'var(--bg-elevated)',
                  color: radius === r ? '#16A34A' : 'var(--text-secondary)',
                  fontWeight: radius === r ? 700 : 400,
                }}>
                {r}m
              </button>
            ))}
            <input
              type="number" min="10" max="2000"
              value={cfg['GPS Raio (m)'] || '100'}
              onChange={e => setCfg(p => ({ ...p, 'GPS Raio (m)': e.target.value }))}
              placeholder="100"
              className={[STAFF_INP, 'w-[70px]'].join(' ')}
            />
          </div>
        </div>

        {/* Status + Test */}
        {hasPoint && (
          <div className="flex gap-2.5 justify-between items-center py-2.5 px-3.5 mb-3.5 rounded-sm border border-gb-green/20 bg-gb-green/[0.06]">
            <div>
              <div className="inline-flex gap-1.5 items-center text-xs font-bold text-gb-green"><Ico icon={CheckIcon} sm />Ponto definido</div>
              <div className="mt-0.5 text-[11px] text-muted">
                {cfg['GPS Latitude']}, {cfg['GPS Longitude']} · Raio: {radius}m
                {cfg['GPS Precisão'] && ` · Precisão: ±${cfg['GPS Precisão']}`}
              </div>
            </div>
            <button
              onClick={testMyPosition}
              disabled={testing}
              className={[
                'py-1.5 px-3 min-h-11 sm:min-h-0 text-[11.5px] font-semibold rounded-sm border shrink-0 transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                testing ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}>
              {testing
                ? <Ico icon={ArrowPathIcon} sm />
                : <span className="inline-flex gap-1.5 items-center"><Ico icon={FlaskIcon} sm />Testar</span>}
            </button>
          </div>
        )}

        {/* Test result */}
        {testDist !== null && (
          <div
            className={['py-2.5 px-3.5 mb-3.5 text-[12.5px] font-bold rounded-sm border', testDist <= radius ? 'border-gb-green/30 text-gb-green bg-gb-green/[0.08]' : 'border-gb-red/20 text-gb-red bg-gb-red/[0.07]'].join(' ')}
          >
            {testDist <= radius
              ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />{`Dentro do fence — ${testDist}m do ponto (raio: ${radius}m)`}</span>
              : <span className="inline-flex gap-1.5 items-center"><Ico icon={XMarkIcon} sm />{`Fora do fence — ${testDist}m do ponto (raio: ${radius}m)`}</span>}
          </div>
        )}

        {locErr && <div className="inline-flex gap-1.5 items-center mb-2.5 text-[11.5px] font-semibold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />{locErr}</div>}

        <SaveBar onSave={() => save()} saved={saved} saving={saving} />
      </Card>
    </div>
  );
}

// ─── Main ConfigPage component ────────────────────────────────────────────────
function ConfigPageInner() {
  const { user } = useAuth();
  const { isMobile } = useMobile();

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin      = user?.role === 'admin';
  const visibleSections = SECTIONS.filter(s => !s.superadminOnly || isSuperAdmin || isAdmin);
  const defaultSection: Section = (isSuperAdmin || isAdmin) ? 'equipa' : 'toconline';
  const [active, setActive] = useState<Section>(defaultSection);

  const renderSection = () => {
    switch (active) {
      case 'equipa':     return <EquipaSection />;
      case 'toconline':  return <TocSection />;
      case 'stripe':     return <StripeSection />;
      case 'whatsapp':   return <WhatsAppSection />;
      case 'email':      return <SimpleSection secao="email" title="Email / SMTP" icon={EnvelopeIcon} fields={[
        { label: 'Servidor SMTP', placeholder: 'smtp.gmail.com' },
        { label: 'Porta', placeholder: '587' },
        { label: 'Email remetente', placeholder: 'noreply@graciebarra.pt' },
        { label: 'Password', placeholder: '••••••••', type: 'password' },
      ]}/>;
      case 'academia':   return <AcademiaSection />;
      case 'compliance': return <SimpleSection secao="compliance" title="IPDJ / RGPD" icon={ClipboardDocumentIcon} fields={[
        { label: 'Número alvará IPDJ', placeholder: 'AL-XXXXX' },
        { label: 'DPO (Responsável RGPD)', placeholder: 'Nome do responsável' },
        { label: 'Email RGPD', placeholder: 'rgpd@graciebarra.pt' },
      ]}/>;
    }
  };

  /* ── Mobile: horizontal scrollable tabs ── Desktop: vertical sidebar ── */
  const mobileTabs = (
    <div className="flex overflow-x-auto gap-1.5 pb-1 mb-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
      {visibleSections.map(s => (
        <button key={s.id} onClick={() => setActive(s.id)}
          className="flex flex-col gap-0.5 items-center py-2.5 px-3.5 min-w-[72px] min-h-11 rounded-md border-[1.5px] shrink-0 cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
          style={{
            background: active === s.id ? GB.redGlow : 'var(--bg-card)',
            borderColor: active === s.id ? GB.red : 'var(--border)',
          }}>
          <FontAwesomeIcon icon={s.icon} className="w-[18px] h-[18px]" style={{ color: active === s.id ? GB.red : 'var(--text-secondary)' }} />
          <span className="text-[10.5px] whitespace-nowrap" style={{ color: active === s.id ? GB.red : 'var(--text-secondary)', fontWeight: active === s.id ? 700 : 500 }}>{s.label}</span>
        </button>
      ))}
    </div>
  );

  const desktopSidebar = (
    <div className="w-[210px] shrink-0">
      <Card padding="none" className="overflow-hidden">
        {visibleSections.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className="flex gap-2.5 items-center py-3 px-3.5 w-full min-h-11 text-left border-none cursor-pointer transition-colors duration-200 border-b border-border-subtle hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset"
            style={{
              background: active === s.id ? GB.redGlow : 'transparent',
              borderLeft: `2px solid ${active === s.id ? GB.red : 'transparent'}`,
            }}>
            <FontAwesomeIcon icon={s.icon} className="w-4 h-4" style={{ color: active === s.id ? GB.red : 'var(--text-primary)' }} />
            <div>
              <div className="text-[12.5px] leading-none" style={{ color: active === s.id ? GB.red : 'var(--text-primary)', fontWeight: active === s.id ? 700 : 500 }}>{s.label}</div>
              <div className="mt-0.5 text-[10.5px] text-muted">{s.desc}</div>
            </div>
            {s.id === 'toconline' && <Badge color="neutral" className="ml-auto">PT</Badge>}
          </button>
        ))}
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Configurações" />

      {isMobile ? (
        /* Mobile layout: tabs on top, content below */
        <div>
          {mobileTabs}
          <div className="min-w-0">
            {renderSection()}
          </div>
        </div>
      ) : (
        /* Desktop layout: sidebar + content */
        <div className="flex gap-5">
          {desktopSidebar}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      )}
    </div>
  );
}
