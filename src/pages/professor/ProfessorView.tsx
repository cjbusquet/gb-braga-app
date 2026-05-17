// @ts-nocheck
import { useState } from 'react';
import { useTurmas, useAlunos, usePresencas, useGraduacoes } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', ...style }}>{children}</div>;
}

const DAYS_ABR = ['Seg','Ter','Qua','Qui','Sex','Sáb'];
const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

export default function ProfessorView() {
  const { data: turmas } = useTurmas();
  const { data: alunos } = useAlunos();
  const { data: presencas } = usePresencas();
  const { data: graduacoes } = useGraduacoes();
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview'|'classes'|'students'|'attendance'|'graduation'>('overview');

  const nome = user?.nome || 'Professor';
  const allAlunos = alunos.filter(a => a.status === 'ativo');
  const allPresencas = presencas;
  const candidatosGraduacao = allAlunos.filter(a => a.frequencia >= 70);

  const TABS = [
    { id: 'overview',    icon: '⊞', label: 'Visão Geral' },
    { id: 'classes',     icon: '▤', label: 'Turmas'       },
    { id: 'students',    icon: '◎', label: 'Alunos'       },
    { id: 'attendance',  icon: '✓', label: 'Presenças'    },
    { id: 'graduation',  icon: '◈', label: 'Graduação'    },
  ];

  return (
    <div>
      {/* Profile header — no financial data */}
      <div style={{ background: 'linear-gradient(135deg, rgba(200,16,46,0.06) 0%, transparent 60%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 4 }}>Painel do Professor</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const, margin: 0 }}>
            Bem-vindo, {nome.split(' ')[0]}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Gracie Barra Braga · {allAlunos.length} alunos · {turmas.length} turmas · OSS! 🥋
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--gb-red)', fontFamily: 'var(--font-display)' }}>
            {nome.charAt(0)}
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{nome}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>Faixa Preta · Gracie Barra</div>
            <div style={{ color: '#16A34A', fontSize: 11, marginTop: 1, fontWeight: 600 }}>● Ativo</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', fontSize: 13, color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: tab === t.id ? 700 : 400, borderBottom: `2px solid ${tab === t.id ? 'var(--gb-red)' : 'transparent'}`, marginBottom: -1 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW — NO FINANCIAL DATA ── */}
      {tab === 'overview' && (
        <div>
          {/* KPIs — only non-financial */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Minhas Turmas',     value: turmas.length,           accent: 'var(--gb-red)' },
              { label: 'Alunos Ativos',     value: allAlunos.length,            accent: '#2563EB' },
              { label: 'Check-ins (mês)',   value: allPresencas.length,         accent: '#16A34A' },
              { label: 'Candidatos Grad.', value: candidatosGraduacao.length,  accent: '#7C3AED' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `3px solid ${s.accent}`, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Weekly schedule */}
            <Card style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Horário Semanal</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
                {DAYS_ABR.map((d, i) => {
                  const turmas = turmas.filter(t => t.diaSemana.includes(DAYS_FULL[i]));
                  return (
                    <div key={d} style={{ textAlign: 'center' as const }}>
                      <div style={{ color: turmas.length ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, marginBottom: 5 }}>{d}</div>
                      {turmas.length > 0 ? turmas.map((t, ti) => (
                        <div key={ti} style={{ background: 'rgba(200,16,46,0.07)', border: '1px solid rgba(200,16,46,0.18)', borderRadius: 5, padding: '3px 2px', marginBottom: 3 }}>
                          <div style={{ color: 'var(--gb-red)', fontSize: 8.5, fontWeight: 700, lineHeight: 1.2 }}>{t.horario.split('-')[0]}</div>
                        </div>
                      )) : (
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 5, padding: '3px 2px', opacity: 0.4 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>—</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Belt distribution */}
            <Card style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 14 }}>Distribuição de Faixas</div>
              {(Object.entries(beltConfig) as [Belt, typeof beltConfig[Belt]][]).map(([faixa, cfg]) => {
                const count = allAlunos.filter(a => a.faixa === faixa).length;
                if (!count) return null;
                return (
                  <div key={faixa} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 18, height: 6, background: cfg.bg, borderRadius: 2, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none', flexShrink: 0 }}/>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11.5, width: 48, textTransform: 'capitalize' as const }}>{cfg.label}</span>
                    <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                      <div style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, height: '100%', width: `${(count / allAlunos.length) * 100}%` }}/>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 14, textAlign: 'right' as const }}>{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Recent check-ins */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Últimas Presenças</div>
              <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>● AO VIVO</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {allPresencas.slice(0, 9).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.alunoNome}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{p.hora}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── CLASSES ── */}
      {tab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {turmas.map(t => {
            const ocupacao = Math.round((t.inscritos / t.capacidade) * 100);
            return (
              <Card key={t.id} style={{ padding: 20, borderTop: '3px solid var(--gb-red)' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.nome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginBottom: 14 }}>📍 {t.sala}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9.5, marginBottom: 2 }}>HORÁRIO</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.horario}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9.5, marginBottom: 2 }}>ALUNOS</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{t.inscritos}/{t.capacidade}</div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>{t.diaSemana.join(' · ')}</div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>Ocupação</span>
                    <span style={{ color: ocupacao >= 90 ? '#EF4444' : '#16A34A', fontSize: 10.5, fontWeight: 700 }}>{ocupacao}%</span>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                    <div style={{ background: ocupacao >= 90 ? '#EF4444' : '#16A34A', height: '100%', width: `${ocupacao}%` }}/>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── STUDENTS ── */}
      {tab === 'students' && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {['Aluno', 'Faixa / Grau', 'Frequência', 'Estado', 'Grad. Possível'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAlunos.map(a => {
                const bc = beltConfig[a.faixa];
                const podeGraduar = a.frequencia >= 70 && a.grau < 4;
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: (bc?.bg || '#888') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || 'var(--gb-red)'), fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{a.nome.charAt(0)}</div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.dataMatricula}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 7, background: bc?.bg || '#888', borderRadius: 2, border: a.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' as const }}>{bc?.label} · {a.grau}° grau</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 5, width: 60, overflow: 'hidden' }}>
                          <div style={{ background: a.frequencia >= 80 ? '#16A34A' : a.frequencia >= 60 ? '#D97706' : 'var(--gb-red)', height: '100%', width: `${a.frequencia}%` }}/>
                        </div>
                        <span style={{ color: a.frequencia >= 80 ? '#16A34A' : a.frequencia >= 60 ? '#D97706' : 'var(--gb-red)', fontSize: 12, fontWeight: 700 }}>{a.frequencia}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: a.status === 'ativo' ? 'rgba(22,163,74,0.08)' : 'rgba(200,16,46,0.08)', color: a.status === 'ativo' ? '#16A34A' : 'var(--gb-red)', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize' as const }}>{a.status}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {podeGraduar
                        ? <span style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>✓ Elegível</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── ATTENDANCE ── */}
      {tab === 'attendance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total este mês',    value: allPresencas.length, accent: 'var(--gb-red)' },
              { label: 'Média por aula',    value: Math.round(allPresencas.length / 5) || 12, accent: '#2563EB' },
              { label: 'Taxa de presença',  value: '78%', accent: '#16A34A' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `3px solid ${s.accent}`, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  {['Aluno', 'Turma', 'Data', 'Hora', 'Método'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPresencas.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.alunoNome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{p.turmaNome}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.data}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.hora}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{p.metodo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── GRADUATION ── */}
      {tab === 'graduation' && (
        <div>
          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎖️</span>
            <div>
              <div style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700 }}>Próxima Cerimónia de Graduação</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{candidatosGraduacao.length} alunos elegíveis (frequência ≥ 70%)</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {candidatosGraduacao.map(a => {
              const bc = beltConfig[a.faixa];
              const belts = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];
              const nextFaixa = a.grau >= 4 ? (belts[belts.indexOf(a.faixa)+1] || a.faixa) : a.faixa;
              const nextGrau = a.grau >= 4 ? 1 : a.grau + 1;
              const nextBc = beltConfig[nextFaixa];
              return (
                <Card key={a.id} style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: (bc?.bg || '#888') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || 'var(--gb-red)'), fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{a.nome.charAt(0)}</div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Frequência: {a.frequencia}%</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ flex: 1, textAlign: 'center' as const }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 4 }}>ATUAL</div>
                      <div style={{ width: 28, height: 8, background: bc?.bg || '#888', borderRadius: 2, margin: '0 auto', border: a.faixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3, textTransform: 'capitalize' as const }}>{bc?.label} G{a.grau}</div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>
                    <div style={{ flex: 1, textAlign: 'center' as const }}>
                      <div style={{ color: '#16A34A', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 4 }}>PRÓXIMA</div>
                      <div style={{ width: 28, height: 8, background: nextBc?.bg || '#888', borderRadius: 2, margin: '0 auto', border: nextFaixa === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                      <div style={{ color: '#16A34A', fontSize: 10, marginTop: 3, textTransform: 'capitalize' as const, fontWeight: 600 }}>{nextBc?.label} G{nextGrau}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Graduation history */}
          <div style={{ marginTop: 20 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 12 }}>Histórico de Graduações</div>
            <Card>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                    {['Aluno', 'De', 'Para', 'Data', 'Observação'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {graduacoes.map(g => {
                    const bcA = beltConfig[g.faixaAnterior];
                    const bcN = beltConfig[g.faixaNova];
                    return (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.alunoNome}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 16, height: 6, background: bcA?.bg || '#888', borderRadius: 2, border: g.faixaAnterior === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' as const }}>{bcA?.label} G{g.grauAnterior}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 16, height: 6, background: bcN?.bg || '#888', borderRadius: 2, border: g.faixaNova === 'branca' ? '1px solid var(--border-strong)' : 'none' }}/>
                            <span style={{ color: '#16A34A', fontSize: 11, textTransform: 'capitalize' as const, fontWeight: 600 }}>{bcN?.label} G{g.grauNovo}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{g.data}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{g.observacao || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
