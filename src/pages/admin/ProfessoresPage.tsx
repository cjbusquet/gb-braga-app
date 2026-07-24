import { useState } from 'react';
import { useProfessores, useProfessorCheckins } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', ...style }}>{children}</div>;
}

function BeltBadge({ faixa, grau }: { faixa: string; grau: number }) {
  const cfg = (beltConfig as Record<string, { bg: string; text: string; label: string }>)[faixa] || { bg: '#888', text: '#fff', label: faixa };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ background: cfg.bg, color: cfg.text, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, border: faixa === 'branca' ? '1px solid #ccc' : 'none', whiteSpace: 'nowrap' as const }}>
        {cfg.label}
      </span>
      {grau > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>G{grau}</span>}
    </span>
  );
}

function duracao(inicio: string, fim?: string): string {
  if (!fim) return '—';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

export default function ProfessoresPage() {
  const { data: professores } = useProfessores();
  const { data: todosCheckins } = useProfessorCheckins();
  const { isMobile } = useMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = professores.find(p => p.id === selectedId);
  const checkinsProfSel = todosCheckins.filter(c => c.professorId === selectedId);

  const hoje = new Date().toISOString().split('T')[0];
  const checkinsHoje = todosCheckins.filter(c => c.data === hoje);
  const ativos = todosCheckins.filter(c => c.status === 'ativa');

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(200,16,46,0.06) 0%, transparent 60%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '16px 18px' : '20px 24px', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 4 }}>Gestão de Professores</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Professores</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{professores.length} professores · {checkinsHoje.length} aulas hoje · {ativos.length} em curso</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Professores', value: professores.length,       accent: 'var(--gb-red)' },
          { label: 'Aulas Hoje',  value: checkinsHoje.length,      accent: '#2563EB' },
          { label: 'Em Curso',    value: ativos.length,             accent: '#16A34A' },
          { label: 'Total Check-ins', value: todosCheckins.length, accent: '#7C3AED' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedId && !isMobile ? '320px 1fr' : '1fr', gap: 16 }}>
        {/* Professors list */}
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 10 }}>Lista de Professores</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {professores.map(p => {
              const checkinProf = todosCheckins.filter(c => c.professorId === p.id);
              const ativo = checkinProf.find(c => c.status === 'ativa');
              const hoje_count = checkinProf.filter(c => c.data === hoje).length;
              const bc = beltConfig[p.faixa] || { bg: '#888', text: '#fff', label: p.faixa };
              const isSelected = selectedId === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(isSelected ? null : p.id)}
                  style={{ background: isSelected ? 'rgba(200,16,46,0.05)' : 'var(--bg-card)', border: `1.5px solid ${isSelected ? 'var(--gb-red)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-xs)' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${bc.bg}20`, border: `2px solid ${bc.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: bc.bg === '#F0EEFF' ? '#888' : bc.bg, flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                    {p.nome.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.nome}</div>
                    <div style={{ marginTop: 3 }}><BeltBadge faixa={p.faixa} grau={p.grau} /></div>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    {ativo
                      ? <div style={{ color: '#16A34A', fontSize: 10.5, fontWeight: 700 }}>● Em aula</div>
                      : <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{hoje_count} hoje</div>
                    }
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{p.turmas.length} turmas</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 10 }}>
              Check-ins — {selected.nome}
            </div>

            {/* Professor info */}
            <Card style={{ padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', border: '2px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--gb-red)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                  {selected.nome.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{selected.nome}</div>
                  <div style={{ marginTop: 3 }}><BeltBadge faixa={selected.faixa} grau={selected.grau} /></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 3 }}>{selected.email} · {selected.telefone}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>TOTAL AULAS</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800 }}>{checkinsProfSel.length}</div>
                </div>
              </div>
            </Card>

            {/* Aula em curso */}
            {(() => {
              const ativa = checkinsProfSel.find(c => c.status === 'ativa');
              if (!ativa) return null;
              return (
                <div style={{ background: 'rgba(22,163,74,0.07)', border: '1.5px solid rgba(22,163,74,0.25)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A', display: 'inline-block', flexShrink: 0, animation: 'pulse 1.5s infinite' }}/>
                  <div>
                    <div style={{ color: '#16A34A', fontSize: 13, fontWeight: 700 }}>Aula em curso agora</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{ativa.turmaNome} · desde {ativa.horaInicio}</div>
                  </div>
                </div>
              );
            })()}

            {/* Check-in history table */}
            <Card>
              {checkinsProfSel.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13 }}>Nenhum check-in registado.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                      {['Turma','Data','Início','Fim','Duração','Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkinsProfSel.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.turmaNome}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.data}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.horaInicio}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.horaFim || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{duracao(c.horaInicio, c.horaFim)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {c.status === 'ativa'
                            ? <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>● Ativa</span>
                            : <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>Concluída</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}

        {/* If no professor selected, show all recent check-ins */}
        {!selectedId && (
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 10 }}>Todos os Check-ins Recentes</div>
            <Card>
              {todosCheckins.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13 }}>Nenhum check-in registado.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                      {['Professor','Turma','Data','Início','Fim','Duração','Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todosCheckins.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        onClick={() => setSelectedId(c.professorId)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.professorNome}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.turmaNome}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.data}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.horaInicio}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.horaFim || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{duracao(c.horaInicio, c.horaFim)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {c.status === 'ativa'
                            ? <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>● Ativa</span>
                            : <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>Concluída</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
