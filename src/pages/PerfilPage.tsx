import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { useAuth } from '../lib/auth';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { GB, roleThemes } from '../lib/gbBrand';
import type { Belt } from '../types';

// ─── Belt metadata (derived from gbBrand beltConfig) ─────────────────────────
// Mapped to the Belt type keys — bicolor belts use CSS gradients as bg
const BELT_META: Record<Belt, { label: string; bg: string; color: string }> = {
  // Adulto
  branca:           { label: 'Branca',         bg: '#E5E7EB',                                                    color: '#111111' },
  azul:             { label: 'Azul',           bg: '#2563EB',                                                    color: '#ffffff' },
  roxa:             { label: 'Roxa',           bg: '#7C3AED',                                                    color: '#ffffff' },
  marrom:           { label: 'Marrom',         bg: '#92400E',                                                    color: '#ffffff' },
  preta:            { label: 'Preta',          bg: '#111827',                                                    color: '#ffffff' },
  vermelha:         { label: 'Vermelha',       bg: '#C8102E',                                                    color: '#ffffff' },
  // Infantil — cinza
  'cinza-branca':   { label: 'Cinza/Branca',   bg: 'linear-gradient(to right,#6B7280 55%,#E5E7EB 55%)',          color: '#333333' },
  cinza:            { label: 'Cinza',          bg: '#6B7280',                                                    color: '#ffffff' },
  'cinza-preta':    { label: 'Cinza/Preta',    bg: 'linear-gradient(to right,#6B7280 55%,#111827 55%)',          color: '#ffffff' },
  // Infantil — amarela
  'amarela-branca': { label: 'Amarela/Branca', bg: 'linear-gradient(to right,#EAB308 55%,#E5E7EB 55%)',          color: '#333333' },
  amarela:          { label: 'Amarela',        bg: '#EAB308',                                                    color: '#111111' },
  'amarela-preta':  { label: 'Amarela/Preta',  bg: 'linear-gradient(to right,#EAB308 55%,#111827 55%)',          color: '#111111' },
  // Infantil — laranja
  'laranja-branca': { label: 'Laranja/Branca', bg: 'linear-gradient(to right,#EA580C 55%,#E5E7EB 55%)',          color: '#ffffff' },
  laranja:          { label: 'Laranja',        bg: '#F97316',                                                    color: '#ffffff' },
  'laranja-preta':  { label: 'Laranja/Preta',  bg: 'linear-gradient(to right,#EA580C 55%,#111827 55%)',          color: '#ffffff' },
  // Infantil — verde
  'verde-branca':   { label: 'Verde/Branca',   bg: 'linear-gradient(to right,#16A34A 55%,#E5E7EB 55%)',          color: '#ffffff' },
  verde:            { label: 'Verde',          bg: '#16A34A',                                                    color: '#ffffff' },
  'verde-preta':    { label: 'Verde/Preta',    bg: 'linear-gradient(to right,#16A34A 55%,#111827 55%)',          color: '#ffffff' },
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 700,
      letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 5,
    }}>
      {children}
    </div>
  );
}

function SaveBtn({ saving, saved, disabled, onClick, label = 'Guardar' }: {
  saving: boolean; saved: boolean; disabled?: boolean; onClick: () => void; label?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
      <button
        onClick={onClick}
        disabled={saving || disabled}
        style={{
          background: saved ? '#22C55E' : saving ? '#aaa' : GB.red,
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '9px 22px', color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: (saving || disabled) ? 'not-allowed' : 'pointer',
          opacity: disabled && !saving ? 0.5 : 1,
          transition: 'background 0.2s',
        }}
      >
        {saving ? '⟳ A guardar...' : saved ? '✓ Guardado!' : label}
      </button>
    </div>
  );
}

// ─── Avatar upload section ────────────────────────────────────────────────────
function AvatarSection({ avatarUrl, onUploaded }: {
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const { user } = useAuth();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [err,       setErr]       = useState('');
  const [hover,     setHover]     = useState(false);

  // Sync if parent passes a new URL (e.g. first load)
  useEffect(() => { setPreview(avatarUrl); }, [avatarUrl]);

  const rt = user ? (roleThemes[user.role] || roleThemes.aluno) : roleThemes.aluno;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setErr('');
    setUploading(true);

    try {
      if (!isConfigured) {
        // Demo mode — just show preview
        await new Promise(r => setTimeout(r, 600));
        onUploaded(objectUrl);
        setUploading(false);
        return;
      }

      const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      // Upsert (remove old then insert, or use upsert option)
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw new Error(upErr.message);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Bust cache with timestamp param
      const urlWithTs = `${publicUrl}?t=${Date.now()}`;

      // Save to profiles.avatar_url
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setPreview(urlWithTs);
      onUploaded(urlWithTs);
    } catch (e: any) {
      setErr(e.message || 'Erro ao fazer upload.');
      setPreview(avatarUrl); // revert preview
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const initials = user?.nome?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      {/* Avatar circle with upload overlay */}
      <div
        style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: preview ? 'transparent' : rt.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          border: `3px solid ${rt.accent}`,
          boxShadow: hover ? `0 0 0 4px ${rt.accent}33` : 'none',
          transition: 'box-shadow 0.2s',
        }}>
          {preview ? (
            <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{initials}</span>
          )}
        </div>

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hover || uploading ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: uploading ? 16 : 20, color: '#fff' }}>
            {uploading ? '⟳' : '📷'}
          </span>
        </div>
      </div>

      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          {user?.nome}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
          {user?.email}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '7px 14px',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'A enviar...' : 'Alterar foto'}
        </button>
        {err && <div style={{ color: GB.red, fontSize: 11.5, marginTop: 6, fontWeight: 600 }}>⚠ {err}</div>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Dados pessoais section ───────────────────────────────────────────────────
function DadosPessoaisSection() {
  const { user, refreshProfile } = useAuth();
  const [nome,     setNome]     = useState(user?.nome     || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');

  const save = async () => {
    if (!user) return;
    if (!nome.trim()) return setErr('O nome não pode estar vazio.');
    setErr(''); setSaving(true);
    try {
      if (isConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update({ nome: nome.trim(), telefone: telefone.trim() || null })
          .eq('id', user.id);
        if (error) throw new Error(error.message);
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message || 'Erro ao guardar.');
    }
    setSaving(false);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>Nome completo</FieldLabel>
          <input value={nome} onChange={e => setNome(e.target.value)} style={INP} placeholder="O teu nome" />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <input value={user?.email || ''} disabled style={{ ...INP, opacity: 0.5, cursor: 'not-allowed' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 4 }}>
            O email não pode ser alterado aqui.
          </div>
        </div>
        <div>
          <FieldLabel>Telefone</FieldLabel>
          <input value={telefone} onChange={e => setTelefone(e.target.value)} style={INP} placeholder="+351 9xx xxx xxx" />
        </div>
      </div>
      {err && <div style={{ color: GB.red, fontSize: 11.5, marginTop: 10, fontWeight: 600 }}>⚠ {err}</div>}
      <SaveBtn saving={saving} saved={saved} onClick={save} />
    </>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection() {
  const [pw1,    setPw1]    = useState('');
  const [pw2,    setPw2]    = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState('');

  const save = async () => {
    if (pw1.length < 6) return setErr('Mínimo 6 caracteres.');
    if (pw1 !== pw2)    return setErr('As passwords não coincidem.');
    setErr(''); setSaving(true);
    try {
      if (isConfigured) {
        const { error } = await supabase.auth.updateUser({ password: pw1 });
        if (error) throw new Error(error.message);
      }
      setPw1(''); setPw2('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e.message || 'Erro ao alterar password.');
    }
    setSaving(false);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <FieldLabel>Nova password</FieldLabel>
          <input
            type="password" value={pw1} onChange={e => setPw1(e.target.value)}
            style={INP} placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <FieldLabel>Confirmar password</FieldLabel>
          <input
            type="password" value={pw2} onChange={e => setPw2(e.target.value)}
            style={INP} placeholder="Repete a password"
          />
        </div>
      </div>
      {err && <div style={{ color: GB.red, fontSize: 11.5, marginTop: 10, fontWeight: 600 }}>⚠ {err}</div>}
      <SaveBtn saving={saving} saved={saved} onClick={save} label="Alterar Password" />
    </>
  );
}

// ─── Aluno info section ───────────────────────────────────────────────────────
type AlunoInfo = {
  faixa: Belt;
  grau: number;
  plano: string;
  data_matricula: string;
  status: string;
};

function AlunoSection() {
  const { user } = useAuth();
  const [info,    setInfo]    = useState<AlunoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isConfigured) { setLoading(false); return; }
    supabase
      .from('alunos')
      .select('faixa, grau, plano, data_matricula, status')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setInfo(data as AlunoInfo);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>A carregar...</div>;
  }
  if (!info) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem informação de matrícula disponível.</div>;
  }

  const belt    = BELT_META[info.faixa] || BELT_META.branca;
  const graus   = Array.from({ length: 4 }, (_, i) => i < info.grau);
  const dataFmt = info.data_matricula
    ? new Date(info.data_matricula).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
      {/* Faixa */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          Faixa
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: belt.bg, color: belt.color,
          padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13,
          border: info.faixa === 'branca' ? '1px solid var(--border)' : 'none',
        }}>
          🥋 {belt.label}
        </div>
      </div>

      {/* Grau */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          Grau
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {graus.map((filled, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: filled ? belt.bg : 'var(--bg-card)',
              border: `2px solid ${filled ? belt.bg : 'var(--border)'}`,
            }} />
          ))}
          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>
            {info.grau}/4
          </span>
        </div>
      </div>

      {/* Plano */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          Plano
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
          {info.plano || '—'}
        </div>
      </div>

      {/* Data matrícula */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '14px 16px',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
          Membro desde
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>
          {dataFmt}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, refreshProfile, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar_url from DB on mount
  useEffect(() => {
    if (!user || !isConfigured) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
          O meu Perfil
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Gere os teus dados pessoais e preferências de conta.
        </p>
      </div>

      {/* Avatar */}
      <SectionCard title="Foto de perfil" icon="🖼️">
        <AvatarSection
          avatarUrl={avatarUrl}
          onUploaded={(url) => {
            setAvatarUrl(url);
            refreshProfile();
          }}
        />
      </SectionCard>

      {/* Dados pessoais */}
      <SectionCard title="Dados pessoais" icon="👤">
        <DadosPessoaisSection />
      </SectionCard>

      {/* Password */}
      <SectionCard title="Alterar password" icon="🔒">
        <PasswordSection />
      </SectionCard>

      {/* Aluno-only: plano + faixa */}
      {user.role === 'aluno' && (
        <SectionCard title="A minha matrícula" icon="🥋">
          <AlunoSection />
        </SectionCard>
      )}

      {/* Logout */}
      <div style={{ marginTop: 8, marginBottom: 32 }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-muted)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = GB.red;
            (e.currentTarget as HTMLButtonElement).style.color = GB.red;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <span style={{ fontSize: 15 }}>⎋</span>
          Terminar sessão
        </button>
      </div>
    </div>
  );
}
