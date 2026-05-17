// @ts-nocheck
import { useState } from 'react';
import { usePlanos, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';

const FAIXAS = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];
const CATS   = ['adulto','kids','familia','fundador'];

export default function NovaMatriculaModal({ onClose }: { onClose: () => void }) {
  const { data: todosPlanos } = usePlanos();
  const [step, setStep]       = useState<1|2|3|4|5>(1);
  const [cat, setCat]         = useState('adulto');
  const [planoId, setPlanoId] = useState('');
  const [nome, setNome]       = useState('');
  const [email, setEmail]     = useState('');
  const [telefone, setTel]    = useState('');
  const [nif, setNif]         = useState('');
  const [faixa, setFaixa]     = useState('branca');
  const [grau, setGrau]       = useState('0');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const planos = todosPlanos.filter((p: any) => p.categoria === cat);
  const planoSel = todosPlanos.find((p: any) => p.id === planoId);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.criarAluno({
        nome, email, telefone, nif,
        faixa, grau: parseInt(grau) || 0,
        planoId, planoNome: planoSel?.nome,
      });
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error('Erro ao criar aluno:', e);
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:520, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase' }}>Nova Matrícula · Passo {step} de 3</div>
            <div style={{ color:'var(--text-primary)', fontSize:15, fontWeight:700, marginTop:2 }}>
              {step===1 && 'Selecionar Plano'}
              {step===2 && 'Dados Pessoais'}
              {step===3 && 'Confirmar'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        </div>

        {/* Step bar */}
        <div style={{ display:'flex', gap:6, marginBottom:24 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex:1, height:3, background: s<=step ? GB.red : 'var(--border)', borderRadius:2 }}/>
          ))}
        </div>

        {/* STEP 1 — Plano */}
        {step === 1 && (
          <div>
            {/* Category tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              {CATS.map(c => (
                <button key={c} onClick={() => { setCat(c); setPlanoId(''); }}
                  style={{ background: cat===c ? GB.red : 'var(--bg-elevated)', border:`1px solid ${cat===c ? GB.red : 'var(--border)'}`, borderRadius:6, padding:'5px 14px', color: cat===c ? '#fff' : 'var(--text-secondary)', fontSize:12.5, cursor:'pointer', textTransform:'capitalize' }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Plans list */}
            {planos.length === 0 ? (
              <div style={{ textAlign:'center', color:'var(--text-muted)', padding:20 }}>
                A carregar planos...
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {planos.map((p: any) => (
                  <button key={p.id} onClick={() => setPlanoId(p.id)}
                    style={{ background: planoId===p.id ? 'rgba(200,16,46,0.05)' : 'var(--bg-elevated)', border:`2px solid ${planoId===p.id ? GB.red : 'var(--border)'}`, borderRadius:10, padding:'12px 16px', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600 }}>{p.nome}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>{p.descricao}</div>
                    </div>
                    <div style={{ color: planoId===p.id ? GB.red : 'var(--text-primary)', fontSize:20, fontWeight:800, flexShrink:0, marginLeft:16 }}>
                      €{p.valor}<span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>/mês</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => planoId && setStep(2)} disabled={!planoId}
                style={{ background: planoId ? GB.red : '#ccc', border:'none', borderRadius:'var(--radius-sm)', padding:'11px 24px', color:'#fff', fontSize:13, fontWeight:700, cursor: planoId ? 'pointer' : 'not-allowed' }}>
                Seguinte →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Dados pessoais */}
        {step === 2 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Nome completo *</label>
                <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome do aluno" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Telefone</label>
                <input value={telefone} onChange={e=>setTel(e.target.value)} placeholder="+351 9XX XXX XXX" style={inp}/>
              </div>
              <div>
                <label style={lbl}>NIF</label>
                <input value={nif} onChange={e=>setNif(e.target.value)} placeholder="000000000" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Faixa actual</label>
                <select value={faixa} onChange={e=>setFaixa(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                  {FAIXAS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Grau</label>
                <select value={grau} onChange={e=>setGrau(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:20 }}>
              <button onClick={() => setStep(1)} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px 20px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
                ← Voltar
              </button>
              <button onClick={() => nome && email && setStep(3)} disabled={!nome || !email}
                style={{ background: nome&&email ? GB.red : '#ccc', border:'none', borderRadius:'var(--radius-sm)', padding:'11px 24px', color:'#fff', fontSize:13, fontWeight:700, cursor: nome&&email ? 'pointer' : 'not-allowed' }}>
                Seguinte →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirmar */}
        {step === 3 && (
          <div>
            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', padding:16, marginBottom:20 }}>
              {[
                ['Nome', nome],
                ['Email', email],
                ['Telefone', telefone || '—'],
                ['NIF', nif || '—'],
                ['Faixa', `${faixa.charAt(0).toUpperCase()+faixa.slice(1)} · Grau ${grau}`],
                ['Plano', planoSel?.nome || '—'],
                ['Mensalidade', `€${planoSel?.valor || 0}/mês`],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ color:'var(--text-muted)', fontSize:12.5 }}>{k}</span>
                  <span style={{ color:'var(--text-primary)', fontSize:12.5, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>

            {saved && (
              <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, padding:'10px 16px', marginBottom:16, color:'#16A34A', fontSize:13, fontWeight:600 }}>
                ✓ Aluno criado com sucesso!
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button onClick={() => setStep(2)} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px 20px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
                ← Voltar
              </button>
              <button onClick={handleSave} disabled={saving || saved}
                style={{ background: saved ? '#22C55E' : saving ? '#aaa' : GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'11px 28px', color:'#fff', fontSize:13, fontWeight:700, cursor: saving||saved ? 'not-allowed' : 'pointer', boxShadow: saved||saving ? 'none' : 'var(--shadow-red)' }}>
                {saved ? '✓ Criado!' : saving ? 'A guardar...' : '✓ Confirmar Matrícula'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
