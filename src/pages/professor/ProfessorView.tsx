import { useAlunos } from '../../lib/useData';
import {
  useMinhasAulasDadasQuery,
  useTurmasDoProfessorQuery,
  useAlunosDasAulasQuery,
  useAlunosDaTurmaQuery,
  useProfessoresListaQuery,
} from '../../hooks/useAulas';
import { useAuth } from '../../lib/auth';
import { GB, beltConfig } from '../../lib/gbBrand';
import { getBeltSystemForAge, podeGraduar } from '../../lib/alunoDomain';
import type { Belt } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import BeltBar from '../../components/common/BeltBar';
import { Avatar } from '../../components/layout/Layout';
import { Ico, MapPinIcon, ClockIcon, ArrowRightIcon } from '../../lib/icons';

const STATUS_BADGE: Record<'agendada' | 'em_curso' | 'concluida', { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  em_curso:  { color: 'success', label: 'Em curso' },
  concluida: { color: 'neutral', label: 'Concluída' },
  agendada:  { color: 'warning', label: 'Agendada' },
};

// Frequência recente da turma (últimos 60 dias) — substitui a antiga
// "inscrição" estática, que nunca refletiu quem realmente aparece.
function TurmaAlunosCount({ turmaId }: { turmaId: string }) {
  const { data: alunos = [] } = useAlunosDaTurmaQuery(turmaId);
  return <>{alunos.length} alunos</>;
}

// ─── Cartão de turma — info + média de comparência (aulas já dadas) ──
function TurmaInfoCard({
  t, nAulas, mediaPessoas, pctCapacidade,
}: {
  t: { id: string; nome: string; horario: string; diaSemana: string[]; sala: string; capacidade: number };
  nAulas: number; mediaPessoas: number; pctCapacidade: number;
}) {
  return (
    <Card padding="lg">
      <div className="mb-1 text-[13px] font-bold text-primary">{t.nome}</div>
      <div className="inline-flex gap-1.5 items-center mb-1 text-[11.5px] text-muted"><Ico icon={ClockIcon} sm />{t.horario} · {t.diaSemana.join(', ')}</div>
      <div className="inline-flex gap-1.5 items-center mb-2.5 text-[11px] text-muted">
        <Ico icon={MapPinIcon} sm />{t.sala} · <TurmaAlunosCount turmaId={t.id} /> · cap. {t.capacidade}
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border-subtle">
        {nAulas === 0 ? (
          <span className="text-[11px] text-muted">Ainda sem aulas dadas</span>
        ) : (
          <>
            <span className="text-[11.5px] text-secondary">
              Média <strong className="text-primary">{mediaPessoas.toFixed(1)}</strong> pessoas/aula
            </span>
            <span className="text-[11px] font-semibold text-muted">{pctCapacidade}% da capacidade</span>
          </>
        )}
      </div>
    </Card>
  );
}

export default function ProfessorView({ onNavigate }: { onNavigate?: (page: string, param?: string) => void }) {
  const { user } = useAuth();
  const { data: turmas = [] } = useTurmasDoProfessorQuery(user?.id);
  const { data: alunos } = useAlunos();
  const { data: alunosDasAulas = [] } = useAlunosDasAulasQuery(user?.id);
  const { data: aulasDadas = [] } = useMinhasAulasDadasQuery(user?.id);
  const { data: professoresLista = [] } = useProfessoresListaQuery();

  const nome = user?.nome || 'Professor';
  const eu = professoresLista.find(p => p.id === user?.id);
  const faixa = (eu?.faixa as Belt) || 'preta';
  const grau = eu?.grau ?? 0;
  const bc = beltConfig[faixa];
  const candidatosGraduacao = alunos.filter(a =>
    a.status === 'ativo' && a.frequencia >= 70 && podeGraduar(a.faixa || 'branca', a.grau || 0, getBeltSystemForAge(a.dataNascimento)),
  );

  // ── Médias por turma — a partir das aulas já dadas, agrupadas por turma.
  const mediasPorTurma = turmas.map(t => {
    const aulasDaTurma = aulasDadas.filter(a => a.turmaId === t.id);
    const nAulas = aulasDaTurma.length;
    const mediaPessoas = nAulas > 0 ? aulasDaTurma.reduce((s, a) => s + a.presentesCount, 0) / nAulas : 0;
    const pctCapacidade = t.capacidade > 0 ? Math.min(100, Math.round((mediaPessoas / t.capacidade) * 100)) : 0;
    return { turma: t, nAulas, mediaPessoas, pctCapacidade };
  });
  const turmasComDados = mediasPorTurma.filter(m => m.nAulas > 0);
  const taxaMediaComparencia = turmasComDados.length > 0
    ? Math.round(turmasComDados.reduce((s, m) => s + m.pctCapacidade, 0) / turmasComDados.length)
    : 0;

  const hoje = new Date();
  const aulasEsteMes = aulasDadas.filter(a => {
    const d = new Date(a.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  return (
    <div>
      {/* Masthead — mesmo formato do cartão do aluno (identidade + anel +
          tira de faixa), adaptado ao professor: o anel mostra a taxa média
          de comparência das suas turmas em vez de frequência pessoal. */}
      <div className="overflow-hidden mb-6 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap gap-5 justify-center items-center pt-6 pb-6 px-5 text-center md:justify-between md:px-7 md:text-left">
          <div className="flex flex-col gap-3 items-center min-w-0 md:flex-row md:items-center">
            <Avatar user={{ avatar: user?.avatar, nome }} accent={bc?.bg || GB.red} size={64} />
            <div className="min-w-0">
              <div className="mb-1 text-[11px] tracking-[1.5px] uppercase text-muted">Professor</div>
              <h1 className="overflow-hidden m-0 text-[26px] md:text-[32px] font-black leading-none whitespace-nowrap text-ellipsis text-primary">
                {nome}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mt-1.5 justify-center md:justify-start">
                <span className="text-xs text-muted">
                  {turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'} · {alunosDasAulas.length} alunos
                </span>
              </div>
            </div>
          </div>

          {/* Anel de comparência — média de presenças ÷ capacidade nas turmas do professor */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className="flex justify-center items-center w-[72px] h-[72px] rounded-full"
              style={{ background: `conic-gradient(var(--gb-green) 0% ${taxaMediaComparencia}%, var(--border-subtle) ${taxaMediaComparencia}% 100%)` }}
            >
              <div className="flex justify-center items-center w-14 h-14 rounded-full bg-card">
                <span className="text-[15px] font-extrabold text-primary">{taxaMediaComparencia}%</span>
              </div>
            </div>
            <span className="text-[10px] tracking-[0.5px] uppercase text-muted">Comparência</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center items-center py-4 px-5 border-t border-border-subtle bg-elevated md:justify-between md:px-7">
          <div className="flex gap-3 items-center">
            <BeltBar belt={faixa} degrees={grau} size="md" />
            <span className="text-[14px] font-bold capitalize text-primary">
              {bc?.label} · {grau > 0 ? `${grau}° Grau` : 'Nenhum Grau'}
            </span>
          </div>
          <span className="text-[13px] text-secondary">
            <strong className="text-primary">{aulasEsteMes}</strong> {aulasEsteMes === 1 ? 'aula' : 'aulas'} este mês
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-[18px] md:grid-cols-4">
        {[
          { label: 'Minhas Turmas',           value: turmas.length },
          { label: 'Alunos nas Minhas Aulas', value: alunosDasAulas.length },
          { label: 'Aulas Dadas',             value: aulasDadas.length },
          { label: 'Candidatos Grad.',        value: candidatosGraduacao.length },
        ].map(s => (
          <div key={s.label} className="py-3.5 px-4 rounded-xl border border-border bg-card">
            <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
            <div className="text-2xl font-extrabold text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Médias por Turma</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 mb-6">
        {mediasPorTurma.length === 0 ? (
          <div className="py-6 text-[13px] text-center text-muted col-span-full">Ainda não tens turmas atribuídas.</div>
        ) : mediasPorTurma.map(m => (
          <TurmaInfoCard key={m.turma.id} t={m.turma} nAulas={m.nAulas} mediaPessoas={m.mediaPessoas} pctCapacidade={m.pctCapacidade} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
        {/* Belt distribution — só alunos que passaram por aulas deste professor */}
        <Card padding="lg">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Distribuição de Faixas</div>
          {alunosDasAulas.length === 0 ? (
            <div className="py-4 text-[13px] text-center text-muted">Ainda sem presenças nas tuas aulas.</div>
          ) : (Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][]).map(([f, cfg]) => {
            const count = alunosDasAulas.filter(a => a.faixa === f).length;
            if (!count) return null;
            return (
              <div key={f} className="flex gap-2 items-center mb-2">
                <div className="w-[18px] h-1.5 rounded-sm shrink-0" style={{ background: cfg.bg, border: f === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                <span className="w-12 text-[11.5px] capitalize text-secondary">{cfg.label}</span>
                <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                  <div className="h-full" style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, width: `${(count / alunosDasAulas.length) * 100}%` }}/>
                </div>
                <span className="w-3.5 text-[11px] text-right text-muted">{count}</span>
              </div>
            );
          })}
        </Card>

        {/* Aulas recentes — atalho para a página dedicada */}
        <Card padding="lg">
          <div className="flex justify-between items-center mb-3.5">
            <div className="text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Aulas Recentes</div>
          </div>
          {aulasDadas.length === 0 ? (
            <div className="py-4 text-[13px] text-center text-muted">Ainda não deste nenhuma aula.</div>
          ) : (
            <div className="flex flex-col gap-1.5 mb-3">
              {aulasDadas.slice(0, 5).map(a => (
                <button key={a.id} onClick={() => onNavigate?.('aula-detalhe', a.id)}
                  className="flex justify-between items-center py-2 px-2.5 w-full text-left rounded-sm cursor-pointer transition-colors duration-200 outline-none hover:bg-elevated active:bg-elevated focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset"
                >
                  <div className="min-w-0">
                    <div className="overflow-hidden text-[12.5px] font-semibold whitespace-nowrap text-ellipsis text-primary">{a.turmaNome}</div>
                    <div className="text-[10.5px] text-muted">{a.data}</div>
                  </div>
                  <Badge color={STATUS_BADGE[a.status].color}>{STATUS_BADGE[a.status].label}</Badge>
                </button>
              ))}
            </div>
          )}
          <Button variant="secondary" fullWidth size="sm" onClick={() => onNavigate?.('aulas')}>
            Ver todas as aulas <Ico icon={ArrowRightIcon} sm />
          </Button>
        </Card>
      </div>
    </div>
  );
}
