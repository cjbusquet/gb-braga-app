import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  Ico,
  MapPinIcon,
  QrCodeIcon,
} from '../../lib/icons';
import { GB, beltConfig } from '../../lib/gbBrand';
import {
  useAlunos,
  usePagamentos,
  usePresencas,
} from '../../lib/useData';
import { useTurmasDoAlunoQuery } from '../../hooks/useAulas';
import { classificarFinanceiro, fmtData } from '../../lib/financeiro';

import type { Belt, Turma } from '../../types';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Skeleton, SkeletonList } from '../../components/common/Skeleton';
import BeltBar from '../../components/common/BeltBar';
import { Avatar } from '../../components/layout/Layout';

// Portuguese weekday name -> JS Date#getDay() index (0 = Domingo), used to
// find how many days away a turma's next occurrence is.
const WEEKDAY_INDEX: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

export default function PortalAluno({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const { user } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const { data: minhasTurmasFrequentadas = [] } = useTurmasDoAlunoQuery(aluno?.id);
  const { data: presencas } = usePresencas(aluno?.id, 60);

  // alunos starts empty until useAlunos() resolves — render a placeholder
  // instead of crashing on aluno.* below.
  if (!aluno) {
    return (
      <div>
        <Skeleton className="mb-4 h-[220px] rounded-xl" />
        <div className="grid grid-cols-3 gap-2 mb-4 md:gap-3">
          <Skeleton className="h-[70px] rounded-lg" />
          <Skeleton className="h-[70px] rounded-lg" />
          <Skeleton className="h-[70px] rounded-lg" />
        </div>
        <SkeletonList rows={4} />
      </div>
    );
  }

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
  const sitFinanceira = classificarFinanceiro(
    pagamentos.filter((p) => p.alunoId === aluno.id),
    hoje,
  );
  const emAtraso = sitFinanceira.estado === 'em_atraso';

  const bc = beltConfig[aluno.faixa];
  // Mesmo formato usado em PerfilPage.tsx ("Membro desde") — antes mostrava
  // a data ISO em bruto (ex.: "2024-01-10").
  const membroDesdeFmt = aluno.dataMatricula
    ? new Date(aluno.dataMatricula).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

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
  // Várias turmas podem calhar no mesmo dia+hora (ex.: GB1 e GBF às 18:30) —
  // sem isto, o card mostrava uma delas ao acaso como "a próxima aula".
  const proximasNoMesmoSlot = proximaAula
    ? proximasAulas.filter((c) => c.diasAteLa === proximaAula.diasAteLa && c.turma.horario === proximaAula.turma.horario)
    : [];

  return (
    <div>
      {/* ── rest of portal ── */}
      {/* Masthead — "cartão de membro": identidade, faixa e frequência
          fechados num único cartão (em vez de texto solto na página +
          uma fila de stats à parte), a lembrar o cartão físico de faixa
          da academia. Mesma estrutura em mobile e desktop, só a linha da
          identidade é que passa a empilhar. */}
      <div className="overflow-hidden mb-6 rounded-xl border border-border bg-card">
        {/* Identidade + frequência */}
        <div className="flex flex-wrap gap-5 justify-center items-center pt-6 pb-6 px-5 text-center md:justify-between md:px-7 md:text-left">
          <div className="flex flex-col gap-3 items-center min-w-0 md:flex-row md:items-center">
            <Avatar user={{ avatar: user?.avatar, nome: aluno.nome }} accent={bc?.bg || GB.red} size={64} />
            <div className="min-w-0">
              <div className="mb-1 text-[11px] tracking-[1.5px] uppercase text-muted">
                Bem-vindo de volta
              </div>
              <h1 className="overflow-hidden m-0 text-[26px] md:text-[32px] font-black leading-none whitespace-nowrap text-ellipsis text-primary">
                {aluno.nome}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mt-1.5 justify-center md:justify-start">
                <span className="text-xs text-muted">Membro desde {membroDesdeFmt}</span>
                <span
                  className="py-0.5 px-2.5 text-[10.5px] font-semibold rounded-full border text-primary"
                  style={{ borderColor: `${bc?.bg || '#888'}40`, background: `${bc?.bg || '#888'}14` }}
                >
                  {aluno.plano}
                </span>
              </div>
            </div>
          </div>

          {/* Anel de frequência */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className="flex justify-center items-center w-[72px] h-[72px] rounded-full"
              style={{ background: `conic-gradient(var(--gb-green) 0% ${aluno.frequencia}%, var(--border-subtle) ${aluno.frequencia}% 100%)` }}
            >
              <div className="flex justify-center items-center w-14 h-14 rounded-full bg-card">
                <span className="text-[15px] font-extrabold text-primary">{aluno.frequencia}%</span>
              </div>
            </div>
            <span className="text-[10px] tracking-[0.5px] uppercase text-muted">Frequência</span>
          </div>
        </div>

        {/* Faixa */}
        <div className="flex flex-wrap gap-3 justify-center items-center py-4 px-5 border-t border-border-subtle bg-elevated md:justify-between md:px-7">
          <div className="flex gap-3 items-center">
            <BeltBar belt={aluno.faixa as Belt} degrees={aluno.grau} size="md" />
            <span className="text-[14px] font-bold capitalize text-primary">
              {bc?.label} · {aluno.grau > 0 ? `${aluno.grau}° Grau` : 'Nenhum Grau'}
            </span>
          </div>
          <span className="text-[13px] text-secondary">
            <strong className="text-primary">{diasTreinoMes}</strong> {diasTreinoMes === 1 ? 'dia' : 'dias'} este mês
          </span>
        </div>
      </div>

      {/* Payment strip — a single compact line, only shown when something is
          actually due. Stacks on mobile, both lines flush to the same left
          edge (not label-left/CTA-right, which read as disjointed); goes
          back to one line with the CTA on the right once there's room. */}
      {sitFinanceira.aRegularizar && (
        <div
          className={[
            'flex flex-col gap-1 items-start py-2.5 px-3.5 mb-5 rounded-xl border sm:flex-row sm:items-center sm:justify-between sm:gap-3',
            emAtraso ? 'border-gb-red/30 bg-gb-red/[0.05]' : 'border-amber-500/30 bg-amber-500/[0.06]',
          ].join(' ')}
        >
          <div
            className="inline-flex flex-wrap gap-x-2 gap-y-0.5 items-center text-[12.5px] font-semibold"
            style={{ color: emAtraso ? GB.red : '#B45309' }}
          >
            <span className="inline-flex gap-1.5 items-center">
              <Ico icon={emAtraso ? ExclamationTriangleIcon : ClockIcon} sm />
              {emAtraso
                ? (sitFinanceira.emAberto.length > 1
                    ? `${sitFinanceira.emAberto.length} mensalidades em atraso`
                    : 'Pagamento em atraso')
                : 'Mensalidade a vencer'}
            </span>
            <span className="font-normal text-muted">
              · €{(emAtraso ? sitFinanceira.totalEmAberto : sitFinanceira.aRegularizar.valor).toFixed(2)}
              {emAtraso
                ? ` · desde ${fmtData(sitFinanceira.aRegularizar.vencimento)}`
                : sitFinanceira.dias === 0
                  ? ' · vence hoje'
                  : ` · vence ${fmtData(sitFinanceira.aRegularizar.vencimento)}`}
            </span>
          </div>
          <button
            onClick={() => onNavigate?.('meu-financeiro')}
            className="py-2.5 mt-1 w-full min-h-11 text-[12.5px] font-bold text-center bg-card rounded-md border cursor-pointer transition-colors duration-200 hover:bg-elevated active:bg-elevated sm:mt-0 sm:w-auto sm:min-h-0 sm:p-0 sm:bg-transparent sm:border-none sm:hover:bg-transparent sm:active:bg-transparent sm:hover:underline underline-offset-2"
            style={{
              color: emAtraso ? GB.red : '#B45309',
              borderColor: emAtraso ? GB.red : '#F59E0B',
            }}
          >
            {emAtraso ? 'Regularizar →' : 'Pagar agora →'}
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
                {proximasNoMesmoSlot.length > 1 ? `${proximasNoMesmoSlot.length} aulas` : proximaAula.turma.nome}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-1.5 text-[12.5px] text-secondary">
                <span className="inline-flex gap-1.5 items-center">
                  <Ico icon={ClockIcon} sm />{proximaAula.turma.horario}
                </span>
                {proximasNoMesmoSlot.length === 1 && (
                  <span className="inline-flex gap-1.5 items-center">
                    <Ico icon={MapPinIcon} sm />{proximaAula.turma.sala}
                  </span>
                )}
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

      {/* Recent activity */}
      <Card padding="lg">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Atividade Recente
        </div>
        {minhasPresencas.length > 0 ? (
          minhasPresencas.slice(0, 3).map((p) => (
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
