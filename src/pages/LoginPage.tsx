/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { GB, roleThemes } from '../lib/gbBrand';
import { GBLogoFull } from '../components/GBLogo';
import { isConfigured } from '../lib/supabaseClient';
import type { UserRole } from '../types';

const DEMO_ROLES: { role: UserRole; email: string; label?: string }[] = [
  { role: 'superadmin',  email: 'superadmin@gbbraga.com' },
  { role: 'admin',       email: 'admin@gbbraga.com' },
  { role: 'atendimento', email: 'recepcao@gbbraga.com' },
  { role: 'professor',   email: 'joao@gbbraga.com' },
  { role: 'aluno',       email: 'lucas@gmail.com' },
  { role: 'aluno',       email: 'novo@gbbraga.com', label: 'Novo Aluno' },
];

const INP: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '12px 14px', fontSize: 16, fontFamily: 'var(--font-ui)',
  outline: 'none', background: '#fff', color: 'var(--text-primary)', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const LBL: React.CSSProperties = {
  display: 'block', color: 'var(--text-muted)', fontSize: 10.5,
  fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5,
};

interface LoginPageProps {
  onRegister: () => void;
}

export default function LoginPage({ onRegister }: LoginPageProps) {
  const { login } = useAuth();
  const [tab, setTab]         = useState<'login' | 'register'>('login');
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    const ok = await login(email, pw);
    setLoading(false);
    if (!ok) setErr('Email ou password incorrectos.');
  };

  const quick = async (role: UserRole, em: string) => {
    setActive(em);
    await login(em, '123');
    setActive(null);
  };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = GB.red);
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--border)');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-ui)', background: 'var(--bg-base)' }}>

      {/* ── Left decorative panel ── */}
      <div className="login-left" style={{ width: '44%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(200,16,46,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'flex' }}>
          {['#F0EEFF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'].map(c => (
            <div key={c} style={{ flex: 1, background: c }}/>
          ))}
        </div>
        <div style={{ marginBottom: 28 }}><GBLogoFull size={160}/></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#9B9AA6', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Sistema de Gestão</div>
          <div style={{ fontSize: 13, color: '#C0BFCB', lineHeight: 1.7, maxWidth: 240 }}>Plataforma integrada com Stripe, TOConline e WhatsApp Business</div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 16 }}>
          {['AT Certificado','Stripe','RGPD'].map(l => (
            <span key={l} style={{ background: '#F5F4F2', border: '1px solid #E0DDD8', borderRadius: 4, padding: '3px 8px', fontSize: 9.5, color: '#9B9AA6', fontWeight: 600 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 24px', overflowY: 'auto', background: 'var(--bg-base)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: 'none', justifyContent: 'center', marginBottom: 28 }}>
            <GBLogoFull size={80}/>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 28 }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(''); }}
                style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: tab === t ? 'calc(var(--radius-md) - 2px)' : 0, background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: tab === t ? 700 : 400, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-ui)', boxShadow: tab === t ? 'var(--shadow-xs)' : 'none', transition: 'all 0.15s' }}>
                {t === 'login' ? '🔑 Entrar' : '📋 Inscrever-me'}
              </button>
            ))}
          </div>

          {/* ══ LOGIN ══ */}
          {tab === 'login' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Entrar</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 22 }}>Acede ao painel da tua academia</p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                  <label style={LBL}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required style={INP} onFocus={focus} onBlur={blur}/>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={LBL}>Password</label>
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                    placeholder="••••••••" required style={INP} onFocus={focus} onBlur={blur}/>
                </div>
                {err && <p style={{ color: GB.red, fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{err}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '13px', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : 'var(--shadow-red)', minHeight: 48 }}>
                  {loading ? 'A entrar...' : 'Entrar'}
                </button>
              </form>

              {/* Demo buttons */}
              {!isConfigured && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Demo</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {DEMO_ROLES.map(r => {
                      const rt = roleThemes[r.role];
                      const isAct = active === r.email;
                      return (
                        <button key={r.email} onClick={() => quick(r.role, r.email)} disabled={!!active}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, background: isAct ? 'rgba(200,16,46,0.05)' : 'var(--bg-card)', border: `1px solid ${isAct ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer', minHeight: 44 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: rt.accent, flexShrink: 0 }}/>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{(r as any).label || rt.label}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{r.email}</div>
                          </div>
                          {isAct && <span style={{ color: GB.red, fontSize: 11 }}>⟳</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {isConfigured && (
                <div style={{ marginTop: 18, textAlign: 'center' }}>
                  <a href="mailto:atendimento@gbbraga.com" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    Problemas? atendimento@gbbraga.com
                  </a>
                </div>
              )}
            </>
          )}

          {/* ══ REGISTER ══ */}
          {tab === 'register' && (
            <div style={{ textAlign: 'center' }}>
              {/* Belt stripe decoration */}
              <div style={{ height: 4, display: 'flex', borderRadius: 99, overflow: 'hidden', marginBottom: 28 }}>
                {['#F0EEFF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'].map(c => (
                  <div key={c} style={{ flex: 1, background: c }}/>
                ))}
              </div>

              <div style={{ fontSize: 52, marginBottom: 12 }}>🥋</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                Junta-te à GB Braga
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 320, margin: '0 auto 28px' }}>
                Faz a tua matrícula online em poucos minutos.<br/>
                Preenches a ficha, assinas o contrato e escolhes o plano — tudo num só passo.
              </p>

              {/* Steps preview */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
                {[['📋','Ficha'],['✍️','Contrato'],['💳','Pagamento'],['✅','Ativo']].map(([icon,label]) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(200,16,46,0.08)', border: '1.5px solid rgba(200,16,46,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>

              <button onClick={onRegister}
                style={{ width: '100%', background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '15px', color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: 'var(--shadow-red)', minHeight: 52, marginBottom: 12 }}>
                🥋 Começar Matrícula
              </button>

              <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                Primeira aula gratuita · Sem compromisso inicial<br/>
                <a href="https://wa.me/351927773854" style={{ color: '#25D366', fontWeight: 700 }}>💬 Falar com a receção</a>
              </p>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .login-left  { display: none !important; }
          .mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
