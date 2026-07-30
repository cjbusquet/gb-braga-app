/* eslint-disable @typescript-eslint/no-explicit-any */
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
    <div className="flex gap-1.5 justify-center mb-7">
      {steps.map((s, i) => (
        <div key={s} className="flex gap-1.5 items-center">
          <div className={['h-[7px] rounded-full transition-all', i <= idx ? 'w-[22px] bg-gb-red' : 'w-[7px] bg-border'].join(' ')}/>
        </div>
      ))}
    </div>
  );
}

const FIELD_CLASS = 'block w-full py-[11px] px-3.5 min-h-11 sm:min-h-0 text-[15px] font-ui rounded-lg border-[1.5px] outline-none transition-all duration-200 border-border bg-white text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';

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
    <div className="min-h-screen font-ui bg-base">

      {/* Header */}
      <header className="flex sticky top-0 z-[100] gap-2 justify-between items-center py-0 px-4 h-[66px] border-b shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-border bg-white sm:px-6">
        <a href="https://gbbraga.com" className="flex gap-2.5 items-center no-underline shrink-0">
          <GBLogoFull size={48}/>
        </a>
        <div className="flex gap-2 shrink-0">
          <a href="tel:+351927773854" className="inline-flex items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[13px] font-medium no-underline rounded-lg border transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <span aria-hidden="true">📞</span>
            <span className="hidden sm:inline">&nbsp;+351 927 773 854</span>
          </a>
          <a href="https://wa.me/351927773854" className="inline-flex items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[13px] font-bold text-white no-underline rounded-lg border-none bg-[#25D366] transition-colors duration-200 hover:bg-[#1FB157] active:bg-[#1FB157] outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2">💬 WhatsApp</a>
        </div>
      </header>

      {/* INTRO */}
      {step === 'intro' && (
        <>
          <div className="py-[72px] px-6 pb-20 text-center" style={{ background: 'linear-gradient(135deg, #0D0508 0%, #1A0208 60%, #2A0510 100%)' }}>
            <div className="inline-block py-1.5 px-[18px] mb-[22px] rounded-full border border-gb-red/35 bg-gb-red/[0.18]">
              <span className="text-xs font-bold tracking-[2px] text-[#FF7A95] uppercase">🏆 Gracie Barra Braga · gbbraga.com</span>
            </div>
            <h1 className="mb-[18px] font-display font-black leading-[1.05] text-white" style={{ fontSize: 'clamp(30px,5vw,58px)' }}>
              Começa a tua jornada<br/>no Brazilian Jiu-Jitsu
            </h1>
            <p className="mx-auto mb-9 max-w-[520px] text-[17px] leading-[1.7] text-white/65">
              Junta-te à família Gracie Barra em Braga. Para todos os níveis e idades.<br/>
              <strong className="text-white/90">Primeira aula completamente gratuita.</strong>
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setStep('categoria')} className="py-[15px] px-9 min-h-11 sm:min-h-0 font-display text-[17px] font-extrabold text-white rounded-[10px] border-none shadow-[0_4px_20px_rgba(200,16,46,0.45)] cursor-pointer bg-gb-red transition-all duration-200 hover:bg-gb-red-dark active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                INSCREVER AGORA
              </button>
              <a href="https://gbbraga.com/formulario-aula-teste-gratuita/" className="inline-flex items-center py-[15px] px-6 min-h-11 sm:min-h-0 text-[15px] text-white no-underline rounded-[10px] border transition-colors duration-200 border-white/20 bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.14] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">
                Aula gratuita →
              </a>
            </div>
            <div className="flex flex-wrap gap-10 justify-center mt-12">
              {[['200+','Alunos'],['Seg–Sáb','Horários'],['5★','Google']].map(([v,l]) => (
                <div key={l} className="text-center">
                  <div className="font-display text-[30px] font-black text-gb-red">{v}</div>
                  <div className="mt-0.5 text-xs text-white/45">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Belt stripe */}
          <div className="flex h-[5px]">
            {['#E8E7FF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'].map(c => <div key={c} className="flex-1" style={{ background: c }}/>)}
          </div>

          {/* Planos preview */}
          <div className="mx-auto py-[60px] px-6 pb-12 max-w-[960px]">
            <h2 className="mb-3 font-display font-black text-center uppercase" style={{ fontSize: 'clamp(22px,3vw,36px)' }}>Planos e Preços</h2>
            <p className="mb-9 text-[15px] text-center text-secondary">Mensalidade debitada automaticamente. Cancele a qualquer momento.</p>

            {/* Categoria cards */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-10">
              {CATEGORIAS.map(cat => {
                const catPlanos = planos.filter(p => p.ativo && (p as any).categoria === cat.id);
                const minPrice = catPlanos.length ? Math.min(...catPlanos.map(p => p.valor)) : 0;
                return (
                  <div key={cat.id} onClick={() => { setCategoria(cat.id); setStep('plano'); }}
                    className="py-[22px] px-[18px] text-center rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer transition-all border-border bg-white"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 4px 14px ${cat.color}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E0DB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                  >
                    <div className="mb-2.5 text-3xl">{cat.icon}</div>
                    <div className="mb-1 text-base font-extrabold text-primary">{cat.label}</div>
                    <div className="mb-3 text-xs text-muted">{cat.desc}</div>
                    {minPrice > 0 && (
                      <div className="font-display text-[22px] font-black" style={{ color: cat.color }}>
                        desde €{minPrice}<span className="text-xs font-normal text-muted">/mês</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Benefits */}
            <h2 className="mb-7 font-display font-black text-center uppercase" style={{ fontSize: 'clamp(20px,3vw,32px)' }}>Porquê a GB Braga?</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
              {BENEFITS.map(b => (
                <div key={b.text} className="flex gap-3 py-4 px-[18px] rounded-xl border border-border bg-white">
                  <span className="text-2xl shrink-0">{b.icon}</span>
                  <span className="text-[13.5px] leading-[1.5] text-[#333]">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="py-[52px] px-6 border-t border-border bg-white">
            <div className="mx-auto max-w-[900px]">
              <h2 className="mb-[30px] font-display text-2xl font-black text-center uppercase">O que dizem os nossos alunos</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
                {TESTIMONIALS.map(t => (
                  <div key={t.nome} className="p-5 rounded-xl border border-border bg-base">
                    <p className="mb-3.5 text-sm italic leading-[1.7] text-[#333]">"{t.texto}"</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex justify-center items-center w-8 h-8 text-[13px] font-bold text-white rounded-full bg-gb-red">{t.nome.charAt(0)}</div>
                      <div>
                        <div className="text-[13px] font-semibold text-primary">{t.nome}</div>
                        <div className="text-[11px] text-muted">{t.faixa}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="py-[52px] px-6 text-center bg-gb-red">
            <h2 className="mb-3.5 font-display text-[34px] font-black text-white uppercase">Pronto para começar?</h2>
            <p className="mb-6 text-[15px] text-white/80">Primeira aula gratuita · Sem compromisso</p>
            <button onClick={() => setStep('categoria')} className="py-3.5 px-9 min-h-11 sm:min-h-0 font-display text-[17px] font-black text-gb-red bg-white rounded-[10px] border-none cursor-pointer transition-all duration-200 hover:bg-white/90 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gb-red">INSCREVER AGORA →</button>
          </div>
        </>
      )}

      {/* CATEGORIA */}
      {step === 'categoria' && (
        <div className="mx-auto py-12 px-6 max-w-[680px]">
          <StepBar step={step}/>
          <h2 className="mb-1.5 font-display text-2xl font-black text-center uppercase">Quem se vai inscrever?</h2>
          <p className="mb-[30px] text-sm text-center text-muted">Escolhe a categoria para ver os planos disponíveis</p>
          <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
            {CATEGORIAS.map(cat => {
              const catPlanos = planos.filter(p => p.ativo && (p as any).categoria === cat.id);
              const minPrice = Math.min(...catPlanos.map(p => p.valor));
              return (
                <button key={cat.id} onClick={() => { setCategoria(cat.id); setStep('plano'); }}
                  className="py-6 px-5 text-center rounded-2xl border-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer border-border bg-white active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${cat.color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E0DB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                >
                  <div className="mb-2.5 text-4xl">{cat.icon}</div>
                  <div className="mb-1 text-[17px] font-extrabold text-primary">{cat.label}</div>
                  <div className="mb-3 text-xs text-muted">{cat.desc}</div>
                  <div className="font-display text-xl font-black" style={{ color: cat.color }}>
                    desde €{minPrice}<span className="text-[11px] font-normal text-muted">/mês</span>
                  </div>
                  <div className={['mt-1 text-[11px]', planos.length > 1 ? 'text-muted' : 'text-transparent'].join(' ')}>
                    {planos.length} opção{planos.length !== 1 ? 'ões' : ''}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep('intro')} className="py-2.5 w-full min-h-11 sm:min-h-0 text-sm rounded-lg border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">← Voltar</button>
        </div>
      )}

      {/* PLANO */}
      {step === 'plano' && (
        <div className="mx-auto py-12 px-6 max-w-[680px]">
          <StepBar step={step}/>
          <div className="flex gap-2.5 justify-center items-center mb-1.5">
            <span className="text-[28px]">{catSel?.icon}</span>
            <h2 className="font-display text-2xl font-black uppercase">Planos {catSel?.label}</h2>
          </div>
          <p className="mb-7 text-sm text-center text-muted">Escolhe o plano que melhor se adapta</p>
          <div className="flex flex-col gap-2.5 mb-5">
            {planosFiltrados.map(p => (
              <button key={p.id} onClick={() => setPlanoId(p.id)}
                className="flex justify-between items-center py-4 px-5 text-left rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                style={{
                  background: planoId === p.id ? 'rgba(200,16,46,0.04)' : '#fff',
                  borderColor: planoId === p.id ? '#C8102E' : '#E2E0DB',
                  boxShadow: planoId === p.id ? '0 0 0 4px rgba(200,16,46,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                <div>
                  <div className="mb-1 text-[15px] font-bold text-primary">{p.nome}</div>
                  <div className="text-[12.5px] text-muted">{p.descricao}</div>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <div className={['font-display text-2xl font-black', planoId === p.id ? 'text-gb-red' : 'text-primary'].join(' ')}>€{p.valor}</div>
                  <div className="text-[11px] text-muted">/mês</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => { setStep('categoria'); setPlanoId(''); }} className="flex-1 py-2.5 min-h-11 sm:min-h-0 text-sm rounded-lg border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">← Voltar</button>
            <button onClick={() => planoId && setStep('dados')} disabled={!planoId}
              className={[
                'flex-[2] py-2.5 min-h-11 sm:min-h-0 font-display text-[15px] font-extrabold rounded-lg border-none transition-all duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                planoId ? 'text-white shadow-[0_4px_14px_rgba(200,16,46,0.3)] cursor-pointer bg-gb-red hover:bg-gb-red-dark active:scale-[0.98]' : 'cursor-not-allowed text-muted bg-border',
              ].join(' ')}>
              CONTINUAR{planoSel ? ` — €${planoSel.valor}/mês` : ''}
            </button>
          </div>
        </div>
      )}

      {/* DADOS */}
      {step === 'dados' && (
        <div className="mx-auto py-12 px-6 max-w-[540px]">
          <StepBar step={step}/>
          <h2 className="mb-1.5 font-display text-[26px] font-black text-center uppercase">Os teus dados</h2>
          <p className="mb-[26px] text-sm text-center text-muted">Entraremos em contacto em menos de 24h</p>
          <div className="p-[26px] rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-border bg-white">
            {/* Summary */}
            <div className="flex justify-between items-center py-2.5 px-3.5 mb-5 rounded-lg border border-gb-red/15 bg-gb-red/5">
              <div>
                <div className="text-[11px] font-semibold uppercase text-secondary">Plano selecionado</div>
                <div className="mt-0.5 text-[13px] font-bold text-primary">{planoSel?.nome}</div>
              </div>
              <div className="font-display text-[22px] font-black text-gb-red">€{planoSel?.valor}<span className="text-[11px] font-normal text-muted">/mês</span></div>
            </div>

            {[
              { label: 'Nome completo *', val: nome, set: setNome, ph: 'Nome e Apelido', type: 'text' },
              { label: 'Email *',          val: email, set: setEmail, ph: 'email@exemplo.com', type: 'email' },
              { label: 'Telefone / WhatsApp *', val: tel, set: setTel, ph: '+351 9XX XXX XXX', type: 'tel' },
              { label: 'Data de Nascimento',    val: nasc, set: setNasc, ph: '', type: 'date' },
            ].map(f => (
              <div key={f.label} className="mb-3.5">
                <label className="block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-secondary">{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className={FIELD_CLASS} />
              </div>
            ))}
            <div className="mb-5">
              <label className="block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-secondary">Mensagem (opcional)</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ex: nunca pratiquei, tenho interesse nos horários da manhã..." rows={3}
                className={[FIELD_CLASS, 'resize-none'].join(' ')}
              />
            </div>
            <p className="mb-5 text-[11px] leading-[1.6] text-[#B8B7C3]">🔒 Dados protegidos pelo RGPD · gbbraga.com</p>
            <div className="flex gap-2.5">
              <button onClick={() => setStep('plano')} className="flex-1 py-2.5 min-h-11 sm:min-h-0 text-sm rounded-lg border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">← Voltar</button>
              <button onClick={handleSubmit} disabled={!nome||!email||!tel||submitting}
                className={[
                  'flex-[2] py-2.5 min-h-11 sm:min-h-0 font-display text-[15px] font-extrabold rounded-lg border-none transition-all duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  nome&&email&&tel ? 'text-white shadow-[0_4px_14px_rgba(200,16,46,0.3)] cursor-pointer bg-gb-red hover:bg-gb-red-dark active:scale-[0.98]' : 'cursor-not-allowed text-muted bg-border',
                ].join(' ')}>
                {submitting ? '⟳ A enviar...' : 'ENVIAR INSCRIÇÃO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCESSO */}
      {step === 'sucesso' && (
        <div className="mx-auto py-16 px-6 max-w-[520px] text-center">
          <div className="flex justify-center items-center mx-auto mb-5 w-20 h-20 text-4xl rounded-full border-[3px] border-green-600/30 bg-green-600/10">✓</div>
          <h2 className="mb-2.5 font-display text-[34px] font-black uppercase">Inscrição enviada!</h2>
          <p className="mb-7 text-[15px] leading-[1.7] text-secondary">
            Obrigado, <strong>{nome.split(' ')[0]}</strong>!<br/>
            A nossa equipa contactar-te-á em menos de 24h para confirmar a inscrição.
          </p>
          <div className="p-5 px-5 mb-6 text-left rounded-xl border border-border bg-white">
            {[['Nome',nome],['Email',email],['Telefone',tel],['Plano',`${planoSel?.nome} — €${planoSel?.valor}/mês`]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-[13px] text-muted">{k}</span>
                <span className="text-[13px] font-semibold text-primary">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 justify-center">
            <a href="https://wa.me/351927773854" className="inline-flex items-center py-3 px-[22px] min-h-11 sm:min-h-0 text-sm font-bold text-white no-underline rounded-[10px] bg-[#25D366] transition-colors duration-200 hover:bg-[#1FB157] active:bg-[#1FB157] outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2">💬 WhatsApp</a>
            <button onClick={() => { setStep('intro'); setPlanoId(''); setNome(''); setEmail(''); setTel(''); }} className="py-3 px-[22px] min-h-11 sm:min-h-0 text-sm rounded-[10px] border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">Voltar ao início</button>
          </div>
          <p className="mt-[22px] text-[13px] text-[#B8B7C3]">🥋 OSS! Bem-vindo(a) à família Gracie Barra Braga</p>
        </div>
      )}

      <footer className="py-[26px] px-6 text-center bg-[#111]">
        <div className="text-xs text-white/35">
          © 2025 Gracie Barra Braga · Rua Nova Santa Cruz 11, 4710-409 Braga · +351 927 773 854 · atendimento@gbbraga.com
        </div>
        <div className="mt-1.5 text-[11px] text-white/20">
          gbbraga.com · Stripe · TOConline · RGPD
        </div>
      </footer>
    </div>
  );
}
