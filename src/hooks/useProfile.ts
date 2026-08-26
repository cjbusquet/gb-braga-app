import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

export const PROFILE_QUERY_KEYS = {
  avatar: (userId: string) => ['profiles', 'avatar', userId] as const,
  staffList: () => ['profiles', 'staff'] as const,
};

export interface ProfilePatch {
  nome?: string;
  telefone?: string | null;
  nif?: string | null;
  morada?: string | null;
  faixa?: string | null;
  ativo?: boolean;
  avatar_url?: string;
  matricula_completa?: boolean;
}

export interface StaffMember {
  id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string;
  nif: string;
  morada: string;
  faixa: string;
  ativo: boolean;
}

// ── Avatar URL (profiles.avatar_url by id) ────────────────────────────────
async function fetchProfileAvatar(userId: string): Promise<string | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.avatar_url ?? null;
}

export function useProfileAvatarQuery(userId: string | undefined) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.avatar(userId ?? ''),
    queryFn: () => fetchProfileAvatar(userId as string),
    enabled: !!userId,
  });
}

// ── Staff list (profiles with an admin/staff role) ─────────────────────────
async function fetchStaffList(): Promise<StaffMember[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, role, telefone, nif, morada, faixa, ativo')
    .in('role', ['superadmin', 'admin', 'professor', 'atendimento'])
    .order('role')
    .order('nome');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    nome: r.nome ?? '',
    email: r.email ?? '',
    role: r.role ?? '',
    telefone: r.telefone ?? '',
    nif: r.nif ?? '',
    morada: r.morada ?? '',
    faixa: r.faixa ?? '',
    ativo: r.ativo !== false,
  }));
}

export function useStaffListQuery() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.staffList(),
    queryFn: fetchStaffList,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProfilePatch }) => {
      if (!isConfigured) return;
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.avatar(id) });
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.staffList() });
    },
  });
}

/** Uploads a new avatar image and stores its public URL on the profile. Returns the final URL. */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }): Promise<string> => {
      if (!isConfigured) {
        // Demo mode — no storage/DB round-trip, just echo back a local preview URL.
        await new Promise((r) => setTimeout(r, 600));
        return URL.createObjectURL(file);
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (profErr) throw new Error(profErr.message);

      return `${publicUrl}?t=${Date.now()}`;
    },
    onSuccess: (_url, { userId }) => {
      qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.avatar(userId) });
    },
  });
}
