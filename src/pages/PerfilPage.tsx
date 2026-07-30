import {
  AcademicCapIcon,
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Ico,
  IdentificationIcon,
  KeyIcon,
  PhotoIcon,
  UserIcon,
} from '../lib/icons';
import { roleThemes } from '../lib/gbBrand';
import { isConfigured, supabase } from '../lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';

import type { Belt } from '../types';
import type { HeroIcon } from '../lib/icons';
import type React from 'react';
import { useAuth } from '../lib/auth';
import { useProfileAvatarQuery, useUpdateProfile, useUploadAvatar } from '../hooks/useProfile';
import { useAlunoInfoByEmailQuery } from '../hooks/useAlunoInfo';

// ─── Belt metadata (derived from gbBrand beltConfig) ─────────────────────────
// Mapped to the Belt type keys — bicolor belts use CSS gradients as bg
const BELT_META: Record<Belt, { label: string; bg: string; color: string }> = {
  // Adulto
  branca: { label: 'Branca', bg: '#E5E7EB', color: '#111111' },
  azul: { label: 'Azul', bg: '#2563EB', color: '#ffffff' },
  roxa: { label: 'Roxa', bg: '#7C3AED', color: '#ffffff' },
  marrom: { label: 'Marrom', bg: '#92400E', color: '#ffffff' },
  preta: { label: 'Preta', bg: '#111827', color: '#ffffff' },
  vermelha: { label: 'Vermelha', bg: '#C8102E', color: '#ffffff' },
  // Infantil — cinza
  'cinza-branca': {
    label: 'Cinza/Branca',
    bg: 'linear-gradient(to right,#888888 55%,#E5E7EB 55%)',
    color: '#333333',
  },
  cinza: { label: 'Cinza', bg: '#888888', color: '#ffffff' },
  'cinza-preta': {
    label: 'Cinza/Preta',
    bg: 'linear-gradient(to right,#888888 55%,#111827 55%)',
    color: '#ffffff',
  },
  // Infantil — amarela
  'amarela-branca': {
    label: 'Amarela/Branca',
    bg: 'linear-gradient(to right,#EAB308 55%,#E5E7EB 55%)',
    color: '#333333',
  },
  amarela: { label: 'Amarela', bg: '#EAB308', color: '#111111' },
  'amarela-preta': {
    label: 'Amarela/Preta',
    bg: 'linear-gradient(to right,#EAB308 55%,#111827 55%)',
    color: '#111111',
  },
  // Infantil — laranja
  'laranja-branca': {
    label: 'Laranja/Branca',
    bg: 'linear-gradient(to right,#EA580C 55%,#E5E7EB 55%)',
    color: '#ffffff',
  },
  laranja: { label: 'Laranja', bg: '#F97316', color: '#ffffff' },
  'laranja-preta': {
    label: 'Laranja/Preta',
    bg: 'linear-gradient(to right,#EA580C 55%,#111827 55%)',
    color: '#ffffff',
  },
  // Infantil — verde
  'verde-branca': {
    label: 'Verde/Branca',
    bg: 'linear-gradient(to right,#16A34A 55%,#E5E7EB 55%)',
    color: '#ffffff',
  },
  verde: { label: 'Verde', bg: '#16A34A', color: '#ffffff' },
  'verde-preta': {
    label: 'Verde/Preta',
    bg: 'linear-gradient(to right,#16A34A 55%,#111827 55%)',
    color: '#ffffff',
  },
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const INP_CLASS = 'block box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: HeroIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden mb-4 rounded-lg border border-border bg-card">
      <div className="flex gap-2.5 items-center py-3.5 px-5 border-b border-border">
        <Ico icon={icon} />
        <span className="text-sm font-bold text-primary">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10.5px] font-bold tracking-[0.8px] uppercase text-muted">
      {children}
    </div>
  );
}

function SaveBtn({
  saving,
  saved,
  disabled,
  onClick,
  label = 'Guardar',
}: {
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <div className="flex justify-end mt-4">
      <button
        onClick={onClick}
        disabled={saving || disabled}
        className={[
          'py-2 px-[22px] min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none transition-all duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          saving || disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:brightness-90 active:scale-[0.98]',
          disabled && !saving ? 'opacity-50' : 'opacity-100',
        ].join(' ')}
        style={{
          background: saved ? '#22C55E' : saving ? '#aaa' : 'var(--gb-red)',
          ['--tw-ring-color' as string]: saved ? '#22C55E' : 'var(--gb-red)',
        }}
      >
        {saving ? (
          <span className="inline-flex gap-1.5 items-center">
            <Ico icon={ArrowPathIcon} sm />A guardar...
          </span>
        ) : saved ? (
          <span className="inline-flex gap-1.5 items-center">
            <Ico icon={CheckCircleIcon} sm />
            Guardado!
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

// ─── Avatar upload section ────────────────────────────────────────────────────
function AvatarSection({
  avatarUrl,
  onUploaded,
}: {
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [err, setErr] = useState('');
  const [hover, setHover] = useState(false);
  const uploadAvatar = useUploadAvatar();
  const uploading = uploadAvatar.isPending;

  // Sync if parent passes a new URL (e.g. first load)
  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  const rt = user
    ? roleThemes[user.role] || roleThemes.aluno
    : roleThemes.aluno;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setErr('');

    try {
      const url = await uploadAvatar.mutateAsync({ userId: user.id, file });
      setPreview(url);
      onUploaded(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao fazer upload.');
      setPreview(avatarUrl); // revert preview
    }
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const initials =
    user?.nome
      ?.split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <div className="flex flex-wrap gap-5 items-center">
      {/* Avatar circle with upload overlay */}
      <div
        className="relative shrink-0 cursor-pointer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileRef.current?.click()}
      >
        <div
          className="overflow-hidden relative w-[88px] h-[88px] rounded-full border-[3px] transition-shadow"
          style={{
            background: preview ? 'transparent' : rt.accent,
            borderColor: rt.accent,
            boxShadow: hover ? `0 0 0 4px ${rt.accent}33` : 'none',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="block absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="flex absolute inset-0 justify-center items-center text-[28px] font-bold text-white">
              {initials}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div
          className={[
            'flex absolute inset-0 justify-center items-center rounded-full transition-opacity pointer-events-none bg-black/45',
            hover || uploading ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <span className="text-white">
            <Ico
              icon={uploading ? ArrowPathIcon : CameraIcon}
              style={{ width: uploading ? 16 : 20, height: uploading ? 16 : 20 }}
            />
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="overflow-hidden mb-1 text-[15px] font-bold whitespace-nowrap text-ellipsis text-primary">
          {user?.nome}
        </div>
        <div className="overflow-hidden mb-2.5 text-xs whitespace-nowrap text-ellipsis text-muted">
          {user?.email}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={[
            'py-1.5 px-3.5 min-h-11 sm:min-h-0 text-xs font-semibold rounded-sm border border-border bg-elevated text-secondary transition-colors duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
            uploading ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-card active:bg-card',
          ].join(' ')}
        >
          {uploading ? 'A enviar...' : 'Alterar foto'}
        </button>
        {err && (
          <div className="inline-flex gap-1.5 items-center mt-1.5 text-[11.5px] font-semibold text-gb-red">
            <Ico icon={ExclamationTriangleIcon} sm />
            {err}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Dados pessoais section ───────────────────────────────────────────────────
function DadosPessoaisSection() {
  const { user, refreshProfile } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const updateProfile = useUpdateProfile();
  const saving = updateProfile.isPending;

  const save = async () => {
    if (!user) return;
    if (!nome.trim()) return setErr('O nome não pode estar vazio.');
    setErr('');
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        patch: { nome: nome.trim(), telefone: telefone.trim() || null },
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao guardar.');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="col-span-full">
          <FieldLabel>Nome completo</FieldLabel>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={INP_CLASS}
            placeholder="O teu nome"
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            value={user?.email || ''}
            disabled
            className={[INP_CLASS, 'opacity-50 cursor-not-allowed'].join(' ')}
          />
          <div className="mt-1 text-[10.5px] text-muted">
            O email não pode ser alterado aqui.
          </div>
        </div>
        <div>
          <FieldLabel>Telefone</FieldLabel>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className={INP_CLASS}
            placeholder="+351 9xx xxx xxx"
          />
        </div>
      </div>
      {err && (
        <div className="inline-flex gap-1.5 items-center mt-2.5 text-[11.5px] font-semibold text-gb-red">
          <Ico icon={ExclamationTriangleIcon} sm />
          {err}
        </div>
      )}
      <SaveBtn saving={saving} saved={saved} onClick={save} />
    </>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection() {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (pw1.length < 6) return setErr('Mínimo 6 caracteres.');
    if (pw1 !== pw2) return setErr('As passwords não coincidem.');
    setErr('');
    setSaving(true);
    try {
      if (isConfigured) {
        const { error } = await supabase.auth.updateUser({ password: pw1 });
        if (error) throw new Error(error.message);
      }
      setPw1('');
      setPw2('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e.message || 'Erro ao alterar password.');
    }
    setSaving(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <FieldLabel>Nova password</FieldLabel>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            className={INP_CLASS}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <FieldLabel>Confirmar password</FieldLabel>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className={INP_CLASS}
            placeholder="Repete a password"
          />
        </div>
      </div>
      {err && (
        <div className="inline-flex gap-1.5 items-center mt-2.5 text-[11.5px] font-semibold text-gb-red">
          <Ico icon={ExclamationTriangleIcon} sm />
          {err}
        </div>
      )}
      <SaveBtn
        saving={saving}
        saved={saved}
        onClick={save}
        label="Alterar Password"
      />
    </>
  );
}

// ─── Aluno info section ───────────────────────────────────────────────────────
function AlunoSection() {
  const { user } = useAuth();
  const { data: info, isLoading: loading } = useAlunoInfoByEmailQuery(user?.email);

  if (loading) {
    return (
      <div className="text-[13px] text-muted">
        A carregar...
      </div>
    );
  }
  if (!info) {
    return (
      <div className="text-[13px] text-muted">
        Sem informação de matrícula disponível.
      </div>
    );
  }

  const belt = BELT_META[info.faixa] || BELT_META.branca;
  const graus = Array.from({ length: 4 }, (_, i) => i < info.grau);
  const dataFmt = info.data_matricula
    ? new Date(info.data_matricula).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
      {/* Faixa */}
      <div className="py-3.5 px-4 rounded-sm border border-border bg-elevated">
        <div className="mb-2.5 text-[10px] font-bold tracking-[0.8px] uppercase text-muted">
          Faixa
        </div>
        <div
          className="inline-flex gap-2 items-center py-1.5 px-3.5 text-[13px] font-bold rounded-md"
          style={{ background: belt.bg, color: belt.color, border: info.faixa === 'branca' ? '1px solid var(--border)' : 'none' }}
        >
          <Ico icon={AcademicCapIcon} sm /> {belt.label}
        </div>
      </div>

      {/* Grau */}
      <div className="py-3.5 px-4 rounded-sm border border-border bg-elevated">
        <div className="mb-2.5 text-[10px] font-bold tracking-[0.8px] uppercase text-muted">
          Grau
        </div>
        <div className="flex gap-1.5 items-center">
          {graus.map((filled, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full border-2"
              style={{ background: filled ? belt.bg : 'var(--bg-card)', borderColor: filled ? belt.bg : 'var(--border)' }}
            />
          ))}
          <span className="ml-1 text-[11px] text-muted">
            {info.grau}/4
          </span>
        </div>
      </div>

      {/* Plano */}
      <div className="py-3.5 px-4 rounded-sm border border-border bg-elevated">
        <div className="mb-2.5 text-[10px] font-bold tracking-[0.8px] uppercase text-muted">
          Plano
        </div>
        <div className="text-[13px] font-semibold text-primary">
          {info.plano || '—'}
        </div>
      </div>

      {/* Data matrícula */}
      <div className="py-3.5 px-4 rounded-sm border border-border bg-elevated">
        <div className="mb-2.5 text-[10px] font-bold tracking-[0.8px] uppercase text-muted">
          Membro desde
        </div>
        <div className="text-xs font-semibold text-primary">
          {dataFmt}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, refreshProfile, logout } = useAuth();
  const { data: storedAvatarUrl } = useProfileAvatarQuery(user?.id);
  // Overrides the query result immediately after a fresh upload, so the UI
  // doesn't flicker back to the stale URL while the query cache invalidates.
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const avatarUrl = avatarOverride ?? storedAvatarUrl ?? null;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-5">
        <h1 className="m-0 font-display text-[22px] font-extrabold text-primary">
          O meu Perfil
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-muted">
          Gere os teus dados pessoais e preferências de conta.
        </p>
      </div>

      {/* Avatar */}
      <SectionCard title="Foto de perfil" icon={PhotoIcon}>
        <AvatarSection
          avatarUrl={avatarUrl}
          onUploaded={(url) => {
            setAvatarOverride(url);
            refreshProfile();
          }}
        />
      </SectionCard>

      {/* Dados pessoais */}
      <SectionCard title="Dados pessoais" icon={UserIcon}>
        <DadosPessoaisSection />
      </SectionCard>

      {/* Password */}
      <SectionCard title="Alterar password" icon={KeyIcon}>
        <PasswordSection />
      </SectionCard>

      {/* Aluno-only: plano + faixa */}
      {user.role === 'aluno' && (
        <SectionCard title="A minha matrícula" icon={IdentificationIcon}>
          <AlunoSection />
        </SectionCard>
      )}

      {/* Logout */}
      <div className="mt-2 mb-8">
        <button
          onClick={logout}
          className="flex gap-2 justify-center items-center py-3 w-full text-[13px] font-semibold text-muted bg-transparent rounded-lg border border-border transition-colors duration-200 cursor-pointer hover:border-gb-red hover:text-gb-red active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
        >
          <span className="text-[15px]">⎋</span>
          Terminar sessão
        </button>
      </div>
    </div>
  );
}
