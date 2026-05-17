// @ts-nocheck
import { useState } from 'react';
import { usePlanos, db } from '../../lib/useData';
import { GB, beltConfig } from '../../lib/gbBrand';
import type { Belt } from '../../types';

interface NovaMatriculaModalProps { onClose: () => void; onSuccess?: (nome: string) => void; }

type Step = 'dados' | 'plano' | 'faixa' | 'contrato' | 'pagamento' | 'sucesso';

const STEPS: { id: Step; label: string }[] = [
  { id: 'plano',      label: 'Plano' },
  { id: 'dados',      label: 'Dados Pessoais' },
  { id: 'faixa',      label: 'Faixa Inicial' },
  { id: 'contrato',   label: 'Contrato' },
  { id: 'pagamento',  label: 'Pagamento' },
  { id: 'sucesso',    label: 'Confirmação' },
];

const STEP_ORDER: Step[] = ['plano','dados','faixa','contrato','pagamento','sucesso'];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}/>
  );
}

export default function NovaMatriculaModal({ onClose, onSuccess }: NovaMatriculaModalProps) {
  const { data: planos } = usePlanos();
  const [step, setStep] = useState<Step>('plano');
  const [processing, setProcessing] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [nif, setNif] = useState('');
  const [nasc, setNasc] = useState('');
  const [resp, setResp] = useState('');
  const [planoId, setPlanoId] = useState('');
  const [faixa, setFaixa] = useState<Belt>('branca');
  const [grau, setGrau] = useState(0);
  const [metodo, setMetodo] = useState<'stripe' | 'dinheiro' | 'transferencia'>('stripe');
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const stepIdx = STEP_ORDER.indexOf(step);
  const planoSel = planos.find(p => p.id === planoId);

  const next = () => {
    const nextStep = STEP_ORDER[stepIdx + 1];
    if (nextStep) setStep(nextStep);
  };

  const prev = () => {
    const prevStep = STEP_ORDER[stepIdx - 1];
    if (prevStep) setStep(prevStep);
  };

  const handlePagar = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1600));
    setProcessing(false);
    // Save to Supabase
      db.criarAluno({ nome, email, telefone, faixa, grau: parseInt(grau||'0'), planoId: plano, planoNome: planos.find((p:any)=>p.id===plano)?.nome }).catch(console.error);
      setStep('sucesso');
    onSuccess?.(nome);
  };

  const canNext = () => {
    if (step === 'dados') return nome.trim() && email.trim() && tel.trim();
    if (step === 'plano') return !!planoId;
    if (step === 'contrato') return aceitouTermos;
    return true;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: 540, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-float)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Nova Matrícula</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Passo {stepIdx + 1} de {STEP_ORDER.length - 1}</div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 28, height: 28, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>✕</button>
          </div>
          {/* Step bar */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.filter(s => s.id !== 'sucesso').map((s, i) => (
              <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= stepIdx - (step === 'sucesso' ? 0 : 0) ? GB.red : 'var(--bg-elevated)', transition: 'background 0.3s' }}/>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* ── DADOS ── */}
          {step === 'dados' && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Dados Pessoais</div>
              <FieldGroup label="Nome Completo"><Input value={nome} onChange={setNome} placeholder="Nome e Apelido"/></FieldGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="Email"><Input value={email} onChange={setEmail} placeholder="email@exemplo.pt" type="email"/></FieldGroup>
                <FieldGroup label="Telefone"><Input value={tel} onChange={setTel} placeholder="+351 9XX XXX XXX"/></FieldGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="NIF (opcional)"><Input value={nif} onChange={setNif} placeholder="123456789"/></FieldGroup>
                <FieldGroup label="Data de Nascimento"><Input value={nasc} onChange={setNasc} type="date"/></FieldGroup>
              </div>
              {nasc && new Date().getFullYear() - new Date(nasc).getFullYear() < 18 && (
                <FieldGroup label="Encarregado de Educação"><Input value={resp} onChange={setResp} placeholder="Nome completo do responsável"/></FieldGroup>
              )}
            </div>
          )}

          {/* ── PLANO ── */}
          {step === 'plano' && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Selecionar Plano</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {planos.filter(p => p.ativo).map(p => (
                  <button key={p.id} onClick={() => setPlanoId(p.id)}
                    style={{ background: planoId === p.id ? GB.redGlow : 'var(--bg-elevated)', border: `2px solid ${planoId === p.id ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{p.nome}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.descricao}</div>
                      {p.stripePriceId && <div style={{ color: '#635BFF', fontSize: 10.5, marginTop: 4, fontFamily: 'var(--font-mono)' }}>Stripe: {p.stripePriceId}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: planoId === p.id ? GB.red : 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>€{p.valor}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{p.aulas === 'ilimitado' ? 'aulas ilimitadas' : `${p.aulas} aulas/mês`}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FAIXA ── */}
          {step === 'faixa' && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Faixa Inicial</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {(['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'] as Belt[]).map(b => {
                  const bc = beltConfig[b];
                  return (
                    <button key={b} onClick={() => setFaixa(b)} style={{ background: faixa === b ? 'var(--bg-elevated)' : 'var(--bg-card)', border: `2px solid ${faixa === b ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '10px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 40, height: 8, background: bc?.bg || '#888', borderRadius: 2, border: b === 'branca' ? '1px solid #555' : 'none', boxShadow: faixa === b ? `0 0 10px ${(bc?.bg || '#888')}88` : 'none' }}/>
                      <span style={{ color: faixa === b ? GB.red : 'var(--text-secondary)', fontSize: 11, fontWeight: faixa === b ? 700 : 400, textTransform: 'capitalize' }}>{bc?.label}</span>
                    </button>
                  );
                })}
              </div>
              <FieldGroup label="Grau inicial">
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0,1,2,3,4].map(g => (
                    <button key={g} onClick={() => setGrau(g)} style={{ flex: 1, background: grau === g ? GB.red : 'var(--bg-elevated)', border: `1px solid ${grau === g ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '8px', color: grau === g ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: grau === g ? 700 : 400, cursor: 'pointer' }}>{g}°</button>
                  ))}
                </div>
              </FieldGroup>
            </div>
          )}

          {/* ── CONTRATO ── */}
          {step === 'contrato' && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Contrato de Matrícula</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 16, maxHeight: 280, overflowY: 'auto' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DESPORTIVOS</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
                  <p><strong>Prestador:</strong> Gracie Barra Braga, Lda. · NIF 512345678 · Rua ..., 4700 Braga</p>
                  <p><strong>Beneficiário:</strong> {nome || '[nome]'}</p>
                  <p><strong>Plano contratado:</strong> {planoSel?.nome || '[plano]'} — €{planoSel?.valor || 0}/mês</p>
                  <p><strong>Início:</strong> {new Date().toLocaleDateString('pt-PT')}</p>
                  <p style={{ marginTop: 10 }}>O presente contrato rege-se pelas seguintes cláusulas:</p>
                  <p>1. O beneficiário compromete-se ao pagamento mensal do valor acordado até ao dia 5 de cada mês.</p>
                  <p>2. A falta de pagamento por mais de 15 dias implica a suspensão do acesso às instalações.</p>
                  <p>3. O cancelamento deve ser comunicado com 30 dias de antecedência.</p>
                  <p>4. Os dados pessoais são tratados nos termos do RGPD. Consulte a nossa política de privacidade.</p>
                  <p>5. Ao assinar, o beneficiário declara conhecer e aceitar o regulamento interno da academia.</p>
                  <p>6. O presente contrato é regulado pela lei portuguesa e qualquer litígio será resolvido nos tribunais de Braga.</p>
                </div>
              </div>
              <button onClick={() => setAceitouTermos(!aceitouTermos)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%' }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${aceitouTermos ? GB.red : 'var(--border)'}`, background: aceitouTermos ? GB.red : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {aceitouTermos && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Li e aceito os termos do contrato e a política de privacidade</span>
              </button>
            </div>
          )}

          {/* ── PAGAMENTO ── */}
          {step === 'pagamento' && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Primeiro Pagamento</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Plano</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{planoSel?.nome}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Base tributável (IVA 23% incl.)</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>€{((planoSel?.valor || 0) / 1.23).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>IVA 23%</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>€{((planoSel?.valor || 0) - (planoSel?.valor || 0) / 1.23).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Total</span>
                  <span style={{ color: GB.red, fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>€{planoSel?.valor || 0}</span>
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Método de pagamento</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {[
                  { id: 'stripe', icon: '💳', label: 'Cartão de Crédito / Débito', sub: 'Processado pelo Stripe — seguro e instantâneo' },
                  { id: 'transferencia', icon: '🏦', label: 'Transferência Bancária', sub: 'IBAN: PT50 0000 0000 0000 0000 0000 0' },
                  { id: 'dinheiro', icon: '💵', label: 'Numerário', sub: 'Pagar presencialmente na receção' },
                ].map(m => (
                  <button key={m.id} onClick={() => setMetodo(m.id as typeof metodo)} style={{ background: metodo === m.id ? GB.redGlow : 'var(--bg-elevated)', border: `2px solid ${metodo === m.id ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{m.sub}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${metodo === m.id ? GB.red : 'var(--border)'}`, background: metodo === m.id ? GB.red : 'transparent', flexShrink: 0 }}/>
                  </button>
                ))}
              </div>

              <button onClick={handlePagar} disabled={processing} style={{ width: '100%', background: processing ? 'var(--bg-elevated)' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: processing ? 'none' : `0 0 18px ${GB.redGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {processing ? '⟳ A processar...' : metodo === 'stripe' ? `💳 Pagar €${planoSel?.valor} com Stripe` : `Confirmar Matrícula`}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: 10.5, textAlign: 'center', marginTop: 8 }}>Fatura-Recibo emitida automaticamente via TOConline</p>
            </div>
          )}

          {/* ── SUCESSO ── */}
          {step === 'sucesso' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px' }}>✓</div>
              <div style={{ color: '#22C55E', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Matrícula Concluída!</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>{nome} foi matriculado(a) com sucesso</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Aluno', nome], ['Plano', planoSel?.nome], ['Faixa', `${beltConfig[faixa]?.label} G${grau}`],
                  ['Pagamento', metodo === 'stripe' ? `Stripe — €${planoSel?.valor}` : metodo], ['Fatura', 'FR emitida no TOConline'],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Fechar</button>
                <button style={{ flex: 2, background: '#25D366', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>💬 Enviar Boas-vindas (WhatsApp)</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== 'sucesso' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10, flexShrink: 0 }}>
            {stepIdx > 0 && <button onClick={prev} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>← Anterior</button>}
            {step !== 'pagamento' && (
              <button onClick={next} disabled={!canNext()} style={{ flex: 2, background: canNext() ? GB.red : 'var(--bg-elevated)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: canNext() ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed', boxShadow: canNext() ? `0 0 14px ${GB.redGlow}` : 'none' }}>
                Seguinte →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
