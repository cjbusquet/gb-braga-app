/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { supabase, isConfigured } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, nome: string) => Promise<{ ok: boolean; confirmEmail: boolean; message: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  const loadProfile = useCallback(async (id: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, role, matricula_completa, telefone, created_at')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setUser({
          id: data.id,
          nome: data.nome || email.split('@')[0],
          email: data.email,
          role: data.role as UserRole,
          matriculaCompleta: data.matricula_completa,
          telefone: data.telefone,
          createdAt: data.created_at,
        });
      } else {
        // Profile not found or RLS blocked — create minimal user from email
        console.warn('Profile not found, using email fallback. Error:', error?.message);
        setUser({
          id,
          nome: email.split('@')[0],
          email,
          role: 'aluno',
          matriculaCompleta: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('loadProfile error:', e);
      setUser({ id, nome: email.split('@')[0], email, role: 'aluno', matriculaCompleta: false, createdAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
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
      (_event, session) => {
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

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo mode — no Supabase
    if (!isConfigured) {
      const found = mockUsers.find(u => u.email === email);
      if (found) { setUser(found); return true; }
      return false;
    }

    // Supabase login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      if (data?.user) {
        await loadProfile(data.user.id, data.user.email!);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login exception:', e);
      return false;
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

  const logout = async () => {
    if (isConfigured) await supabase.auth.signOut();
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (isConfigured) return;
    const found = mockUsers.find(u => u.role === role);
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, switchRole, refreshProfile, loading }}>
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
