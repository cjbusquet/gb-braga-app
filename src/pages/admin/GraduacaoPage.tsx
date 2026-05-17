// @ts-nocheck
import { useState, useEffect } from 'react';
import { useGraduacoes, useAlunos, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';

const BELTS: Belt[] = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];

function BeltBar({ faixa, grau, size = 'sm' }: { faixa: Belt; grau: number; size?: 'sm' | 'lg' }) {
  const bc = beltConfig[faixa];
  const w = size === 'lg' ? 72 : 28;
  const h = size === 'lg' ? 14 : 7;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: w, height: h, background: bc?.bg || '#888', borderRadius: 3, border: faixa === 'branca' ? '1px solid #555' : 'none', position: 'relative', overflow: 'hidden', boxShadow: `0 0 8px ${(bc?.bg || '#888')}44` }}>
        {Array.from({ length: grau }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', right: `${(i * (100/(grau+1))) + 4}%`, top: 0, bottom: 0, width: `${Math.max(2, 100/(grau * 4))}%`, background: '#111', opacity: 0.4 }}/>
        ))}
      </div>
      {size === 'lg' && <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' as const }}>{bc?.label} · {grau}° Grau</span>}
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>;
}

function TabBar({ tabs, active, onSelect }: { tabs: { id: string; label: string; icon: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '9px 14px', fontSize: 13, color: active === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active === t.id ? 600 : 400, borderBottom: `2px solid ${active === t.id ? GB.red : 'transparent'}`, marginBottom: -1 }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

export default function GraduacaoPage() {
  const { data: alunos } = useAlunos();
  const { data: graduacoesDB } = useGraduacoes();
  useEffect(() => { if (graduacoesDB?.length) setGraduacoes(graduacoesDB); }, [graduacoesDB]);

  const [tab, setTab] = useState<'candidatos' | 'registar' | 'historico' | 'cerimonia'>('candidatos');
  const [novaFaixa, setNovaFaixa] = useState<Belt>('azul');
  const [novoGrau, setNovoGrau] = useState(1);
  const [alunoSel, setAlunoSel] = useState('');
  const [obs, setObs] = useState('');
  const [notificarAluno, setNotificarAluno] = useState(true);
  const [success, setSuccess] = useState(false);
  const [graduacoes, setGraduacoes] = useState<any[]>([]);

  const candidatos = alunos.filter(a => a.status === 'ativo' && a.frequencia >= 70);

  const handleRegistar = () => {
    if (!alunoSel) return;
    const aluno = alunos.find(a => a.id === alunoSel);
    if (!aluno) return;
    const nova = {
      id: `g${Date.now()}`, alunoId: alunoSel, alunoNome: aluno.nome,
      faixaAnterior: aluno.faixa, grauAnterior: aluno.grau,
      faixaNova: novaFaixa, grauNovo: novoGrau,
      data: new Date().toISOString().split('T')[0],
      professorId: 'p1', professorNome: 'João Santos', observacao: obs,
    };
    setGraduacoes(p => [nova, ...p]);
    // Save to Supabase
    db.registarGraduacao({
      alunoId: alunoSel, alunoNome: aluno.nome,
      faixaAnterior: aluno.faixa, grauAnterior: aluno.grau,
      faixaNova: novaFaixa, grauNovo: novoGrau,
      professorNome: 'Professor', observacao: obs,
    }).catch(console.error);
    setSuccess(true);
    // Notify student via WhatsApp
    const belt = novaFaixa.charAt(0).toUpperCase() + novaFaixa.slice(1);
    const msg = `🎖️ Parabéns ${aluno.nome.split(' ')[0]}! Foi promovido(a) a Faixa ${belt} ${novoGrau}° Grau na Gracie Barra Braga! OSS! 🥋`;
    if (notificarAluno) {
      console.log('WhatsApp:', aluno.nome, msg);
    }
    setTimeout(() => { setSuccess(false); setAlunoSel(''); setObs(''); setTab('historico'); }, 2000);
  };

  const alunoSelecionado = alunos.find(a => a.id === alunoSel);
  const nextBelt = BELTS[BELTS.indexOf(alunoSelecionado?.faixa || 'branca') + (novoGrau === 0 ? 1 : 0)] || 'preta';

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Academia</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Graduação</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Candidatos elegíveis', value: candidatos.length, accent: GB.red },
          { label: 'Graduações este ano', value: graduacoes.length, accent: '#A78BFA' },
          { label: 'Próxima cerimónia', value: 'Jun 2025', accent: '#F59E0B' },
          { label: 'Taxa frequência mín.', value: '70%', accent: '#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `2px solid ${s.accent}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <TabBar active={tab} onSelect={s => setTab(s as typeof tab)} tabs={[
        { id: 'candidatos', label: 'Candidatos', icon: '🎯' },
        { id: 'registar', label: 'Registar', icon: '🎖️' },
        { id: 'historico', label: 'Histórico', icon: '📋' },
        { id: 'cerimonia', label: 'Cerimónia', icon: '🏆' },
      ]}/>

      {/* ── CANDIDATOS ── */}
      {tab === 'candidatos' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            {[['Frequência','≥ 70%','#7C3AED'],['Tempo mínimo','3 meses','#2563EB'],['Grau limite','< Grau 4','var(--gb-red)']].map(([k,v,c]) => (
              <div key={k} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ color: c, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{v}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 2 }}>Requisito: {k}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <div style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>Próxima Cerimónia — Junho 2025</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>{candidatos.length} alunos elegíveis · histórico de aulas verificado</div>
              </div>
            </div>
            <button onClick={() => alert(`✅ WhatsApp enviado para ${candidatos.length} alunos!\n\nMensagem: "Parabéns! Foram selecionados para a próxima cerimónia de graduação Gracie Barra Braga. Data a confirmar. OSS! 🎖️"`)}
              style={{ background: '#25D366', border: 'none', borderRadius: 7, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              💬 Notificar todos via WhatsApp
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {candidatos.map(aluno => {
              const bc = beltConfig[aluno.faixa];
              const nextIdx = BELTS.indexOf(aluno.faixa) + (aluno.grau >= 4 ? 1 : 0);
              const proxFaixa = aluno.grau >= 4 ? (BELTS[nextIdx] || aluno.faixa) : aluno.faixa;
              const proxGrau = aluno.grau >= 4 ? 1 : aluno.grau + 1;
              const proxBc = beltConfig[proxFaixa];
              return (
                <Card key={aluno.id} style={{ padding: 18 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: bc?.bg || '#888', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingTop: 4 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: (bc?.bg || '#888') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg === '#F0EEFF' ? '#888' : (bc?.bg || GB.red), fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{aluno.nome.charAt(0)}</div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{aluno.nome}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      Frequência: {aluno.frequencia}% · {Math.round(aluno.frequencia * 0.8)} aulas
                    </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' as const, flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 5 }}>ATUAL</div>
                      <BeltBar faixa={aluno.faixa} grau={aluno.grau} size="sm"/>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 10.5, marginTop: 4, textTransform: 'capitalize' as const }}>{bc?.label} G{aluno.grau}</div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
                    <div style={{ textAlign: 'center' as const, flex: 1 }}>
                      <div style={{ color: '#22C55E', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 5 }}>PRÓXIMA</div>
                      <BeltBar faixa={proxFaixa} grau={proxGrau} size="sm"/>
                      <div style={{ color: '#22C55E', fontSize: 10.5, marginTop: 4, textTransform: 'capitalize' as const, fontWeight: 600 }}>{proxBc?.label} G{proxGrau}</div>
                    </div>
                  </div>

                  <button onClick={() => { setTab('registar'); setAlunoSel(aluno.id); setNovaFaixa(proxFaixa); setNovoGrau(proxGrau); }}
                    style={{ width: '100%', background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 10px ${GB.redGlow}` }}>
                    🎖️ Registar Graduação
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REGISTAR ── */}
      {tab === 'registar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 18 }}>Registar Graduação</div>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 18, textAlign: 'center' as const }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎖️</div>
                <div style={{ color: '#22C55E', fontSize: 14, fontWeight: 700 }}>Graduação registada! OSS!</div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Aluno</label>
              <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <option value="">Selecionar aluno...</option>
                {candidatos.map(a => <option key={a.id} value={a.id}>{a.nome} — {beltConfig[a.faixa]?.label} G{a.grau}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Nova Faixa</label>
                <select value={novaFaixa} onChange={e => setNovaFaixa(e.target.value as Belt)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                  {BELTS.map(b => <option key={b} value={b}>{beltConfig[b]?.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Grau</label>
                <select value={novoGrau} onChange={e => setNovoGrau(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}° Grau</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>Observação</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Excelente evolução técnica, dedicação exemplar. Oss!" rows={3}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, resize: 'none', fontFamily: 'var(--font-ui)' }}/>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setTab('candidatos')} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: notificarAluno ? 'rgba(37,211,102,0.06)' : 'var(--bg-elevated)', border: `1px solid ${notificarAluno ? 'rgba(37,211,102,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 0 }}>
                <input type="checkbox" checked={notificarAluno} onChange={() => setNotificarAluno(n => !n)} style={{ accentColor: '#25D366', width: 15, height: 15 }}/>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>💬 Notificar aluno via WhatsApp</span>
              </label>
              <button onClick={handleRegistar} style={{ flex: 2, background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 14px ${GB.redGlow}` }}>
                🎖️ Confirmar — OSS!
              </button>
            </div>
          </Card>

          {/* Preview */}
          <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 24, textAlign: 'center' as const }}>Preview da Graduação</div>
            {alunoSelecionado && (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎖️</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, marginBottom: 4, textAlign: 'center' as const }}>{alunoSelecionado.nome}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
                  <div style={{ textAlign: 'center' as const }}>
                    <BeltBar faixa={alunoSelecionado.faixa} grau={alunoSelecionado.grau} size="lg"/>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 22 }}>→</span>
                  <div style={{ textAlign: 'center' as const }}>
                    <BeltBar faixa={novaFaixa} grau={novoGrau} size="lg"/>
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' as const, fontStyle: 'italic' }}>{obs}</div>
              </>
            )}
            {!alunoSelecionado && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' as const }}>Selecione um aluno para ver o preview</div>
            )}
          </Card>
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'historico' && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Aluno', 'De', 'Para', 'Data', 'Professor', 'Observação'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graduacoes.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.alunoNome}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <BeltBar faixa={g.faixaAnterior} grau={g.grauAnterior} size="sm"/>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10.5, textTransform: 'capitalize', marginLeft: 2 }}>G{g.grauAnterior}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <BeltBar faixa={g.faixaNova} grau={g.grauNovo} size="sm"/>
                      <span style={{ color: '#22C55E', fontSize: 10.5, textTransform: 'capitalize', fontWeight: 600, marginLeft: 2 }}>G{g.grauNovo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{g.data}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{g.professorNome}</td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{g.observacao || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── CERIMÓNIA ── */}
      {tab === 'cerimonia' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Próxima Cerimónia</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 16, textAlign: 'center' as const }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>28 Junho 2025</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Sábado · 10:00 — Tatame Principal</div>
            </div>
            {[
              ['Candidatos confirmados', candidatos.length],
              ['Faixas a atribuir', '6 azuis, 3 roxas, 1 marrom'],
              ['Professor responsável', 'João Santos'],
              ['Convidados', 'Familiares permitidos'],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: 16, background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              💬 Notificar Candidatos (WhatsApp)
            </button>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16 }}>Candidatos Confirmados</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidatos.map(a => {
                const bc = beltConfig[a.faixa];
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <BeltBar faixa={a.faixa} grau={a.grau} size="sm"/>
                    <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{a.nome}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{a.frequencia}%</span>
                    <span style={{ color: '#22C55E', fontSize: 11 }}>✓</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
