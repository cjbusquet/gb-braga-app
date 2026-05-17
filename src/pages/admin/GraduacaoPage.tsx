// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAlunos, useGraduacoes, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';

const FAIXAS = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];

function proxFaixaGrau(faixa: string, grau: number): { faixa: string; grau: number } {
  if (grau < 4) return { faixa, grau: grau + 1 };
  const idx = FAIXAS.indexOf(faixa);
  if (idx < FAIXAS.length - 1) return { faixa: FAIXAS[idx + 1], grau: 0 };
  return { faixa, grau };
}

function BeltBadge({ faixa, grau }: { faixa: string; grau: number }) {
  const cfg = beltConfig[faixa] || { bg: '#888', text: '#fff' };
  return (
    <span style={{ background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {faixa.charAt(0).toUpperCase() + faixa.slice(1)} {grau > 0 ? `· G${grau}` : ''}
    </span>
  );
}

type Tab = 'candidatos' | 'registar' | 'historico';

export default function GraduacaoPage() {
  const { data: alunos }      = useAlunos();
  const { data: graduacoesDB } = useGraduacoes();
  const [tab, setTab]          = useState<Tab>('candidatos');
  const [graduacoes, setGraduacoes] = useState<any[]>([]);
  const [alunoSel, setAlunoSel]     = useState('');
  const [novaFaixa, setNovaFaixa]   = useState('branca');
  const [novoGrau, setNovoGrau]     = useState(0);
  const [obs, setObs]               = useState('');
  const [notificar, setNotificar]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    if (graduacoesDB?.length) setGraduacoes(graduacoesDB);
  }, [graduacoesDB]);

  // When aluno changes, pre-fill next belt
  useEffect(() => {
    if (!alunoSel) return;
    const aluno = alunos.find((a: any) => a.id === alunoSel);
    if (aluno) {
      const prox = proxFaixaGrau(aluno.faixa || 'branca', aluno.grau || 0);
      setNovaFaixa(prox.faixa);
      setNovoGrau(prox.grau);
    }
  }, [alunoSel, alunos]);

  const candidatos = alunos.filter((a: any) => (a.frequencia || 0) >= 70);

  const handleRegistar = async () => {
    if (!alunoSel) return;
    const aluno = alunos.find((a: any) => a.id === alunoSel);
    if (!aluno) return;
    setSaving(true);
    try {
      const nova = {
        id: `g${Date.now()}`,
        alunoId: alunoSel, alunoNome: aluno.nome,
        faixaAnterior: aluno.faixa || 'branca', grauAnterior: aluno.grau || 0,
        faixaNova: novaFaixa, grauNovo: novoGrau,
        data: new Date().toISOString().split('T')[0],
        professorNome: 'Professor', observacao: obs,
      };
      setGraduacoes(p => [nova, ...p]);
      await db.registarGraduacao({
        alunoId: alunoSel, alunoNome: aluno.nome,
        faixaAnterior: aluno.faixa || 'branca', grauAnterior: aluno.grau || 0,
        faixaNova: novaFaixa, grauNovo: novoGrau,
        professorNome: 'Professor', observacao: obs,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setAlunoSel(''); setObs(''); setTab('historico'); }, 2000);
    } catch (e) {
      console.error('Erro ao registar graduação:', e);
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 11px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Academia</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Graduação</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {([['candidatos','Candidatos'],['registar','Registar'],['historico','Histórico']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? GB.red : 'transparent'}`, padding: '8px 16px', color: tab === id ? GB.red : 'var(--text-muted)', fontSize: 13, fontWeight: tab === id ? 700 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* CANDIDATOS */}
      {tab === 'candidatos' && (
        <div>
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <div style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>{candidatos.length} alunos elegíveis</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Frequência ≥ 70%</div>
              </div>
            </div>
            <button onClick={() => alert(`WhatsApp enviado para ${candidatos.length} alunos!`)}
              style={{ background: '#25D366', border: 'none', borderRadius: 7, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              💬 Notificar todos
            </button>
          </div>

          {candidatos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥋</div>
              <div>Nenhum candidato com frequência ≥ 70%</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Adiciona presenças para os alunos aparecerem aqui</div>
            </div>
          ) : candidatos.map((aluno: any) => {
            const prox = proxFaixaGrau(aluno.faixa || 'branca', aluno.grau || 0);
            return (
              <div key={aluno.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {aluno.nome.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{aluno.nome}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <BeltBadge faixa={aluno.faixa || 'branca'} grau={aluno.grau || 0} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
                    <BeltBadge faixa={prox.faixa} grau={prox.grau} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>Freq: {aluno.frequencia || 0}%</span>
                  </div>
                </div>
                <button onClick={() => { setAlunoSel(aluno.id); setNovaFaixa(prox.faixa); setNovoGrau(prox.grau); setTab('registar'); }}
                  style={{ background: GB.red, border: 'none', borderRadius: 7, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-red)', flexShrink: 0 }}>
                  🎖️ Registar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTAR */}
      {tab === 'registar' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Aluno *</label>
              <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)} style={inp}>
                <option value="">— Seleccionar aluno —</option>
                {alunos.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nome} · {a.faixa} G{a.grau}</option>
                ))}
              </select>
              {alunos.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Nenhum aluno encontrado. Adiciona alunos primeiro.</div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Nova Faixa</label>
                <select value={novaFaixa} onChange={e => setNovaFaixa(e.target.value)} style={inp}>
                  {FAIXAS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Novo Grau</label>
                <select value={novoGrau} onChange={e => setNovoGrau(parseInt(e.target.value))} style={inp}>
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Observações</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Notas sobre a graduação..."
                style={{ ...inp, resize: 'none' }}/>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={notificar} onChange={() => setNotificar(n => !n)} style={{ accentColor: '#25D366', width: 15, height: 15 }}/>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>💬 Notificar aluno via WhatsApp</span>
            </label>

            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                ✓ Graduação registada! OSS! 🥋
              </div>
            )}

            <button onClick={handleRegistar} disabled={!alunoSel || saving || success}
              style={{ width: '100%', background: success ? '#22C55E' : !alunoSel || saving ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: !alunoSel || saving ? 'not-allowed' : 'pointer', boxShadow: success || !alunoSel ? 'none' : 'var(--shadow-red)' }}>
              {success ? '✓ Graduação registada!' : saving ? 'A guardar...' : '🎖️ Confirmar Graduação — OSS!'}
            </button>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {tab === 'historico' && (
        <div>
          {graduacoes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎖️</div>
              <div>Sem graduações registadas</div>
            </div>
          ) : graduacoes.map((g: any) => (
            <div key={g.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{g.alunoNome || g.aluno_nome}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <BeltBadge faixa={g.faixaAnterior || g.faixa_anterior || 'branca'} grau={g.grauAnterior || g.grau_anterior || 0} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
                  <BeltBadge faixa={g.faixaNova || g.faixa_nova || 'branca'} grau={g.grauNovo || g.grau_novo || 0} />
                </div>
              </div>
              <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>
                {g.data}<br/>{g.professorNome || g.professor_nome || '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
