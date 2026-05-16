import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { GB, roleThemes } from '../lib/gbBrand';
import { GBLogoFull } from '../components/GBLogo';
import type { UserRole } from '../types';

const ROLES: { role: UserRole; email: string; label?: string }[] = [
  { role: 'superadmin',  email: 'superadmin@gbbraga.com' },
  { role: 'admin',       email: 'admin@gbbraga.com' },
  { role: 'atendimento', email: 'recepcao@gbbraga.com' },
  { role: 'professor',   email: 'joao@gbbraga.com' },
  { role: 'aluno',       email: 'lucas@gmail.com' },
  { role: 'aluno',       email: 'novo@gbbraga.com',  label: 'Novo Aluno' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [active, setActive] = useState<UserRole | null>(null);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, pw || '123')) setErr('Email não encontrado');
  };

  const quick = (role: UserRole, em: string) => {
    setActive(role);
    login(em, '123');
  };

  const inp: React.CSSProperties = {
    width: '100%', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
    fontSize: 14, fontFamily: 'var(--font-ui)', outline: 'none',
    background: '#fff', color: 'var(--text-primary)', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ height: '100vh', display: 'flex', fontFamily: 'var(--font-ui)', background: '#fff', overflow: 'hidden' }}>

      {/* ── LEFT PANEL — white with logo ── */}
      <div style={{
        width: '44%', background: '#FFFFFF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', borderRight: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle red gradient glow at top */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(200,16,46,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        {/* Belt stripe at very bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'flex' }}>
          {['#F0EEFF','#EAB308','#EA580C','#16A34A','#1D4ED8','#7C3AED','#7C4A35','#111'].map(c => (
            <div key={c} style={{ flex: 1, background: c }}/>
          ))}
        </div>

        {/* The real GB Braga logo SVG */}
        <div style={{ marginBottom: 28 }}>
          <GBLogoFull size={160}/>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#9B9AA6', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
            Sistema de Gestão
          </div>
          <div style={{ fontSize: 13, color: '#C0BFCB', lineHeight: 1.7, maxWidth: 240 }}>
            Plataforma integrada com Stripe, TOConline e WhatsApp Business
          </div>
        </div>

        {/* Certified logos strip */}
        <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          {['AT Certificado', 'Stripe', 'RGPD'].map(l => (
            <span key={l} style={{ background: '#F5F4F2', border: '1px solid #E0DDD8', borderRadius: 4, padding: '3px 8px', fontSize: 9.5, color: '#9B9AA6', fontWeight: 600, letterSpacing: '0.5px' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 52px', overflowY: 'auto', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 380 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>Entrar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Aceda ao painel da sua academia</p>

          <form onSubmit={go}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inp}
                onFocus={e => (e.target.style.borderColor = GB.red)}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5 }}>Password</label>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={inp}
                onFocus={e => (e.target.style.borderColor = GB.red)}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            {err && <p style={{ color: GB.red, fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{err}</p>}
            <button type="submit" style={{
              width: '100%', background: GB.red, border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '13px',
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: 'var(--shadow-red)',
            }}>
              Entrar
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Acesso Rápido Demo</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          {/* Role pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ROLES.map(r => {
              const rt = roleThemes[r.role];
              const isActive = active === r.role;
              return (
                <button key={r.email} onClick={() => quick(r.role, r.email)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive ? rt.accentGlow : 'var(--bg-card)',
                  border: `1.5px solid ${isActive ? rt.accent + '50' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '9px 12px', textAlign: 'left', cursor: 'pointer',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: rt.dot, border: r.role === 'aluno' ? '1.5px solid #aaa' : 'none', flexShrink: 0 }}/>
                  <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{(r as any).label || rt.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{r.email.split('@')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
