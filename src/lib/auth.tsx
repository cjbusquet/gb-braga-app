import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { supabase, isConfigured } from './supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  // ── Supabase auth: restore session on load ───────────────
  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }

    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email!);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(id: string, email: string): Promise<User> { // eslint-disable-line
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email, role, matricula_completa, telefone, created_at')
        .eq('id', id)
        .single();

      if (data) {
        return {
          id: data.id,
          nome: data.nome || email.split('@')[0],
          email: data.email,
          role: data.role as UserRole,
          matriculaCompleta: data.matricula_completa,
          telefone: data.telefone,
          createdAt: data.created_at,
        };
      }
    } catch (_) {}
    // fallback
    return { id, nome: email.split('@')[0], email, role: 'aluno', createdAt: new Date().toISOString() };
  }

  // ── Login ────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    // Supabase real
    if (isConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      return true;
    }

    // Demo fallback (sem Supabase)
    const found = mockUsers.find(u => u.email === email);
    if (found) { setUser(found); return true; }
    return false;
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = async () => {
    if (isConfigured) await supabase.auth.signOut();
    setUser(null);
  };

  // ── Switch role (apenas demo) ────────────────────────────
  const switchRole = (role: UserRole) => {
    if (isConfigured) return; // não disponível em produção
    const found = mockUsers.find(u => u.role === role);
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
