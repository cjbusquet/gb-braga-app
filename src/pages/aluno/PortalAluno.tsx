import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  Ico,
  ArrowDownTrayIcon as SaveIcon,
  TrophyIcon,
  VideoCameraIcon,
  XMarkIcon,
  type HeroIcon,
} from '../../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GB, beltConfig } from '../../lib/gbBrand';
import {
  db,
  useAlunos,
  useContratos,
  usePagamentos,
  usePresencas,
} from '../../lib/useData';

import type { Belt } from '../../types';
import { exportContratoPDF } from '../../services/pdf';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { Skeleton, SkeletonList } from '../../components/common/Skeleton';
import BeltBar from '../../components/common/BeltBar';

const BELT_PATH: Belt[] = [
  'branca',
  'cinza',
  'amarela',
  'laranja',
  'verde',
  'azul',
  'roxa',
  'marrom',
  'preta',
];

function NavCard({
  Icon,
  label,
  desc,
  accent,
  onClick,
}: {
  Icon: HeroIcon;
  label: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex overflow-hidden relative gap-5 items-center w-full min-h-11 text-left rounded-lg border cursor-pointer box-border border-border bg-card transition-colors duration-200 active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent + '30';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div
        className="flex justify-center items-center w-[100px] h-[100px] text-lg shrink-0"
        style={{ background: accent + '18' }}
      >
        <FontAwesomeIcon icon={Icon} className="w-9 h-9" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="overflow-hidden mb-px text-sm font-medium whitespace-nowrap text-ellipsis text-black/85">
          {label}
        </div>
        <div className="overflow-hidden text-xs font-medium whitespace-nowrap text-ellipsis text-black/50">
          {desc}
        </div>
      </div>
      <FontAwesomeIcon icon={ChevronRightIcon} className="mr-3 w-7 h-7 shrink-0 text-muted" />
    </button>
  );
}

const EDIT_FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const EDIT_LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

function EditPerfilModal({
  aluno,
  onClose,
  onSaved,
}: {
  aluno: { id: string; nome: string; email: string; telefone: string; whatsapp?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(aluno.nome || '');
  const [telefone, setTelefone] = useState(aluno.telefone || '');
  const [whatsapp, setWhatsapp] = useState(aluno.whatsapp || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!nome.trim()) { setErr('O nome não pode estar vazio.'); return; }
    setErr('');
    setSaving(true);
    try {
      await db.atualizarAluno(aluno.id, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        whatsapp: whatsapp.trim(),
      });
      onSaved();
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao guardar. Tenta novamente.');
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="flex fixed inset-0 z-[1000] justify-center items-center p-5 bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-7 w-full max-w-[500px] rounded-lg border border-border bg-card"
      >
        <div className="flex justify-between mb-5">
          <div className="text-[15px] font-extrabold text-primary">
            Editar Dados Pessoais
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex justify-center items-center p-2 -m-2 bg-none rounded-full border-none cursor-pointer text-muted transition-colors duration-200 hover:text-primary hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
          >
            <Ico icon={XMarkIcon} />
          </button>
        </div>

        <div className="mb-3">
          <label className={EDIT_LABEL_CLASS}>Nome completo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={EDIT_FIELD_CLASS} />
        </div>
        <div className="mb-3">
          <label className={EDIT_LABEL_CLASS}>Email</label>
          <input value={aluno.email} disabled className={[EDIT_FIELD_CLASS, 'opacity-50 cursor-not-allowed'].join(' ')} />
          <div className="mt-1 text-[10.5px] text-muted">O email não pode ser alterado aqui.</div>
        </div>
        <div className="mb-3">
          <label className={EDIT_LABEL_CLASS}>Telefone</label>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={EDIT_FIELD_CLASS} />
        </div>
        <div className="mb-3">
          <label className={EDIT_LABEL_CLASS}>WhatsApp</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={EDIT_FIELD_CLASS} />
        </div>

        {err && (
          <div className="inline-flex gap-1.5 items-center mb-1 text-[11.5px] font-semibold text-gb-red">
            <Ico icon={ExclamationTriangleIcon} sm />
            {err}
          </div>
        )}

        <div className="flex gap-2.5 mt-4.5">
          <Button variant="secondary" className="flex-1" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary" className={['flex-[2]', saved ? '!bg-green-500' : ''].join(' ')}
            disabled={saving || saved}
            onClick={handleSave}
          >
            {saved ? (
              <><Ico icon={CheckIcon} sm /> Guardado!</>
            ) : saving ? (
              <><Ico icon={ArrowPathIcon} sm /> A guardar...</>
            ) : (
              <><Ico icon={SaveIcon} sm /> Guardar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PortalAluno({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const toast = useToast();
  const { data: alunos, refetch: refetchAlunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const { data: presencas } = usePresencas();
  const { data: contratos } = useContratos();
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const { user, refreshProfile } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];

  // alunos starts empty until useAlunos() resolves — render a placeholder
  // instead of crashing on aluno.* below.
  if (!aluno) {
    return (
      <div>
        <Skeleton className="mb-4 h-[220px] rounded-lg" />
        <div className="grid grid-cols-3 gap-2 mb-4 md:gap-3">
          <Skeleton className="h-[70px] rounded-lg" />
          <Skeleton className="h-[70px] rounded-lg" />
          <Skeleton className="h-[70px] rounded-lg" />
        </div>
        <SkeletonList rows={4} />
      </div>
    );
  }

  const meuContrato = contratos.find((c) => c.alunoId === aluno.id);
  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);
  const hoje = new Date();
  const diasTreinoMes = new Set(
    minhasPresencas
      .filter((p) => {
        const d = new Date(p.data);
        return (
          d.getMonth() === hoje.getMonth() &&
          d.getFullYear() === hoje.getFullYear()
        );
      })
      .map((p) => p.data),
  ).size;
  const proximoPagamento = pagamentos.find(
    (p) => p.status === 'pendente' || p.status === 'vencido',
  );

  const bc = beltConfig[aluno.faixa];
  const beltIdx = BELT_PATH.indexOf(aluno.faixa);
  const progressoPct =
    (beltIdx / (BELT_PATH.length - 1)) * 60 +
    (aluno.grau / 4) * (60 / BELT_PATH.length);

  return (
    <div>
      {/* Edit Profile Modal */}
      {showEditPerfil && (
        <EditPerfilModal
          aluno={aluno}
          onClose={() => setShowEditPerfil(false)}
          onSaved={() => {
            refetchAlunos();
            // alunos.nome writes trickle down to profiles.nome via a DB
            // trigger, but the AuthContext user object (sidebar, header,
            // etc.) only reflects that once refreshProfile() re-reads it.
            refreshProfile();
          }}
        />
      )}
      {/* Contract Modal */}
      {showContrato && (
        <div
          onClick={() => setShowContrato(false)}
          className="flex fixed inset-0 z-[1000] justify-center items-center p-5 bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="overflow-y-auto p-7 w-full max-w-[560px] max-h-[85vh] rounded-lg border border-border bg-card"
          >
            <div className="flex justify-between mb-5">
              <div className="text-[15px] font-extrabold text-primary">
                Contrato de Adesão
              </div>
              <button
                onClick={() => setShowContrato(false)}
                aria-label="Fechar"
                className="flex justify-center items-center p-2 -m-2 bg-none rounded-full border-none cursor-pointer text-muted transition-colors duration-200 hover:text-primary hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
              >
                <Ico icon={XMarkIcon} />
              </button>
            </div>
            <div className="py-4 px-5 mb-[18px] text-[13px] leading-[1.8] rounded-md border border-border bg-elevated text-secondary">
              <p>
                <strong>Tribo Laurada Lda.</strong> (NIF 518948471) · Gracie
                Barra Braga
                <br />
                Rua Nova de Santa Cruz, 11 – 4710-409 Braga
              </p>
              <p>
                O aluno <strong>{aluno.nome}</strong> comprometeu-se a:
              </p>
              <ul className="mb-2.5 ml-[18px]">
                <li>
                  Efetuar o pagamento da mensalidade até ao dia 5 de cada mês
                </li>
                <li>
                  Utilizar o uniforme oficial da Gracie Barra durante os treinos
                </li>
                <li>Cumprir o regulamento interno da escola</li>
                <li>
                  Declarar estar fisicamente apto para a prática do Jiu-Jitsu
                </li>
              </ul>
              <p className="text-[11.5px] text-muted">
                Contrato em vigor desde {aluno.dataMatricula}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  exportContratoPDF({
                    alunoNome: meuContrato?.alunoNome || aluno.nome,
                    alunoNif: meuContrato?.alunoNif || '',
                    plano: meuContrato?.plano || aluno.plano || '',
                    valor: meuContrato?.valor ?? 0,
                    dataAssinatura: (
                      meuContrato?.dataAssinatura ||
                      aluno.dataMatricula ||
                      ''
                    ).slice(0, 10),
                    dataInicio:
                      meuContrato?.dataInicio || aluno.dataMatricula || '',
                    assinaturaImg: meuContrato?.assinaturaImg || null,
                  });
                  setShowContrato(false);
                }}
                className="flex flex-[1_1_140px] gap-1.5 justify-center items-center py-2.5 min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none cursor-pointer bg-gb-red transition-all duration-200 hover:bg-gb-red-dark active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
              >
                <Ico icon={ArrowDownTrayIcon} sm /> Descarregar PDF
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Cancelar subscrição?\n\nA tua conta ficará inativa no fim do período pago. Tens a certeza?',
                    )
                  ) {
                    toast.success('Pedido de cancelamento registado. Entraremos em contacto.');
                    setShowContrato(false);
                  }
                }}
                className="flex flex-[1_1_140px] gap-1.5 justify-center items-center py-2.5 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border cursor-pointer border-gb-red/20 text-gb-red bg-gb-red/[0.08] transition-colors duration-200 hover:bg-gb-red/[0.15] active:bg-gb-red/[0.15] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
              >
                <Ico icon={ExclamationTriangleIcon} sm /> Cancelar subscrição
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── rest of portal ── */}
      {/* Hero */}
      <div
        className="overflow-hidden relative py-6 px-7 mb-4 rounded-lg"
        style={{ background: `linear-gradient(135deg, #0D0508 0%, ${bc?.bg || '#888'} 100%)` }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(transparent 1px, rgba(255,255,255,0.02) 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="flex relative flex-wrap gap-3 justify-between items-start md:flex-nowrap">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 text-[11px] tracking-[1.5px] uppercase text-white/50">
              Bem-vindo de volta
            </div>
            <h1 className="overflow-hidden m-0 text-[22px] font-extrabold leading-none whitespace-nowrap text-ellipsis text-white md:text-2xl">
              {aluno.nome}
            </h1>
            <div className="mt-1.5 text-xs text-white/50">
              Membro desde {aluno.dataMatricula}
            </div>

            <div className="flex flex-wrap gap-2.5 items-center mt-4">
              <BeltBar belt={aluno.faixa as Belt} degrees={aluno.grau} size="sm" />
              <span className="text-[13px] font-bold capitalize text-white">
                {bc?.label} ·{' '}
                {aluno.grau > 0 ? `${aluno.grau}° Grau` : 'Nenhum Grau'}
              </span>
            </div>

            <div className="mt-3">
              <span className="py-1 px-3 text-[11.5px] font-semibold text-white/85 rounded-full border border-white/15 bg-white/10">
                {aluno.plano}
              </span>
            </div>
          </div>

          {/* Belt progression circle */}
          <div className="my-auto text-center shrink-0">
            <svg
              className="w-[68px] h-[68px] md:w-20 md:h-20"
              viewBox="0 0 80 80"
            >
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeDasharray={`${(2 * Math.PI * 34 * progressoPct) / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ opacity: 0.9 }}
              />
              <text
                x="40"
                y="44"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
              >
                {aluno.grau}/4
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 md:gap-3">
        {[
          { label: 'Dias este mês', value: diasTreinoMes },
          {
            label: 'Frequência',
            value: `${aluno.frequencia}%`,
          },
          { label: 'Dias de treino', value: '842' },
        ].map((s) => (
          <div
            key={s.label}
            className="py-3.5 px-4 rounded-lg border border-border bg-card"
          >
            <div className="mb-1 text-[10.5px] text-muted">
              {s.label}
            </div>
            <div className="text-2xl font-extrabold text-primary">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Payment alert */}
      {proximoPagamento && (
        <div
          className={[
            'py-3.5 px-4 mb-4 rounded-md border',
            proximoPagamento.status === 'vencido' ? 'border-gb-red/30 bg-gb-red/8' : 'border-amber-500/25 bg-amber-500/[0.07]',
          ].join(' ')}
        >
          <div className="flex flex-wrap gap-2.5 justify-between items-start">
            <div>
              <div
                className="mb-1 text-xs"
                style={{ color: proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B' }}
              >
                {proximoPagamento.status === 'vencido' ? (
                  <div className="flex gap-2 items-center">
                    <Ico icon={ExclamationTriangleIcon} />
                    <span className="text-sm">Pagamento em atraso</span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Ico icon={ClockIcon} />
                    <span className="text-sm">Mensalidade a vencer</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted">
                {proximoPagamento.plano} · Vence {proximoPagamento.vencimento}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => onNavigate?.('meu-financeiro')}
                className="py-2 px-4 min-h-11 sm:min-h-0 text-xs text-white whitespace-nowrap rounded-sm border-none cursor-pointer transition-all duration-200 hover:brightness-90 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B',
                  ['--tw-ring-color' as string]: proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B',
                }}
              >
                {proximoPagamento.status === 'vencido'
                  ? 'Regularizar'
                  : 'Pagar agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 gap-1.5 mb-4 md:grid-cols-3 md:gap-2.5">
        <NavCard
          Icon={CalendarIcon}
          label="Minhas Aulas"
          desc="Horários e presenças"
          accent="#6B7280"
          onClick={() => onNavigate?.('minhas-aulas')}
        />
        <NavCard
          Icon={TrophyIcon}
          label="Minha Evolução"
          desc="Faixa e graduações"
          accent="#D97706"
          onClick={() => onNavigate?.('evolucao')}
        />
        <NavCard
          Icon={CurrencyEuroIcon}
          label="Financeiro"
          desc="Pagamentos e faturas"
          accent="#22C55E"
          onClick={() => onNavigate?.('meu-financeiro')}
        />
        <NavCard
          Icon={VideoCameraIcon}
          label="Conteúdo"
          desc="Técnicas e vídeos"
          accent={GB.red}
          onClick={() => onNavigate?.('conteudo')}
        />
        <NavCard
          Icon={ChatBubbleLeftRightIcon}
          label="Mensagens"
          desc="Comunicação"
          accent="#F59E0B"
          onClick={() => onNavigate?.('mensagens')}
        />
        <NavCard
          Icon={Cog6ToothIcon}
          label="Minha Conta"
          desc="Editar dados pessoais"
          accent="#6B7280"
          onClick={() => setShowEditPerfil(true)}
        />
        <NavCard
          Icon={DocumentIcon}
          label="Meu Contrato"
          desc="Ver contrato completo"
          accent="#6B7280"
          onClick={() => setShowContrato(true)}
        />
      </div>

      {/* Recent activity */}
      <Card padding="lg">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Atividade Recente
        </div>
        {minhasPresencas.length > 0 ? (
          minhasPresencas.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex gap-2.5 items-center py-2 border-b border-border-subtle"
            >
              <div className="flex justify-center items-center w-7 h-7 text-[11px] font-bold text-green-500 rounded-full border shrink-0 border-green-500/20 bg-green-500/10">
                <Ico icon={CheckIcon} sm />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-primary">
                  {p.turmaNome || 'Treino livre'}
                </div>
                <div className="text-[11px] text-muted">
                  {p.data} às {p.hora}
                </div>
              </div>
              <span className="py-0.5 px-1.5 font-mono text-[10px] rounded bg-elevated text-muted">
                {p.metodo}
              </span>
            </div>
          ))
        ) : (
          <p className="py-4 text-[13px] text-center text-muted">
            Sem atividade recente
          </p>
        )}
      </Card>
    </div>
  );
}
