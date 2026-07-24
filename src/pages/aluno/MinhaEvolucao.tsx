import { CheckCircleIcon, Ico } from '@/lib/icons';
import { GB, beltConfig } from '../../lib/gbBrand';
import { useAlunos, useGraduacoes, usePresencas } from '../../lib/useData';

import type { Belt } from '../../types';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import PortalPageHeader from './PortalPageHeader';
import { useAuth } from '../../lib/auth';

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
        style={{
          background: `linear-gradient(135deg, #0D0508 0%, ${bc?.bg || '#888'} 100%)`,
          border: '1px solid rgba(200,16,46,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Same subtle texture and high-contrast treatment used in the portal hero. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(transparent 1px, rgba(255,255,255,0.02) 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                letterSpacing: '1.5px',
                textTransform: 'uppercase' as const,
                marginBottom: 6,
              }}
            >
              A tua jornada
            </div>
            <div
              style={{
                color: '#fff',
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              Evolução é consistência.
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                marginTop: 7,
              }}
            >
              Cada treino é mais um passo no teu percurso.
            </div>
            {idade !== null && (
              <div
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 11.5,
                  marginTop: 15,
                }}
              >
                {idade} anos · {isKids ? 'Programa Kids' : 'Programa Adultos'}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
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
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                marginTop: 4,
              }}
            >
              Frequência atual
            </div>
          </div>
        </div>
      </div>

      {/* Belt path — only relevant belts for the student's age */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}
        >
          Percurso de graduação
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 0 2px',
          }}
        >
          {beltPath.map((b, i) => {
            const bc2 = beltConfig[b];
            const isCurrent = b === aluno.faixa;
            const isDone = i < beltIdx;
            return (
              <div
                key={b}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    title={bc2?.label || b}
                    style={{
                      width: '100%',
                      height: isCurrent ? 10 : 6,
                      background: bc2?.bg || '#888',
                      borderRadius: 2,
                      border: b === 'branca' ? '1px solid #555' : 'none',
                      opacity: isDone ? 1 : isCurrent ? 1 : 0.3,
                      transform: isCurrent ? 'scaleY(1.3)' : 'scaleY(1)',
                      transition: 'all 0.2s',
                    }}
                  />
                  {isCurrent && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: GB.red,
                        border: '2px solid #fff',
                        outline: '1px solid rgba(15,15,15,0.28)',
                      }}
                    />
                  )}
                </div>
                {i < beltPath.length - 1 && (
                  <div
                    style={{
                      width: 4,
                      height: 1,
                      background: 'var(--border)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Kids → Adult transition notice */}
        {isKids && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: 11,
              position: 'relative',
            }}
          >
            Ao completar 16 anos passas para o programa adultos com faixa azul.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Stats */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              marginBottom: 16,
            }}
          >
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
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {s.label}
                </span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
        </div>

        {/* Graduation history */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              marginBottom: 16,
            }}
          >
            Histórico de Graduações
          </div>
          {historico.length > 0 ? (
            historico.map((g) => {
              const bcN = beltConfig[g.faixaNova];
              return (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: (bcN?.bg || '#888') + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    <Ico icon={CheckCircleIcon} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {bcN?.label} {g.grauNovo}° Grau
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>
                      {g.data} · {g.professorNome}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              Nenhuma graduação registada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
