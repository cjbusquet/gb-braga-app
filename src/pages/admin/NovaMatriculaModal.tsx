/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePlanos, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';
import { Ico, XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '../../lib/icons';

const FAIXAS = [
  'branca',
  'cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta',
  'azul','roxa','marrom','preta',
];
const CATS = ['adulto','kids','familia','fundador'];

const RELACAO_LABELS: Record<string, string> = {
  pai: 'Pai', mae: 'Mãe', avo: 'Avó/Avô', tutor: 'Tutor Legal', outro: 'Responsável',
};
const RELACAO_OPTS = ['pai', 'mae', 'avo', 'tutor', 'outro'];

function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

export default function NovaMatriculaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { data: todosPlanos } = usePlanos();

  // Step 1 — plano
  const [cat, setCat]         = useState('adulto');
  const [planoId, setPlanoId] = useState('');

  // Step 2 — dados pessoais
  const [nome, setNome]       = useState('');
  const [email, setEmail]     = useState('');
  const [telefone, setTel]    = useState('');
  const [nif, setNif]         = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [faixa, setFaixa]     = useState('branca');
  const [grau, setGrau]       = useState('0');

  // Step 3 — responsável (só para menores)
  const [respNome, setRespNome]       = useState('');
  const [respEmail, setRespEmail]     = useState('');
  const [respTel, setRespTel]         = useState('');
  const [respNif, setRespNif]         = useState('');
  const [respRelacao, setRespRelacao] = useState('pai');
  const [respCheckin, setRespCheckin] = useState(true);
  const [respFatura, setRespFatura]   = useState(false);

  const [step, setStep]     = useState<1|2|3|4>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const planos   = todosPlanos.filter((p: any) => p.categoria === cat);
  const planoSel = todosPlanos.find((p: any) => p.id === planoId);
  const idade    = calcularIdade(dataNasc);
  const eMenor   = idade !== null && idade < 18;
  const totalSteps = eMenor ? 4 : 3;

  // Step 2 → 3: se menor vai para responsável, senão vai para confirmar
  const avancarDeStep2 = () => {
    if (!nome || !email || !dataNasc) return;
    setStep(eMenor ? 3 : 4);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const aluno = await db.criarAluno({
        nome, email, telefone, nif, dataNasc,
        faixa, grau: parseInt(grau) || 0,
        planoId, planoNome: planoSel?.nome,
      });

      // Se tem responsável preenchido, cria e vincula
      if (eMenor && respNome.trim() && aluno?.id) {
        const resp = await db.criarResponsavel({
          nome: respNome, email: respEmail, telefone: respTel, nif: respNif,
        });
        if (resp?.id) {
          await db.vincularResponsavel(aluno.id, resp.id, {
            tipoRelacao: respRelacao,
            podeCheckin: respCheckin,
            eTitularFinanceiro: respFatura,
          });
        }
      }

      setSaved(true);
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error('Erro ao criar aluno:', e);
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '9px 11px', color: 'var(--text-primary)', fontSize: 13,
    boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
  };
  const lbl: React.CSSProperties = {
    display: 'block', color: 'var(--text-muted)', fontSize: 10.5,
    fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4,
  };

  const stepLabel: Record<number, string> = {
    1: 'Selecionar Plano',
    2: 'Dados Pessoais',
    3: 'Responsável',
    4: 'Confirmar',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Nova Matrícula · Passo {step} de {totalSteps}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {stepLabel[step]}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico icon={XMarkIcon} /></button>
        </div>

        {/* Barra de progresso */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? GB.red : 'var(--border)', borderRadius: 2 }} />
          ))}
        </div>

        {/* ── STEP 1 — Plano ── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {CATS.map(c => (
                <button key={c} onClick={() => { setCat(c); setPlanoId(''); }}
                  style={{ background: cat === c ? GB.red : 'var(--bg-elevated)', border: `1px solid ${cat === c ? GB.red : 'var(--border)'}`, borderRadius: 6, padding: '5px 14px', color: cat === c ? '#fff' : 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {c}
                </button>
              ))}
            </div>
            {planos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>A carregar planos...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {planos.map((p: any) => (
                  <button key={p.id} onClick={() => setPlanoId(p.id)}
                    style={{ background: planoId === p.id ? 'rgba(200,16,46,0.05)' : 'var(--bg-elevated)', border: `2px solid ${planoId === p.id ? GB.red : 'var(--border)'}`, borderRadius: 10, padding: '12px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{p.descricao}</div>
                    </div>
                    <div style={{ color: planoId === p.id ? GB.red : 'var(--text-primary)', fontSize: 20, fontWeight: 800, flexShrink: 0, marginLeft: 16 }}>
                      €{p.valor}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/mês</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => planoId && setStep(2)} disabled={!planoId}
                style={{ background: planoId ? GB.red : '#ccc', border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: planoId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                Seguinte <Ico icon={ArrowRightIcon} sm />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Dados pessoais ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nome completo *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do aluno" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Telefone</label>
                <input value={telefone} onChange={e => setTel(e.target.value)} placeholder="+351 9XX XXX XXX" style={inp} />
              </div>
              <div>
                <label style={lbl}>NIF</label>
                <input value={nif} onChange={e => setNif(e.target.value)} placeholder="000000000" style={inp} />
              </div>
              <div>
                <label style={lbl}>Data de Nascimento *</label>
                <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} style={{ ...inp, borderColor: !dataNasc ? 'rgba(200,16,46,0.5)' : undefined }} />
                {idade !== null && (
                  <div style={{ marginTop: 4, fontSize: 11, color: eMenor ? '#D97706' : '#6B7280' }}>
                    {idade} anos
                    {eMenor
                      ? (idade >= 12 ? ' · Menor · check-in autónomo permitido' : ' · Menor · próximo passo: responsável')
                      : ' · Adulto'}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Faixa actual</label>
                <select value={faixa} onChange={e => setFaixa(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {FAIXAS.map(f => <option key={f} value={f}>{beltConfig[f]?.label || f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Grau</label>
                <select value={grau} onChange={e => setGrau(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 20px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico icon={ArrowLeftIcon} sm /> Voltar
              </button>
              <button onClick={avancarDeStep2} disabled={!nome || !email || !dataNasc}
                style={{ background: nome && email && dataNasc ? GB.red : '#ccc', border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: nome && email && dataNasc ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                {eMenor ? 'Seguinte — Responsável' : 'Seguinte'} <Ico icon={ArrowRightIcon} sm />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Responsável (só menores) ── */}
        {step === 3 && eMenor && (
          <div>
            {/* Info do menor */}
            <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                {nome} · {idade} anos · Menor de Idade
              </div>
              <div style={{ fontSize: 11.5, color: '#92400E', marginTop: 3 }}>
                {idade! >= 12
                  ? 'Pode fazer check-in de forma autónoma. Responsável é opcional mas recomendado.'
                  : 'Tem menos de 12 anos — é necessário um responsável para fazer check-in.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nome do responsável {idade! < 12 ? '*' : ''}</label>
                <input value={respNome} onChange={e => setRespNome(e.target.value)} placeholder="Nome completo" style={inp} />
              </div>
              <div>
                <label style={lbl}>Telefone</label>
                <input value={respTel} onChange={e => setRespTel(e.target.value)} placeholder="+351 9XX XXX XXX" style={inp} />
              </div>
              <div>
                <label style={lbl}>NIF do responsável</label>
                <input value={respNif} onChange={e => setRespNif(e.target.value)} placeholder="000000000" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={respEmail} onChange={e => setRespEmail(e.target.value)} placeholder="email@exemplo.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Relação</label>
                <select value={respRelacao} onChange={e => setRespRelacao(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {RELACAO_OPTS.map(r => <option key={r} value={r}>{RELACAO_LABELS[r]}</option>)}
                </select>
              </div>
            </div>

            {/* Permissões */}
            <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={respCheckin} onChange={e => setRespCheckin(e.target.checked)} />
                Pode fazer check-in
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={respFatura} onChange={e => setRespFatura(e.target.checked)} />
                Titular da fatura
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 20px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico icon={ArrowLeftIcon} sm /> Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={idade! < 12 && !respNome.trim()}
                style={{ background: (idade! < 12 && !respNome.trim()) ? '#ccc' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (idade! < 12 && !respNome.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Seguinte <Ico icon={ArrowRightIcon} sm />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 (ou 3 se adulto) — Confirmar ── */}
        {step === 4 && (
          <div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
              {[
                ['Nome',        nome],
                ['Email',       email],
                ['Telefone',    telefone || '—'],
                ['NIF',         nif || '—'],
                ['Nascimento',  dataNasc ? `${dataNasc}${idade !== null ? ` (${idade} anos)` : ''}` : '—'],
                ['Faixa',       `${faixa.charAt(0).toUpperCase() + faixa.slice(1)} · Grau ${grau}`],
                ['Plano',       planoSel?.nome || '—'],
                ['Mensalidade', `€${planoSel?.valor || 0}/mês`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {eMenor && respNome && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(217,119,6,0.07)', borderRadius: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Responsável</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>{respNome} · {RELACAO_LABELS[respRelacao]}</div>
                  {respTel && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{respTel}</div>}
                </div>
              )}
            </div>

            {saved && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                ✓ Aluno criado com sucesso!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(eMenor ? 3 : 2)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 20px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico icon={ArrowLeftIcon} sm /> Voltar
              </button>
              <button onClick={handleSave} disabled={saving || saved}
                style={{ background: saved ? '#22C55E' : saving ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px 28px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving || saved ? 'not-allowed' : 'pointer', boxShadow: saved || saving ? 'none' : 'var(--shadow-red)' }}>
                {saved ? '✓ Criado!' : saving ? 'A guardar...' : '✓ Confirmar Matrícula'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
