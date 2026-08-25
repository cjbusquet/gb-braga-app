import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  DocumentIcon,
  DumbbellIcon,
  ExclamationTriangleIcon,
  Ico,
  MapPinIcon,
  QrCodeIcon,
  ArrowDownTrayIcon as SaveIcon,
  TrophyIcon,
  VideoCameraIcon,
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
import { useTurmasDoAlunoQuery } from '../../hooks/useAulas';

import type { Belt, Turma } from '../../types';
import { exportContratoPDF } from '../../services/pdf';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
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

// Portuguese weekday name -> JS Date#getDay() index (0 = Domingo), used to
// find how many days away a turma's next occurrence is.
const WEEKDAY_INDEX: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

// Quick-access button — reads as a real, clickable control (filled icon
// badge, bordered tile, hover/active feedback) rather than a segmented tab,
// while staying lighter than the app's full nav tiles.
function NavChip({
  Icon,
  label,
  accent,
  onClick,
}: {
  Icon: HeroIcon;
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex gap-3 items-center p-3.5 w-full text-left rounded-xl border cursor-pointer border-border bg-card transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.98] active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
    >
      <div
        className="flex justify-center items-center w-9 h-9 rounded-full shrink-0"
        style={{ background: accent + '18', color: accent }}
      >
        <FontAwesomeIcon icon={Icon} className="w-4 h-4" />
      </div>
      <span className="text-[13px] font-semibold text-primary">{label}</span>
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

  const handleSave = async (close: () => void) => {
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
      setTimeout(close, 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao guardar. Tenta novamente.');
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Editar Dados Pessoais">
      {close => (
        <>
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
          <Button variant="secondary" className="flex-1" disabled={saving} onClick={close}>
            Cancelar
          </Button>
          <Button
            variant="primary" className={['flex-[2]', saved ? '!bg-gb-green' : ''].join(' ')}
            disabled={saving || saved}
            onClick={() => handleSave(close)}
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
        </>
      )}
    </Modal>
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
  const { data: minhasTurmasFrequentadas = [] } = useTurmasDoAlunoQuery(aluno?.id);

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

  // Find the soonest upcoming occurrence of one of the student's classes, so
  // the portal can lead with "what's next" instead of a flat menu of pages.
  // "Minhas turmas" é inferido do histórico real de presenças (últimos 60
  // dias via useTurmasDoAlunoQuery) — já não existe "inscrição" estática.
  const minhasTurmas = minhasTurmasFrequentadas;
  const todayIdx = hoje.getDay();
  const proximasAulas = minhasTurmas
    .flatMap((t) => t.diaSemana.map((diaNome: string) => ({ turma: t, diaNome, idx: WEEKDAY_INDEX[diaNome] })))
    .filter((c): c is { turma: Turma; diaNome: string; idx: number } => c.idx !== undefined)
    .map((c) => ({ turma: c.turma, diaNome: c.diaNome, diasAteLa: (c.idx - todayIdx + 7) % 7 }))
    .sort((a, b) => a.diasAteLa - b.diasAteLa || a.turma.horario.localeCompare(b.turma.horario));
  const proximaAula = proximasAulas[0];

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
        <Modal onClose={() => setShowContrato(false)} title="Contrato de Adesão" maxWidth={560}>
          {close => (
            <>
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
              <Button
                variant="primary"
                className="flex-[1_1_140px]"
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
                  close();
                }}
              >
                <Ico icon={ArrowDownTrayIcon} sm /> Descarregar PDF
              </Button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Cancelar subscrição?\n\nA tua conta ficará inativa no fim do período pago. Tens a certeza?',
                    )
                  ) {
                    toast.success('Pedido de cancelamento registado. Entraremos em contacto.');
                    close();
                  }
                }}
                className="flex flex-[1_1_140px] gap-1.5 justify-center items-center py-2.5 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border cursor-pointer border-gb-red/20 text-gb-red bg-gb-red/[0.08] transition-colors duration-200 hover:bg-gb-red/[0.15] active:bg-gb-red/[0.15] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
              >
                <Ico icon={ExclamationTriangleIcon} sm /> Cancelar subscrição
              </button>
            </div>
            </>
          )}
        </Modal>
      )}
      {/* ── rest of portal ── */}
      {/* Masthead — identity + belt progress. No card, no background wash:
          just typography and the belt ring sitting directly on the page.
          Centred stack on mobile; on larger screens it splits back into a
          left (identity) / right (rank) row, since centring only reads well
          within a narrow single column. */}
      <div className="flex flex-col items-center pt-1 pb-6 mb-6 text-center md:hidden">
        <div className="mb-1 text-[11px] tracking-[1.5px] uppercase text-muted">
          Bem-vindo de volta
        </div>
        <h1 className="m-0 text-[28px] font-black leading-none text-primary">
          {aluno.nome}
        </h1>
        <div className="mt-1.5 text-xs text-muted">
          Membro desde {aluno.dataMatricula}
        </div>

        {/* Belt progression ring */}
        <svg className="my-5 w-24 h-24" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-strong)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={bc?.bg || GB.red}
            strokeWidth="6"
            strokeDasharray={`${(2 * Math.PI * 34 * progressoPct) / 100} ${2 * Math.PI * 34}`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="44" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="700" fontFamily="DM Sans, sans-serif">
            {aluno.grau}/4
          </text>
        </svg>

        <div className="flex gap-2.5 items-center">
          <BeltBar belt={aluno.faixa as Belt} degrees={aluno.grau} size="sm" />
          <span className="text-[13px] font-bold capitalize text-primary">
            {bc?.label} ·{' '}
            {aluno.grau > 0 ? `${aluno.grau}° Grau` : 'Nenhum Grau'}
          </span>
        </div>

        <div className="mt-3">
          <span
            className="py-1 px-3 text-[11.5px] font-semibold rounded-full border text-primary"
            style={{ borderColor: `${bc?.bg || '#888'}40`, background: `${bc?.bg || '#888'}14` }}
          >
            {aluno.plano}
          </span>
        </div>
      </div>

      {/* Desktop masthead — identity only. Belt rank moved down into the
          at-a-glance row below, right next to the name instead of floating
          isolated in a top-right corner. */}
      <div className="hidden pt-2 pb-7 mb-6 md:block">
        <div className="mb-1 text-[11px] tracking-[1.5px] uppercase text-muted">
          Bem-vindo de volta
        </div>
        <h1 className="overflow-hidden m-0 text-[34px] font-black leading-none whitespace-nowrap text-ellipsis text-primary">
          {aluno.nome}
        </h1>
        <div className="mt-1.5 text-xs text-muted">
          Membro desde {aluno.dataMatricula}
        </div>
        <div className="mt-3">
          <span
            className="py-1 px-3 text-[11.5px] font-semibold rounded-full border text-primary"
            style={{ borderColor: `${bc?.bg || '#888'}40`, background: `${bc?.bg || '#888'}14` }}
          >
            {aluno.plano}
          </span>
        </div>
      </div>

      {/* At-a-glance stats — its own section (not folded into the masthead
          above), closed off with a divider before the rest of the page's
          content-driven sections begin. Centred on mobile, left-aligned
          under the identity block on larger screens. Belt colour and grau
          join the same row on desktop — in the exact same icon/value/label
          format as the other stats, instead of the ring+belt-bar
          composition (which stays up in the masthead on mobile only). */}
      <div className="flex flex-wrap gap-x-10 gap-y-3 justify-center pb-6 mb-6 border-b border-border-subtle md:justify-start">
        {[
          { label: 'Dias este mês', value: diasTreinoMes, Icon: CalendarIcon },
          { label: 'Frequência', value: `${aluno.frequencia}%`, Icon: ChartBarIcon },
          { label: 'Dias de treino', value: '842', Icon: DumbbellIcon },
        ].map((s) => (
          <div key={s.label} className="flex gap-2 items-center">
            <FontAwesomeIcon icon={s.Icon} className="w-3.5 h-3.5 text-muted" />
            <div>
              <div className="text-lg font-extrabold leading-none text-primary md:text-xl">
                {s.value}
              </div>
              <div className="mt-1 text-[10px] text-muted">{s.label}</div>
            </div>
          </div>
        ))}

        {/* Faixa + Grau — desktop only, same stat format, same row */}
        <div className="hidden gap-2 items-center md:flex">
          <span className="w-3.5 h-3.5 rounded-full border shrink-0 border-black/10" style={{ background: bc?.bg || GB.red }} />
          <div>
            <div className="text-lg font-extrabold leading-none capitalize text-primary md:text-xl">
              {bc?.label}
            </div>
            <div className="mt-1 text-[10px] text-muted">Faixa</div>
          </div>
        </div>
        <div className="hidden gap-2 items-center md:flex">
          <FontAwesomeIcon icon={TrophyIcon} className="w-3.5 h-3.5 text-muted" />
          <div>
            <div className="text-lg font-extrabold leading-none text-primary md:text-xl">
              {aluno.grau}/4
            </div>
            <div className="mt-1 text-[10px] text-muted">Grau</div>
          </div>
        </div>
      </div>

      {/* Payment strip — a single compact line, only shown when something is
          actually due. Stacks on mobile, both lines flush to the same left
          edge (not label-left/CTA-right, which read as disjointed); goes
          back to one line with the CTA on the right once there's room. */}
      {proximoPagamento && (
        <div
          className={[
            'flex flex-col gap-1 items-start py-2.5 px-3.5 mb-5 rounded-lg border sm:flex-row sm:items-center sm:justify-between sm:gap-3',
            proximoPagamento.status === 'vencido' ? 'border-gb-red/30 bg-gb-red/[0.05]' : 'border-amber-500/30 bg-amber-500/[0.06]',
          ].join(' ')}
        >
          <div
            className="inline-flex flex-wrap gap-x-2 gap-y-0.5 items-center text-[12.5px] font-semibold"
            style={{ color: proximoPagamento.status === 'vencido' ? GB.red : '#B45309' }}
          >
            <span className="inline-flex gap-1.5 items-center">
              <Ico icon={proximoPagamento.status === 'vencido' ? ExclamationTriangleIcon : ClockIcon} sm />
              {proximoPagamento.status === 'vencido' ? 'Pagamento em atraso' : 'Mensalidade a vencer'}
            </span>
            <span className="font-normal text-muted">· vence {proximoPagamento.vencimento}</span>
          </div>
          <button
            onClick={() => onNavigate?.('meu-financeiro')}
            className="py-2.5 mt-1 w-full min-h-11 text-[12.5px] font-bold text-center bg-card rounded-md border cursor-pointer transition-colors duration-200 hover:bg-elevated active:bg-elevated sm:mt-0 sm:w-auto sm:min-h-0 sm:p-0 sm:bg-transparent sm:border-none sm:hover:bg-transparent sm:active:bg-transparent sm:hover:underline underline-offset-2"
            style={{
              color: proximoPagamento.status === 'vencido' ? GB.red : '#B45309',
              borderColor: proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B',
            }}
          >
            {proximoPagamento.status === 'vencido' ? 'Regularizar →' : 'Pagar agora →'}
          </button>
        </div>
      )}

      {/* Próxima Aula — the one thing worth a card: it's actionable, not
          just informational, so it earns the extra visual weight. */}
      <Card padding="lg" className="flex flex-col gap-3 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Próxima Aula
          </div>
          {proximaAula && (
            <span className="text-[11px] font-bold text-gb-red">
              {proximaAula.diasAteLa === 0 ? 'Hoje' : proximaAula.diasAteLa === 1 ? 'Amanhã' : proximaAula.diaNome}
            </span>
          )}
        </div>
        {proximaAula ? (
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {proximaAula.turma.nome}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-1.5 text-[12.5px] text-secondary">
                <span className="inline-flex gap-1.5 items-center">
                  <Ico icon={ClockIcon} sm />{proximaAula.turma.horario}
                </span>
                <span className="inline-flex gap-1.5 items-center">
                  <Ico icon={MapPinIcon} sm />{proximaAula.turma.sala}
                </span>
              </div>
            </div>
            <Button variant="primary" onClick={() => onNavigate?.('meu-checkin')}>
              <Ico icon={QrCodeIcon} sm /> Fazer Check-in
            </Button>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Sem aulas agendadas.</p>
        )}
      </Card>

      {/* Quick access — every page the student can reach from here, laid
          out as real buttons (icon badge + label, bordered tile) so nothing
          is hidden off-screen and it reads as clickable, not as tabs. */}
      <div className="grid grid-cols-2 gap-2.5 mb-6 sm:grid-cols-3 lg:grid-cols-4">
        <NavChip Icon={CalendarIcon} label="Minhas Aulas" accent="#6B7280" onClick={() => onNavigate?.('minhas-aulas')} />
        <NavChip Icon={TrophyIcon} label="Minha Evolução" accent="#D97706" onClick={() => onNavigate?.('evolucao')} />
        <NavChip Icon={CurrencyEuroIcon} label="Financeiro" accent="#2F6B4F" onClick={() => onNavigate?.('meu-financeiro')} />
        <NavChip Icon={VideoCameraIcon} label="Conteúdo" accent={GB.red} onClick={() => onNavigate?.('conteudo')} />
        <NavChip Icon={ChatBubbleLeftRightIcon} label="Mensagens" accent="#F59E0B" onClick={() => onNavigate?.('mensagens')} />
        <NavChip Icon={Cog6ToothIcon} label="Minha Conta" accent="#6B7280" onClick={() => setShowEditPerfil(true)} />
        <NavChip Icon={DocumentIcon} label="Meu Contrato" accent="#6B7280" onClick={() => setShowContrato(true)} />
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
              <div className="flex justify-center items-center w-7 h-7 text-[11px] font-bold text-gb-green rounded-full border shrink-0 border-gb-green/20 bg-gb-green/10">
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
