import { useGraduacoes, useAlunos, usePresencas } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { GB, beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';

const BELT_PATH_KIDS: Belt[] = [
  'branca',
  'cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta',
];

const BELT_PATH_ADULT: Belt[] = ['branca','azul','roxa','marrom','preta'];

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
  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  const historico = graduacoes.filter(g => g.alunoId === aluno.id);
  const minhasPresencas = presencas.filter(p => p.alunoId === aluno.id);
  const diasTreino = new Set(minhasPresencas.map(p => p.data)).size;

  const idade = calcularIdade(aluno.dataNascimento);
  const isKids = idade !== null && idade < 16;
  const beltPath = isKids ? BELT_PATH_KIDS : BELT_PATH_ADULT;

  const beltIdx = beltPath.indexOf(aluno.faixa as Belt);
  const bc = beltConfig[aluno.faixa];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Aluno</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Minha Evolução</h1>
      </div>

      {/* Belt progression hero */}
      <div style={{ background: `linear-gradient(135deg, #150008 0%, ${GB.red}22 100%)`, border: `1px solid ${GB.red}30`, borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {idade !== null && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginBottom: 4 }}>
                {idade} anos · {isKids ? 'Programa Kids' : 'Programa Adultos'}
              </div>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Faixa atual</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 80, height: 14, background: bc?.bg || '#888', borderRadius: 3, border: aluno.faixa === 'branca' ? '1px solid #555' : 'none', boxShadow: `0 0 16px ${(bc?.bg || '#888')}66` }}/>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, textTransform: 'capitalize', lineHeight: 1 }}>{bc?.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>{aluno.grau}° Grau</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Progresso na faixa</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}>{aluno.grau}/4</div>
            <div style={{ width: 120, background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 6, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ background: GB.red, height: '100%', width: `${(aluno.grau / 4) * 100}%` }}/>
            </div>
          </div>
        </div>

        {/* Belt path — only relevant belts for the student's age */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {beltPath.map((b, i) => {
            const bc2 = beltConfig[b];
            const isCurrent = b === aluno.faixa;
            const isDone = i < beltIdx;
            return (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div title={bc2?.label || b} style={{ width: '100%', height: isCurrent ? 10 : 6, background: bc2?.bg || '#888', borderRadius: 2, border: b === 'branca' ? '1px solid #555' : 'none', opacity: isDone ? 1 : isCurrent ? 1 : 0.3, boxShadow: isCurrent ? `0 0 12px ${(bc2?.bg || '#888')}88` : 'none', transform: isCurrent ? 'scaleY(1.3)' : 'scaleY(1)', transition: 'all 0.2s' }}/>
                  {isCurrent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GB.red, boxShadow: `0 0 8px ${GB.red}` }}/>}
                </div>
                {i < beltPath.length - 1 && <div style={{ width: 4, height: 1, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}/>}
              </div>
            );
          })}
        </div>

        {/* Kids → Adult transition notice */}
        {isKids && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            Ao completar 16 anos passas para o programa adultos com faixa azul.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Stats */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Estatísticas</div>
          {[
            { label: 'Membro desde',    value: aluno.dataMatricula },
            idade !== null ? { label: 'Idade',          value: `${idade} anos` } : null,
            { label: 'Dias de treino',  value: `${diasTreino}` },
            { label: 'Frequência atual',value: `${aluno.frequencia}%` },
            { label: 'Graduações',      value: historico.length + 1 },
            { label: 'Grau atual',      value: `${aluno.grau}° de 4` },
          ].filter(Boolean).map((s: any) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Graduation history */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Histórico de Graduações</div>
          {historico.length > 0 ? historico.map(g => {
            const bcN = beltConfig[g.faixaNova];
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: (bcN?.bg || '#888') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎖️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize' }}>{bcN?.label} {g.grauNovo}° Grau</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{g.data} · {g.professorNome}</div>
                </div>
              </div>
            );
          }) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Nenhuma graduação registada</p>
          )}
        </div>
      </div>
    </div>
  );
}
