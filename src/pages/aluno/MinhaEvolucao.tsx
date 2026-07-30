import { CheckCircleIcon, Ico } from '@/lib/icons';
import { beltConfig } from '../../lib/gbBrand';
import { useAlunos, useGraduacoes, usePresencas } from '../../lib/useData';

import type { Belt } from '../../types';
import PortalPageHeader from './PortalPageHeader';
import { useAuth } from '../../lib/auth';
import Card from '../../components/common/Card';

const BELT_PATH_KIDS: Belt[] = [
  'branca',
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
];

const BELT_PATH_ADULT: Belt[] = ['branca', 'azul', 'roxa', 'marrom', 'preta'];

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
  const { data: presencas } = usePresencas();
  const { user } = useAuth();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const historico = graduacoes.filter((g) => g.alunoId === aluno.id);
  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);
  const diasTreino = new Set(minhasPresencas.map((p) => p.data)).size;

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
  const ADULT_ONLY_BELTS = new Set(['azul', 'roxa', 'marrom', 'preta']);

  const isKidsByBelt = KIDS_BELTS.has(aluno.faixa as string);
  const isAdultByBelt = ADULT_ONLY_BELTS.has(aluno.faixa as string);
  const isKids =
    isKidsByBelt || (idade !== null && idade < 16 && !isAdultByBelt);
  const beltPath = isKids ? BELT_PATH_KIDS : BELT_PATH_ADULT;

  const beltIdx = beltPath.indexOf(aluno.faixa as Belt);
  const bc = beltConfig[aluno.faixa];

  return (
    <div>
      <PortalPageHeader
        title="Minha Evolução"
        description="Acompanha a tua progressão, graduações e frequência."
      />

      {/* Belt progression hero */}
      <div
        className="overflow-hidden relative py-6 px-7 mb-4 rounded-lg border border-gb-red/20"
        style={{ background: `linear-gradient(135deg, #0D0508 0%, ${bc?.bg || '#888'} 100%)` }}
      >
        {/* Same subtle texture and high-contrast treatment used in the portal hero. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(transparent 1px, rgba(255,255,255,0.02) 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="flex relative gap-5 justify-between items-center">
          <div>
            <div className="mb-1.5 text-[11px] tracking-[1.5px] uppercase text-white/50">
              A tua jornada
            </div>
            <div className="text-2xl font-extrabold leading-none text-white">
              Evolução é consistência.
            </div>
            <div className="mt-1.5 text-[13px] text-white/70">
              Cada treino é mais um passo no teu percurso.
            </div>
            {idade !== null && (
              <div className="mt-4 text-[11.5px] text-white/65">
                {idade} anos · {isKids ? 'Programa Kids' : 'Programa Adultos'}
              </div>
            )}
          </div>
          <div className="text-center shrink-0">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              aria-label={`Frequência atual: ${aluno.frequencia}%`}
            >
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="#fff"
                strokeWidth="6"
                strokeDasharray={`${(2 * Math.PI * 34 * aluno.frequencia) / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
              <text
                x="40"
                y="44"
                textAnchor="middle"
                fill="#fff"
                fontSize="15"
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
              >
                {aluno.frequencia}%
              </text>
            </svg>
            <div className="mt-1 text-[11px] text-white/70">
              Frequência atual
            </div>
          </div>
        </div>
      </div>

      {/* Belt path — only relevant belts for the student's age */}
      <Card padding="lg" className="mb-4">
        <div className="mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Percurso de graduação
        </div>
        <div className="flex gap-1.5 items-center py-1.5 pb-0.5">
          {beltPath.map((b, i) => {
            const bc2 = beltConfig[b];
            const isCurrent = b === aluno.faixa;
            const isDone = i < beltIdx;
            return (
              <div key={b} className="flex flex-1 gap-1 items-center">
                <div className="flex flex-col flex-1 gap-1 items-center">
                  <div
                    title={bc2?.label || b}
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: isCurrent ? 10 : 6,
                      background: bc2?.bg || '#888',
                      border: b === 'branca' ? '1px solid #555' : 'none',
                      opacity: isDone ? 1 : isCurrent ? 1 : 0.3,
                      transform: isCurrent ? 'scaleY(1.3)' : 'scaleY(1)',
                    }}
                  />
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full border-2 border-white outline outline-1 outline-black/[0.28] bg-gb-red" />
                  )}
                </div>
                {i < beltPath.length - 1 && (
                  <div className="w-1 h-px shrink-0 bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {/* Kids → Adult transition notice */}
        {isKids && (
          <div className="relative pt-3 mt-3.5 text-[11px] border-t border-border-subtle text-muted">
            Ao completar 16 anos passas para o programa adultos com faixa azul.
          </div>
        )}
      </Card>

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
                    <div className="text-[12.5px] font-semibold capitalize text-primary">
                      {bcN?.label} {g.grauNovo}° Grau
                    </div>
                    <div className="text-[10.5px] text-muted">
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
    </div>
  );
}
