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
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session?.user) {
          loadProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(id: string, email: string) {
    try {
      // Use service role bypass via RPC or direct query
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
  }

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
    <AuthContext.Provider value={{ user, login, logout, switchRole, loading }}>
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
