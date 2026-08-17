/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { roleThemes } from '../lib/gbBrand';
import { GBLogoFull } from '../components/GBLogo';
import { supabase, isConfigured, isLocalSupabase } from '../lib/supabaseClient';
import type { UserRole } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import { Ico, KeyIcon, ClipboardDocumentIcon, PencilIcon, CreditCardIcon, CheckCircleIcon, IdentificationIcon, AcademicCapIcon, ArrowLeftIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, EnvelopeIcon } from '../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Seeded accounts on the local Supabase stack (`npx supabase start`), one per
// role — password reset to DEV_PASSWORD below for all of them. Only ever
// rendered when isLocalSupabase is true (see the gate further down), so this
// never ships pointed at a real project.
const DEMO_ROLES: { role: UserRole; email: string; label?: string }[] = [
  { role: 'superadmin',  email: 'superadmin@ginasio.test' },
  { role: 'admin',       email: 'admin@ginasio.test' },
  { role: 'atendimento', email: 'atendimento@ginasio.test' },
  { role: 'professor',   email: 'professor@ginasio.test' },
  { role: 'aluno',       email: 'aluno1@ginasio.test' },
  { role: 'aluno',       email: 'aluno2@ginasio.test', label: 'Aluno (2)' },
];
const DEV_PASSWORD = 'DevTest1234!';

const BELT_STRIPE = ['#F0EEFF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'];

interface LoginPageProps {
  onRegister: () => void;
}

export default function LoginPage({ onRegister }: LoginPageProps) {
  const { login, blockedMessage } = useAuth();
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [pw, setPw]             = useState('');
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [active, setActive]     = useState<string | null>(null);
  const [forgotMode, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetErr, setResetErr]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    const result = await login(email, pw);
    setLoading(false);
    if (!result.ok) setErr(result.message || 'Email ou password incorrectos.');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return setResetErr('Introduz um email válido.');
    setResetErr(''); setResetLoading(true);
    try {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) setResetErr(error.message);
      else setResetSent(true);
    } catch (e) {
      setResetErr(String(e));
    }
    setResetLoading(false);
  };

  const quick = async (role: UserRole, em: string) => {
    setActive(em);
    await login(em, isConfigured ? DEV_PASSWORD : '123');
    setActive(null);
  };

  return (
    <div className="flex min-h-screen font-ui bg-base">

      {/* ── Left decorative panel (desktop only) ── */}
      <div className="hidden relative overflow-hidden flex-col items-center justify-center md:flex w-[44%] py-15 px-12 border-r border-border bg-white">
        <div className="absolute -top-20 left-1/2 w-[400px] h-[300px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(200,16,46,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex absolute right-0 bottom-0 left-0 h-1">
          {BELT_STRIPE.map(c => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="mb-7"><GBLogoFull size={160}/></div>
        <div className="text-center">
          <div className="mb-4 text-[13px] font-semibold tracking-[1px] text-[#9B9AA6] uppercase">Sistema de Gestão</div>
          <div className="max-w-[240px] text-[13px] leading-[1.7] text-[#C0BFCB]">Plataforma integrada com Stripe, TOConline e WhatsApp Business</div>
        </div>
        <div className="flex absolute bottom-5 gap-4">
          {['AT Certificado','Stripe','RGPD'].map(l => (
            <Badge key={l} color="neutral">{l}</Badge>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex overflow-y-auto flex-col flex-1 justify-center items-center py-8 px-6 bg-base">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex justify-center mb-7 md:hidden">
            <GBLogoFull size={80}/>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 mb-7 rounded-md border border-border bg-elevated">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(''); }}
                className={[
                  'inline-flex flex-1 gap-1.5 justify-center items-center py-2.5 min-h-11 sm:min-h-0',
                  'border-none font-ui text-[13.5px] transition-all duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  tab === t ? 'rounded-[calc(var(--radius-md)-2px)] bg-white text-primary font-bold' : 'rounded-none bg-transparent text-muted font-normal hover:text-primary active:text-primary',
                  'cursor-pointer',
                ].join(' ')}>
                {t === 'login'
                  ? <><Ico icon={KeyIcon} sm /> Entrar</>
                  : <><Ico icon={ClipboardDocumentIcon} sm /> Inscrever-me</>
                }
              </button>
            ))}
          </div>

          {/* ══ LOGIN ══ */}
          {tab === 'login' && (
            <>
              {/* ── Forgot password view ── */}
              {forgotMode ? (
                <>
                  <h1 className="mb-1 font-display text-[22px] font-bold tracking-[1px] text-primary uppercase">Recuperar Password</h1>
                  <p className="mb-[22px] text-sm text-secondary">Indica o teu email e enviamos um link para definires uma nova password.</p>

                  {resetSent ? (
                    <div className="p-[16px_18px] text-center rounded-sm border border-gb-green/25 bg-gb-green/[0.08]">
                      <div className="mb-2.5 text-gb-green"><Ico icon={EnvelopeIcon} style={{ width: 32, height: 32 }} /></div>
                      <div className="mb-1.5 text-sm font-bold text-gb-green">Email enviado!</div>
                      <div className="text-[13px] leading-[1.6] text-secondary">
                        Verifica a tua caixa de entrada em <strong>{email}</strong>.<br/>O link expira em 24h.
                      </div>
                      <Button
                        variant="secondary" size="sm" className="mt-4"
                        onClick={() => { setForgot(false); setResetSent(false); }}
                      >
                        <Ico icon={ArrowLeftIcon} sm />Voltar ao login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgot}>
                      <div className="mb-[18px]">
                        <Input
                          label="Email" type="email" value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="seu@email.com" required
                        />
                      </div>
                      {resetErr && <p className="mb-3 text-[13px] font-medium text-gb-red">{resetErr}</p>}
                      <Button type="submit" variant="primary" size="lg" fullWidth loading={resetLoading} className="min-h-12">
                        {resetLoading ? 'A enviar...' : <><Ico icon={EnvelopeIcon} sm />Enviar link de recuperação</>}
                      </Button>
                      <Button
                        type="button" variant="secondary" size="md" fullWidth className="mt-2.5"
                        onClick={() => { setForgot(false); setResetErr(''); }}
                      >
                        <Ico icon={ArrowLeftIcon} sm />Voltar ao login
                      </Button>
                    </form>
                  )}
                </>
              ) : (
                <>
              <h1 className="mb-1 font-display text-[22px] font-bold tracking-[1px] text-primary uppercase">Entrar</h1>
              <p className="mb-[22px] text-sm text-secondary">Acede ao painel da tua academia</p>

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <Input
                    label="Email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required
                  />
                </div>
                <div className="mb-1.5">
                  <Input
                    label="Password" type="password" value={pw}
                    onChange={e => setPw(e.target.value)}
                    placeholder="••••••••" required
                  />
                </div>
                <div className="mb-[18px] text-right">
                  <button type="button" onClick={() => { setForgot(true); setErr(''); setResetErr(''); setResetSent(false); }}
                    className="p-0 text-xs text-muted bg-none border-none underline cursor-pointer transition-colors duration-200 hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 rounded-sm">
                    Esqueceste a password?
                  </button>
                </div>
                {/* blockedMessage: a session already open in this tab belonged to an
                    aluno staff just suspended/marked inactive — loadProfile signs
                    them out on its own, this just explains why they're back here. */}
                {(err || blockedMessage) && <p className="mb-3 text-[13px] font-medium text-gb-red">{err || blockedMessage}</p>}
                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="min-h-12">
                  {loading ? 'A entrar...' : 'Entrar'}
                </Button>
              </form>
                </>
              )}

              {/* Demo / dev quick-login buttons. Two safe cases only:
                  no Supabase configured at all (pure mock demo, no real
                  credentials involved), or a local Supabase dev stack while
                  running under Vite's dev server — never in a production
                  build, and never against a real/hosted project even if
                  someone runs `vite dev` pointed at one by mistake. */}
              {(!isConfigured || (import.meta.env.DEV && isLocalSupabase)) && !forgotMode && (
                <>
                  <div className="flex gap-3 items-center my-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold tracking-[1px] whitespace-nowrap text-muted uppercase">{isConfigured ? 'Dev' : 'Demo'}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {DEMO_ROLES.map(r => {
                      const rt = roleThemes[r.role];
                      const isAct = active === r.email;
                      return (
                        <button key={r.email} onClick={() => quick(r.role, r.email)} disabled={!!active}
                          className={[
                            'flex gap-2.5 items-center min-h-11 p-[10px_14px] rounded-sm border cursor-pointer transition-colors duration-200',
                            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                            isAct ? 'border-gb-red bg-gb-red/5' : 'border-border bg-card hover:bg-elevated active:bg-elevated',
                            active && !isAct ? 'cursor-not-allowed opacity-60' : '',
                          ].join(' ')}>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: rt.accent }} />
                          <div className="flex-1 text-left">
                            <div className="text-[13px] font-medium text-primary">{(r as any).label || rt.label}</div>
                            <div className="text-[10.5px] text-muted">{r.email}</div>
                          </div>
                          {isAct && <Ico icon={ArrowPathIcon} sm className="text-gb-red" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {isConfigured && !forgotMode && (
                <div className="mt-[18px] text-center">
                  <a href="mailto:atendimento@gbbraga.com" className="text-xs text-muted transition-colors duration-200 hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 rounded-sm">
                    Problemas? atendimento@gbbraga.com
                  </a>
                </div>
              )}
            </>
          )}

          {/* ══ REGISTER ══ */}
          {tab === 'register' && (
            <div className="text-center">
              {/* Belt stripe decoration */}
              <div className="flex overflow-hidden mb-7 h-1 rounded-full">
                {BELT_STRIPE.map(c => (
                  <div key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>

              <div className="mb-3 text-gb-red"><Ico icon={AcademicCapIcon} style={{ width: 52, height: 52 }} /></div>
              <h1 className="mb-2 font-display text-2xl font-black tracking-[1px] text-primary uppercase">
                Junta-te à GB Braga
              </h1>
              <p className="mx-auto mb-7 max-w-[320px] text-sm leading-[1.7] text-secondary">
                Faz a tua matrícula online em poucos minutos.<br/>
                Preenches a ficha, assinas o contrato e escolhes o plano — tudo num só passo.
              </p>

              {/* Steps preview */}
              <div className="flex flex-wrap gap-1.5 justify-center mb-7">
                {([
                  [IdentificationIcon,'Ficha'],
                  [PencilIcon,'Contrato'],
                  [CreditCardIcon,'Pagamento'],
                  [CheckCircleIcon,'Ativo'],
                ] as const).map(([Icon,label]) => (
                  <div key={label} className="flex flex-col gap-1 items-center">
                    <div className="flex justify-center items-center w-10 h-10 rounded-full border-[1.5px] border-gb-red/20 bg-gb-red/8">
                      <FontAwesomeIcon icon={Icon} className="w-5 h-5 text-gb-red/70" />
                    </div>
                    <span className="text-[10.5px] font-semibold text-muted">{label}</span>
                  </div>
                ))}
              </div>

              <Button variant="primary" size="lg" fullWidth className="mb-3 min-h-13" onClick={onRegister}>
                <Ico icon={AcademicCapIcon} />Começar Matrícula
              </Button>

              <p className="text-xs leading-[1.6] text-muted">
                Primeira aula gratuita · Sem compromisso inicial<br/>
                <a href="https://wa.me/351927773854" className="inline-flex gap-1.5 items-center font-bold text-[#25D366] transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 rounded-sm"><Ico icon={ChatBubbleLeftRightIcon} sm />Falar com a receção</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
