// @ts-nocheck
import { useTurmas, usePresencas, useAlunos } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { GB } from '../../lib/gbBrand';

const DIAS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const DIAS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

export default function MinhasAulas() {
  const { data: turmas } = useTurmas();
  const { data: presencas } = usePresencas();
  const { data: alunos } = useAlunos();
  const { user } = useAuth();
  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  const minhasTurmas = turmas.slice(0, 2);
  const minhasPresencas = presencas.filter(p => p.alunoId === aluno.id);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Aluno</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Minhas Aulas</h1>
      </div>

      {/* Weekly schedule */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Horário Semanal</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {DIAS.map((d, i) => {
            const full = DIAS_FULL[i];
            const aulas = minhasTurmas.filter(t => t.diaSemana.includes(full));
            return (
              <div key={d} style={{ textAlign: 'center' as const }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{d}</div>
                {aulas.length > 0 ? aulas.map(a => (
                  <div key={a.id} style={{ background: 'rgba(200,16,46,0.1)', border: '1px solid rgba(200,16,46,0.25)', borderRadius: 'var(--radius-sm)', padding: '6px 4px', marginBottom: 4 }}>
                    <div style={{ color: GB.red, fontSize: 10.5, fontWeight: 700 }}>{a.horario.split('-')[0]}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 9.5, marginTop: 2 }}>{a.nome.split(' ')[0]}</div>
                  </div>
                )) : (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '6px 4px', opacity: 0.4 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* My classes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {minhasTurmas.map(t => (
            <div key={t.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{t.nome}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Prof. {t.professorNome}</div>
                </div>
                <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>ATIVA</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Horário</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.horario}</div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Dias</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{t.diaSemana.join(' · ')}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 11 }}>📍 {t.sala}</div>
            </div>
          ))}
        </div>

        {/* Attendance history */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Histórico de Presenças</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: GB.red, fontSize: 26, fontWeight: 700 }}>{minhasPresencas.length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>aulas este mês</div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: '#22C55E', fontSize: 26, fontWeight: 700 }}>{aluno.frequencia}%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>frequência</div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: '#A78BFA', fontSize: 26, fontWeight: 700 }}>12</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>meta mensal</div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: aluno.frequencia >= 80 ? '#22C55E' : GB.red, height: '100%', width: `${Math.min(aluno.frequencia, 100)}%` }}/>
          </div>
          {minhasPresencas.length > 0 ? minhasPresencas.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{p.turmaNome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{p.data} · {p.hora}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 3 }}>{p.metodo}</span>
            </div>
          )) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Sem presenças registadas</p>
          )}
        </div>
      </div>
    </div>
  );
}
