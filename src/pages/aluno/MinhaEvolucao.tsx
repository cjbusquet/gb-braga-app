import { CheckCircleIcon, Ico } from '@/lib/icons';
import { beltConfig } from '../../lib/gbBrand';
import { useAlunos, useGraduacoes, usePresencas } from '../../lib/useData';
import { useDiasFrequentesQuery } from '../../hooks/useAnalytics';

import type { Belt } from '../../types';
import PortalPageHeader from './PortalPageHeader';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';
import { SkeletonList } from '../../components/common/Skeleton';
import BeltBadge from '../../components/common/BeltBadge';
import BeltBar from '../../components/common/BeltBar';

const DIAS_SEMANA_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_JANELA = 6;

/** "1 ano e 3 meses" / "4 meses" a partir de uma data ISO. */
function tempoDesde(dataIso: string): string {
  const inicio = new Date(dataIso);
  if (isNaN(inicio.getTime())) return '-';
  const hoje = new Date();
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  if (hoje.getDate() < inicio.getDate()) meses--;
  meses = Math.max(0, meses);
  const anos = Math.floor(meses / 12);
  const restoMeses = meses % 12;
  if (anos === 0) return `${restoMeses} ${restoMeses === 1 ? 'mês' : 'meses'}`;
  if (restoMeses === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${restoMeses} ${restoMeses === 1 ? 'mês' : 'meses'}`;
}


function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function MinhaEvolucao() {
  const { data: alunos } = useAlunos();
  const { data: graduacoes } = useGraduacoes();
  const { user } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const { data: presencas } = usePresencas(aluno?.id, 400);
  const { data: diasFrequentes = [] } = useDiasFrequentesQuery(aluno?.id);
  if (!aluno) return <SkeletonList rows={4} />;

  const historico = graduacoes.filter((g) => g.alunoId === aluno.id);
  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);
  const diasTreino = new Set(minhasPresencas.map((p) => p.data)).size;
  const desdeFaixaAtual = historico[0]?.data || aluno.dataMatricula;
  const maxDiaFrequente = Math.max(1, ...diasFrequentes.map((d) => d.total));

  // Dias (únicos) treinados por mês, últimos MESES_JANELA meses.
  const hoje = new Date();
  const diasPorMes = Array.from({ length: MESES_JANELA }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (MESES_JANELA - 1 - i), 1);
    const dias = new Set(
      minhasPresencas
        .filter((p) => {
          const pd = new Date(p.data);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .map((p) => p.data),
    ).size;
    return { label: MESES_LABEL[d.getMonth()], dias };
  });
  const maxDiasMes = Math.max(1, ...diasPorMes.map((m) => m.dias));

  const idade = calcularIdade(aluno.dataNascimento);

  const KIDS_BELTS = new Set([
    'cinza-branca',
    'cinza',
    'cinza-preta',
    'amarela-branca',
    'amarela',
    'amarela-preta',
    'laranja-branca',
    'laranja',
    'laranja-preta',
    'verde-branca',
    'verde',
    'verde-preta',
  ]);
  const ADULT_ONLY_BELTS = new Set(['azul', 'roxa', 'marrom', 'preta', 'vermelha-preta', 'vermelha-branca', 'vermelha']);

  const isKidsByBelt = KIDS_BELTS.has(aluno.faixa as string);
  const isAdultByBelt = ADULT_ONLY_BELTS.has(aluno.faixa as string);
  const isKids =
    isKidsByBelt || (idade !== null && idade < 16 && !isAdultByBelt);
  const bc = beltConfig[aluno.faixa];

  return (
    <div>
      <PortalPageHeader
        title="Minha Evolução"
        description="Acompanha a tua progressão, graduações e frequência."
      />

      {/* Cartão de progresso — mesmo formato de cartão do Portal (marca no
          topo, corpo, faixa elevada em baixo), mas o conteúdo é a faixa em
          si em destaque, não a identidade do aluno (isso já está no Portal;
          aqui o que interessa é onde vais e há quanto tempo). */}
      <div className="overflow-hidden mb-4 rounded-xl border border-border bg-card">
        {/* Faixa atual em destaque */}
        <div className="flex flex-col gap-4 items-center pt-7 pb-8 px-5 text-center md:px-7">
          <div className="text-[11px] tracking-[1.5px] uppercase text-muted">
            A tua faixa atual
          </div>
          <BeltBar belt={aluno.faixa as Belt} degrees={aluno.grau} size="lg" />
          <div className="text-2xl md:text-[28px] font-black leading-none capitalize text-primary">
            {bc?.label}
            {aluno.grau > 0 && <span className="font-semibold text-muted"> · {aluno.grau}° Grau</span>}
          </div>
        </div>

        {/* Tempo nesta faixa + frequência */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center items-center py-4 px-5 border-t border-border-subtle bg-elevated md:px-7">
          <span className="text-[13px] text-secondary">
            Há <strong className="text-primary">{tempoDesde(desdeFaixaAtual)}</strong> nesta faixa
          </span>
          <span className="text-[13px] text-secondary">
            Frequência <strong className="text-primary">{aluno.frequencia}%</strong>
          </span>
        </div>
      </div>

      {/* Nota de transição kids→adultos — única coisa que valia a pena manter
          do percurso de graduação (removido: já era a 3ª faixa mostrada na
          página, a seguir à do cartão acima e ao BeltBadge das estatísticas). */}
      {isKids && (
        <p className="mb-4 text-[11.5px] text-muted">
          Ao completar 16 anos passas para o programa adultos com faixa azul.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Stats */}
        <Card padding="lg">
          <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Estatísticas
          </div>
          {[
            { label: 'Membro desde', value: aluno.dataMatricula },
            idade !== null ? { label: 'Idade', value: `${idade} anos` } : null,
            { label: 'Dias de treino', value: `${diasTreino}` },
            { label: 'Frequência atual', value: `${aluno.frequencia}%` },
            { label: 'Graduações', value: historico.length + 1 },
            { label: 'Grau atual', value: `${aluno.grau}° de 4` },
            { label: 'Tempo na faixa atual', value: tempoDesde(desdeFaixaAtual) },
          ]
            .filter((s): s is NonNullable<typeof s> => Boolean(s))
            .map((s) => (
              <div
                key={s.label}
                className="flex justify-between py-2 border-b border-border-subtle"
              >
                <span className="text-xs text-muted">
                  {s.label}
                </span>
                <span className="text-xs font-bold text-primary">
                  {s.value}
                </span>
              </div>
            ))}
        </Card>

        {/* Graduation history */}
        <Card padding="lg">
          <div className="mb-4 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Histórico de Graduações
          </div>
          {historico.length > 0 ? (
            historico.map((g) => {
              const bcN = beltConfig[g.faixaNova];
              return (
                <div
                  key={g.id}
                  className="flex gap-2.5 items-center py-2.5 border-b border-border-subtle"
                >
                  <div
                    className="flex justify-center items-center w-9 h-9 text-lg rounded-full shrink-0"
                    style={{ background: (bcN?.bg || '#888') + '20' }}
                  >
                    <Ico icon={CheckCircleIcon} />
                  </div>
                  <div className="flex-1">
                    <BeltBadge faixa={g.faixaNova} grau={g.grauNovo} size="sm" />
                    <div className="mt-0.5 text-[10.5px] text-muted">
                      {g.data} · {g.professorNome}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="mt-5 text-[13px] text-center text-muted">
              Nenhuma graduação registada
            </p>
          )}
        </Card>
      </div>

      {/* Dias de treino por mês — tendência ao longo do tempo, em vez de mais
          uma faixa; complementa "Dias que mais treinas" (por dia da semana). */}
      <Card padding="lg" className="mt-4">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Dias de treino por mês
        </div>
        {diasPorMes.map((m) => (
          <div key={m.label} className="flex gap-2 items-center mb-2">
            <span className="w-10 text-[11.5px] text-secondary">{m.label}</span>
            <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
              <div className="h-full bg-gb-green" style={{ width: `${(m.dias / maxDiasMes) * 100}%` }} />
            </div>
            <span className="w-6 text-[11px] text-right text-muted">{m.dias}</span>
          </div>
        ))}
      </Card>

      {/* Dias que mais treinas */}
      {diasFrequentes.length > 0 && (
        <Card padding="lg" className="mt-4">
          <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
            Dias que mais treinas
          </div>
          {diasFrequentes
            .slice()
            .sort((a, b) => b.total - a.total)
            .map((d) => (
              <div key={d.diaSemana} className="flex gap-2 items-center mb-2">
                <span className="w-16 text-[11.5px] text-secondary">{DIAS_SEMANA_LABEL[d.diaSemana]}</span>
                <div className="overflow-hidden flex-1 h-[5px] rounded-full bg-elevated">
                  <div className="h-full bg-gb-red" style={{ width: `${(d.total / maxDiaFrequente) * 100}%` }} />
                </div>
                <span className="w-6 text-[11px] text-right text-muted">{d.total}</span>
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}
