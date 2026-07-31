/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { supabase, isConfigured } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (email: string, password: string, nome: string) => Promise<{ ok: boolean; confirmEmail: boolean; message: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  /** True when user clicked a staff invite recovery link and must set their password */
  pendingPasswordSetup: boolean;
  completePasswordSetup: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  /** Set when a session (e.g. one already open in this tab) belongs to a
   * since-suspended/inactive aluno — loadProfile signs them out and
   * surfaces this instead of leaving the login screen unexplained. */
  blockedMessage: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null);
  const [loading, setLoading]                   = useState(isConfigured);
  const [pendingPasswordSetup, setPending]      = useState(false);
  const [blockedMessage, setBlockedMessage]     = useState<string | null>(null);

  const mapProfile = (data: any, email: string): User => ({
    id:               data.id,
    nome:             data.nome || email.split('@')[0],
    email:            data.email,
    role:             data.role as UserRole,
    matriculaCompleta: data.matricula_completa,
    telefone:         data.telefone,
    avatar:           data.avatar_url ?? undefined,
    createdAt:        data.created_at,
  });

  const loadProfile = useCallback(async (id: string, email: string): Promise<{ blocked?: string }> => {
    try {
      // ── 1. Try to read existing profile ──────────────────────────
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email, role, matricula_completa, telefone, created_at, avatar_url')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        // Suspenso/inativo: alunos.status is DB-enforced (banned_until
        // sync + RLS on my_aluno_id()) — this is UX only, catching a
        // session that was already open when staff changed the status,
        // since its access_token is still valid until it expires.
        if (data.role === 'aluno') {
          const { data: alunoRow } = await supabase
            .from('alunos')
            .select('status')
            .eq('email', email)
            .maybeSingle();
          if (alunoRow && alunoRow.status !== 'ativo') {
            const message = alunoRow.status === 'suspenso'
              ? 'A tua conta foi suspensa. Contacta a academia para mais informações.'
              : 'A tua conta está inativa. Contacta a academia para mais informações.';
            await supabase.auth.signOut();
            setUser(null);
            setBlockedMessage(message);
            return { blocked: message };
          }
        }
        setBlockedMessage(null);
        setUser(mapProfile(data, email));
        return {};
      }

      // ── 2. Profile missing — trigger may not exist or failed.
      //       INSERT only (ignoreDuplicates) — never overwrite an existing row,
      //       which would reset matricula_completa back to false.
      console.warn('Profile not found — attempting self-create for', email);
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .upsert({ id, nome: email.split('@')[0], email, role: 'aluno', matricula_completa: false },
                 { onConflict: 'id', ignoreDuplicates: true })
        .select('id, nome, email, role, matricula_completa, telefone, created_at')
        .maybeSingle();

      if (created) {
        setUser(mapProfile(created, email));
        return {};
      }

      // Self-create also failed — most likely an orphaned session: this
      // auth.users id has no profile, but its email now belongs to a
      // different, current account (e.g. the underlying user was deleted
      // and recreated). There's no safe row to fall back to here.
      // Fabricating a fake local profile used to leave people stranded in
      // the enrollment flow with no way back — sign out cleanly instead
      // so the login screen is reachable again.
      console.error('Profile self-create failed, signing out orphaned session:', createErr?.message);
      await supabase.auth.signOut();
      setUser(null);
      return {};
    } catch (e) {
      console.error('loadProfile error, signing out orphaned session:', e);
      await supabase.auth.signOut();
      setUser(null);
      return {};
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Staff member clicked their invite link — let them set a password
          // Load their profile so user is populated, but keep pendingPasswordSetup=true
          if (session?.user) {
            loadProfile(session.user.id, session.user.email!);
          }
          setPending(true);
          return;
        }
        if (session?.user) {
          loadProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    // Demo mode — no Supabase
    if (!isConfigured) {
      const found = mockUsers.find(u => u.email === email);
      if (found) { setUser(found); return { ok: true }; }
      return { ok: false };
    }

    // Supabase login
    try {
      setBlockedMessage(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        // GoTrue rejects a banned_until user before issuing any session
        // ("User is banned") — this is the alunos.status='suspenso'/
        // 'inativo' sync from sincronizar_ban_aluno() kicking in.
        if (error.message.toLowerCase().includes('banned')) {
          return { ok: false, message: 'A tua conta está bloqueada. Contacta a academia para mais informações.' };
        }
        return { ok: false };
      }
      if (data?.user) {
        const result = await loadProfile(data.user.id, data.user.email!);
        if (result.blocked) return { ok: false, message: result.blocked };
        return { ok: true };
      }
      return { ok: false };
    } catch (e) {
      console.error('Login exception:', e);
      return { ok: false };
    }
  };

  const register = async (email: string, password: string, nome: string): Promise<{ ok: boolean; confirmEmail: boolean; message: string }> => {
    // Demo mode — simulate registration
    if (!isConfigured) {
      setUser({ id: crypto.randomUUID(), nome, email, role: 'aluno', matriculaCompleta: false, createdAt: new Date().toISOString() });
      return { ok: true, confirmEmail: false, message: '' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      });
      if (error) return { ok: false, confirmEmail: false, message: error.message };
      if (data.user) {
        if (data.session) {
          // Email confirmation disabled → user is immediately active
          await loadProfile(data.user.id, data.user.email!);
          return { ok: true, confirmEmail: false, message: '' };
        }
        // Email confirmation required
        return { ok: true, confirmEmail: true, message: '' };
      }
      return { ok: false, confirmEmail: false, message: 'Erro desconhecido. Tente novamente.' };
    } catch (e) {
      return { ok: false, confirmEmail: false, message: String(e) };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!isConfigured) return;
    // Re-read the profiles row so matriculaCompleta etc. reflect latest DB state
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadProfile(session.user.id, session.user.email!);
    }
  }, [loadProfile]);

  const completePasswordSetup = async (newPassword: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, message: error.message };
      setPending(false);
      return { ok: true, message: '' };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  };

  const logout = async () => {
    if (isConfigured) await supabase.auth.signOut();
    setUser(null);
    setPending(false);
  };

  const switchRole = (role: UserRole) => {
    if (isConfigured) return;
    const found = mockUsers.find(u => u.role === role);
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, switchRole, refreshProfile, loading, pendingPasswordSetup, completePasswordSetup, blockedMessage }}>
      {loading ? (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:40, height:40, border:'3px solid #f0f0f0', borderTop:'3px solid #C8102E', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
            <div style={{ color:'#999', fontSize:13 }}>A carregar...</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
