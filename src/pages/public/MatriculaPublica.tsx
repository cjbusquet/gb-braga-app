// @ts-nocheck
import { useState } from 'react';
import { GBLogoFull } from '../../components/GBLogo';
import { usePlanos } from '../../lib/useData';

type Step = 'intro' | 'categoria' | 'plano' | 'dados' | 'sucesso';

const BENEFITS = [
  { icon: '🥋', text: 'Metodologia Gracie Barra — certificada em todo o mundo' },
  { icon: '👨‍🏫', text: 'Professores certificados com faixa preta' },
  { icon: '📅', text: 'Seg–Sex: 07h–22h · Sáb: 09h30–12h30' },
  { icon: '👨‍👩‍👧', text: 'Programa Kids disponível' },
  { icon: '💪', text: 'Gi, No-Gi, Wrestling e Kids' },
  { icon: '🏆', text: 'Competições regionais e nacionais' },
];

const CATEGORIAS = [
  { id: 'adulto',   icon: '🥋', label: 'Adulto',          desc: 'A partir de 14 anos',                  color: '#C8102E' },
  { id: 'kids',     icon: '⭐', label: 'Kids',             desc: 'Crianças até 13 anos',                 color: '#D97706' },
  { id: 'familia',  icon: '👨‍👩‍👧', label: 'Família',          desc: '2, 3 ou 4 membros da família',         color: '#2563EB' },
  { id: 'fundador', icon: '🏆', label: 'Sócio Fundador',  desc: 'Preço especial para membros fundadores',color: '#7C3AED' },
];

const TESTIMONIALS = [
  { nome: 'Marco S.', faixa: 'Faixa Azul', texto: 'O melhor investimento para a minha saúde e disciplina. A equipa é fantástica!' },
  { nome: 'Ana F.', faixa: 'Faixa Branca', texto: 'Comecei sem experiência e sinto-me completamente integrada. Ambiente familiar.' },
  { nome: 'Paulo M.', faixa: 'Pai de aluno Kids', texto: 'O meu filho adorou desde a primeira aula. Recomendo a todas as famílias!' },
];

function StepBar({ step }: { step: Step }) {
  const steps: Step[] = ['categoria', 'plano', 'dados'];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: i <= idx ? 22 : 7, height: 7, borderRadius: 99, background: i <= idx ? '#C8102E' : '#E2E0DB', transition: 'all 0.25s' }}/>
        </div>
      ))}
    </div>
  );
}

const INP: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E2E0DB', borderRadius: 8,
  padding: '11px 14px', fontSize: 15, fontFamily: 'inherit',
  outline: 'none', background: '#fff', color: '#111', transition: 'border-color 0.15s',
};

export default function MatriculaPublica() {
  const { data: planos } = usePlanos();
  const [step, setStep] = useState<Step>('intro');
  const [categoria, setCategoria] = useState('');
  const [planoId, setPlanoId] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [nasc, setNasc] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const planosFiltrados = planos.filter(p => p.ativo && (p as any).categoria === categoria);
  const planoSel = planos.find(p => p.id === planoId);
  const catSel = CATEGORIAS.find(c => c.id === categoria);

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setStep('sucesso');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F4', fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E2E0DB', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <a href="https://gbbraga.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <GBLogoFull size={48}/>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="tel:+351927773854" style={{ padding: '8px 14px', background: '#F0EFEC', border: '1px solid #E2E0DB', borderRadius: 8, color: '#5C5B66', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>📞 +351 927 773 854</a>
          <a href="https://wa.me/351927773854" style={{ padding: '8px 14px', background: '#25D366', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, textDecoration: 'none', fontWeight: 700 }}>💬 WhatsApp</a>
        </div>
      </header>

      {/* INTRO */}
      {step === 'intro' && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #0D0508 0%, #1A0208 60%, #2A0510 100%)', padding: '72px 24px 80px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'rgba(200,16,46,0.18)', border: '1px solid rgba(200,16,46,0.35)', borderRadius: 99, padding: '5px 18px', marginBottom: 22 }}>
              <span style={{ color: '#FF7A95', fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const }}>🏆 Gracie Barra Braga · gbbraga.com</span>
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(30px,5vw,58px)', fontWeight: 900, fontFamily: "'Arial Black',sans-serif", lineHeight: 1.05, marginBottom: 18 }}>
              Começa a tua jornada<br/>no Brazilian Jiu-Jitsu
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Junta-te à família Gracie Barra em Braga. Para todos os níveis e idades.<br/>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Primeira aula completamente gratuita.</strong>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={() => setStep('categoria')} style={{ background: '#C8102E', border: 'none', borderRadius: 10, padding: '15px 36px', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: "'Arial Black',sans-serif", cursor: 'pointer', boxShadow: '0 4px 20px rgba(200,16,46,0.45)' }}>
                INSCREVER AGORA
              </button>
              <a href="https://gbbraga.com/formulario-aula-teste-gratuita/" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '15px 24px', color: '#fff', fontSize: 15, textDecoration: 'none' }}>
                Aula gratuita →
              </a>
            </div>
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' as const }}>
              {[['200+','Alunos'],['Seg–Sáb','Horários'],['5★','Google']].map(([v,l]) => (
                <div key={l} style={{ textAlign: 'center' as const }}>
                  <div style={{ color: '#C8102E', fontSize: 30, fontWeight: 900, fontFamily: "'Arial Black',sans-serif" }}>{v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Belt stripe */}
          <div style={{ height: 5, display: 'flex' }}>
            {['#E8E7FF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'].map(c => <div key={c} style={{ flex: 1, background: c }}/>)}
          </div>

          {/* Planos preview */}
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px 48px' }}>
            <h2 style={{ textAlign: 'center' as const, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, fontFamily: "'Arial Black',sans-serif", marginBottom: 12, textTransform: 'uppercase' as const }}>Planos e Preços</h2>
            <p style={{ textAlign: 'center' as const, color: '#5C5B66', marginBottom: 36, fontSize: 15 }}>Mensalidade debitada automaticamente. Cancele a qualquer momento.</p>

            {/* Categoria cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 40 }}>
              {CATEGORIAS.map(cat => {
                const planos = planos.filter(p => p.ativo && (p as any).categoria === cat.id);
                const minPrice = planos.length ? Math.min(...planos.map(p => p.valor)) : 0;
                return (
                  <div key={cat.id} onClick={() => { setCategoria(cat.id); setStep('plano'); }}
                    style={{ background: '#fff', border: '1px solid #E2E0DB', borderRadius: 14, padding: '22px 18px', cursor: 'pointer', textAlign: 'center' as const, transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 4px 14px ${cat.color}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E0DB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.icon}</div>
                    <div style={{ color: '#111', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{cat.label}</div>
                    <div style={{ color: '#9896A4', fontSize: 12, marginBottom: 12 }}>{cat.desc}</div>
                    {minPrice > 0 && (
                      <div style={{ color: cat.color, fontSize: 22, fontWeight: 900, fontFamily: "'Arial Black',sans-serif" }}>
                        desde €{minPrice}<span style={{ fontSize: 12, fontWeight: 400, color: '#9896A4' }}>/mês</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Benefits */}
            <h2 style={{ textAlign: 'center' as const, fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, fontFamily: "'Arial Black',sans-serif", marginBottom: 28, textTransform: 'uppercase' as const }}>Porquê a GB Braga?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
              {BENEFITS.map(b => (
                <div key={b.text} style={{ background: '#fff', border: '1px solid #E2E0DB', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
                  <span style={{ color: '#333', fontSize: 13.5, lineHeight: 1.5 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ background: '#fff', borderTop: '1px solid #E2E0DB', padding: '52px 24px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center' as const, fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", marginBottom: 30, textTransform: 'uppercase' as const }}>O que dizem os nossos alunos</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
                {TESTIMONIALS.map(t => (
                  <div key={t.nome} style={{ background: '#F7F6F4', border: '1px solid #E2E0DB', borderRadius: 12, padding: 20 }}>
                    <p style={{ color: '#333', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>"{t.texto}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{t.nome.charAt(0)}</div>
                      <div>
                        <div style={{ color: '#111', fontSize: 13, fontWeight: 600 }}>{t.nome}</div>
                        <div style={{ color: '#9896A4', fontSize: 11 }}>{t.faixa}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: '#C8102E', padding: '52px 24px', textAlign: 'center' as const }}>
            <h2 style={{ color: '#fff', fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", marginBottom: 14, textTransform: 'uppercase' as const }}>Pronto para começar?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 24 }}>Primeira aula gratuita · Sem compromisso</p>
            <button onClick={() => setStep('categoria')} style={{ background: '#fff', border: 'none', borderRadius: 10, padding: '14px 36px', color: '#C8102E', fontSize: 17, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", cursor: 'pointer' }}>INSCREVER AGORA →</button>
          </div>
        </>
      )}

      {/* CATEGORIA */}
      {step === 'categoria' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <StepBar step={step}/>
          <h2 style={{ textAlign: 'center' as const, fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase' as const, marginBottom: 6 }}>Quem se vai inscrever?</h2>
          <p style={{ textAlign: 'center' as const, color: '#9896A4', fontSize: 14, marginBottom: 30 }}>Escolhe a categoria para ver os planos disponíveis</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {CATEGORIAS.map(cat => {
              const planos = planos.filter(p => p.ativo && (p as any).categoria === cat.id);
              const minPrice = Math.min(...planos.map(p => p.valor));
              return (
                <button key={cat.id} onClick={() => { setCategoria(cat.id); setStep('plano'); }}
                  style={{ background: '#fff', border: '2px solid #E2E0DB', borderRadius: 14, padding: '24px 20px', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${cat.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E0DB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ fontSize: 38, marginBottom: 10 }}>{cat.icon}</div>
                  <div style={{ color: '#111', fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{cat.label}</div>
                  <div style={{ color: '#9896A4', fontSize: 12, marginBottom: 12 }}>{cat.desc}</div>
                  <div style={{ color: cat.color, fontSize: 20, fontWeight: 900, fontFamily: "'Arial Black',sans-serif" }}>
                    desde €{minPrice}<span style={{ fontSize: 11, fontWeight: 400, color: '#9896A4' }}>/mês</span>
                  </div>
                  <div style={{ color: planos.length > 1 ? '#9896A4' : 'transparent', fontSize: 11, marginTop: 4 }}>
                    {planos.length} opção{planos.length !== 1 ? 'ões' : ''}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep('intro')} style={{ width: '100%', background: '#F0EFEC', border: '1px solid #E2E0DB', borderRadius: 8, padding: '11px', color: '#5C5B66', fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
        </div>
      )}

      {/* PLANO */}
      {step === 'plano' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <StepBar step={step}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{catSel?.icon}</span>
            <h2 style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase' as const }}>Planos {catSel?.label}</h2>
          </div>
          <p style={{ textAlign: 'center' as const, color: '#9896A4', fontSize: 14, marginBottom: 28 }}>Escolhe o plano que melhor se adapta</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {planosFiltrados.map(p => (
              <button key={p.id} onClick={() => setPlanoId(p.id)} style={{
                background: planoId === p.id ? 'rgba(200,16,46,0.04)' : '#fff',
                border: `2px solid ${planoId === p.id ? '#C8102E' : '#E2E0DB'}`,
                borderRadius: 12, padding: '16px 20px', textAlign: 'left' as const, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: planoId === p.id ? '0 0 0 4px rgba(200,16,46,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s',
              }}>
                <div>
                  <div style={{ color: '#111', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{p.nome}</div>
                  <div style={{ color: '#9896A4', fontSize: 12.5 }}>{p.descricao}</div>
                </div>
                <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ color: planoId === p.id ? '#C8102E' : '#111', fontSize: 26, fontWeight: 900, fontFamily: "'Arial Black',sans-serif" }}>€{p.valor}</div>
                  <div style={{ color: '#9896A4', fontSize: 11 }}>/mês</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('categoria'); setPlanoId(''); }} style={{ flex: 1, background: '#F0EFEC', border: '1px solid #E2E0DB', borderRadius: 8, padding: '11px', color: '#5C5B66', fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
            <button onClick={() => planoId && setStep('dados')} disabled={!planoId} style={{ flex: 2, background: planoId ? '#C8102E' : '#E2E0DB', border: 'none', borderRadius: 8, padding: '11px', color: planoId ? '#fff' : '#9896A4', fontSize: 15, fontWeight: 800, fontFamily: "'Arial Black',sans-serif", cursor: planoId ? 'pointer' : 'not-allowed', boxShadow: planoId ? '0 4px 14px rgba(200,16,46,0.3)' : 'none' }}>
              CONTINUAR{planoSel ? ` — €${planoSel.valor}/mês` : ''}
            </button>
          </div>
        </div>
      )}

      {/* DADOS */}
      {step === 'dados' && (
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '48px 24px' }}>
          <StepBar step={step}/>
          <h2 style={{ textAlign: 'center' as const, fontSize: 26, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase' as const, marginBottom: 6 }}>Os teus dados</h2>
          <p style={{ textAlign: 'center' as const, color: '#9896A4', fontSize: 14, marginBottom: 26 }}>Entraremos em contacto em menos de 24h</p>
          <div style={{ background: '#fff', border: '1px solid #E2E0DB', borderRadius: 14, padding: 26, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Summary */}
            <div style={{ background: 'rgba(200,16,46,0.05)', border: '1px solid rgba(200,16,46,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#5C5B66', fontSize: 11, textTransform: 'uppercase' as const, fontWeight: 600 }}>Plano selecionado</div>
                <div style={{ color: '#111', fontSize: 13, fontWeight: 700, marginTop: 2 }}>{planoSel?.nome}</div>
              </div>
              <div style={{ color: '#C8102E', fontSize: 22, fontWeight: 900, fontFamily: "'Arial Black',sans-serif" }}>€{planoSel?.valor}<span style={{ fontSize: 11, fontWeight: 400, color: '#9896A4' }}>/mês</span></div>
            </div>

            {[
              { label: 'Nome completo *', val: nome, set: setNome, ph: 'Nome e Apelido', type: 'text' },
              { label: 'Email *',          val: email, set: setEmail, ph: 'email@exemplo.com', type: 'email' },
              { label: 'Telefone / WhatsApp *', val: tel, set: setTel, ph: '+351 9XX XXX XXX', type: 'tel' },
              { label: 'Data de Nascimento',    val: nasc, set: setNasc, ph: '', type: 'date' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 13 }}>
                <label style={{ display: 'block', color: '#5C5B66', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={INP}
                  onFocus={e => (e.target.style.borderColor = '#C8102E')}
                  onBlur={e => (e.target.style.borderColor = '#E2E0DB')}
                />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', color: '#5C5B66', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 4 }}>Mensagem (opcional)</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ex: nunca pratiquei, tenho interesse nos horários da manhã..." rows={3}
                style={{ ...INP, resize: 'none' as const }}
                onFocus={e => (e.target.style.borderColor = '#C8102E')}
                onBlur={e => (e.target.style.borderColor = '#E2E0DB')}
              />
            </div>
            <p style={{ color: '#B8B7C3', fontSize: 11, marginBottom: 18, lineHeight: 1.6 }}>🔒 Dados protegidos pelo RGPD · gbbraga.com</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('plano')} style={{ flex: 1, background: '#F0EFEC', border: '1px solid #E2E0DB', borderRadius: 8, padding: '11px', color: '#5C5B66', fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
              <button onClick={handleSubmit} disabled={!nome||!email||!tel||submitting} style={{ flex: 2, background: nome&&email&&tel ? '#C8102E' : '#E2E0DB', border: 'none', borderRadius: 8, padding: '11px', color: nome&&email&&tel ? '#fff' : '#9896A4', fontSize: 15, fontWeight: 800, fontFamily: "'Arial Black',sans-serif", cursor: nome&&email&&tel ? 'pointer' : 'not-allowed', boxShadow: nome&&email&&tel ? '0 4px 14px rgba(200,16,46,0.3)' : 'none' }}>
                {submitting ? '⟳ A enviar...' : 'ENVIAR INSCRIÇÃO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCESSO */}
      {step === 'sucesso' && (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px', textAlign: 'center' as const }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '3px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>✓</div>
          <h2 style={{ fontSize: 34, fontWeight: 900, fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase' as const, marginBottom: 10 }}>Inscrição enviada!</h2>
          <p style={{ color: '#5C5B66', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
            Obrigado, <strong>{nome.split(' ')[0]}</strong>!<br/>
            A nossa equipa contactar-te-á em menos de 24h para confirmar a inscrição.
          </p>
          <div style={{ background: '#fff', border: '1px solid #E2E0DB', borderRadius: 12, padding: '16px 20px', textAlign: 'left' as const, marginBottom: 24 }}>
            {[['Nome',nome],['Email',email],['Telefone',tel],['Plano',`${planoSel?.nome} — €${planoSel?.valor}/mês`]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #EDECE9' }}>
                <span style={{ color: '#9896A4', fontSize: 13 }}>{k}</span>
                <span style={{ color: '#111', fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="https://wa.me/351927773854" style={{ background: '#25D366', borderRadius: 10, padding: '12px 22px', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>💬 WhatsApp</a>
            <button onClick={() => { setStep('intro'); setPlanoId(''); setNome(''); setEmail(''); setTel(''); }} style={{ background: '#F0EFEC', border: '1px solid #E2E0DB', borderRadius: 10, padding: '12px 22px', color: '#5C5B66', fontSize: 14, cursor: 'pointer' }}>Voltar ao início</button>
          </div>
          <p style={{ color: '#B8B7C3', fontSize: 13, marginTop: 22 }}>🥋 OSS! Bem-vindo(a) à família Gracie Barra Braga</p>
        </div>
      )}

      <footer style={{ background: '#111', padding: '26px 24px', textAlign: 'center' as const }}>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          © 2025 Gracie Barra Braga · Rua Nova Santa Cruz 11, 4710-409 Braga · +351 927 773 854 · atendimento@gbbraga.com
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 5 }}>
          gbbraga.com · Stripe · TOConline · RGPD
        </div>
      </footer>
    </div>
  );
}
