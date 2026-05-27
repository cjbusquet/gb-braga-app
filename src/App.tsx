import { useState, useEffect } from 'react';
import type React from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import type { UserRole } from './types';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import Dashboard from './pages/admin/Dashboard';
import ConfigPage from './pages/admin/ConfigPage';
import AlunosPage from './pages/admin/AlunosPage';
import TurmasPage from './pages/admin/TurmasPage';
import CheckinPage from './pages/admin/CheckinPage';
import FinanceiroPage from './pages/admin/FinanceiroPage';
import GraduacaoPage from './pages/admin/GraduacaoPage';
import ComunicacaoPage from './pages/admin/ComunicacaoPage';
import ContratosPage from './pages/admin/ContratosPage';
import IntegracoesPage from './pages/admin/IntegracoesPage';
import ChatPage from './pages/admin/ChatPage';
import { SuperAdminDashboard, RelatoriosPage } from './pages/admin/SpecialPages';
import FluxoMatricula from './pages/matricula/FluxoMatricula';
import PendentesNumerario from './pages/admin/PendentesNumerario';
import ProfessorView from './pages/professor/ProfessorView';
import PortalAluno from './pages/aluno/PortalAluno';
import MinhasAulas from './pages/aluno/MinhasAulas';
import MinhaEvolucao from './pages/aluno/MinhaEvolucao';
import MeuFinanceiro from './pages/aluno/MeuFinanceiro';
import Conteudo from './pages/aluno/Conteudo';
import Mensagens from './pages/aluno/Mensagens';
import MeuCheckin from './pages/aluno/MeuCheckin';
import PerfilPage from './pages/PerfilPage';
import ModulosPage from './pages/admin/ModulosPage';
import { ModulosProvider, useModulos } from './lib/useModulos';

// ─── Role-based page access control ──────────────────────────────────────────
const PAGE_ROLES: Record<string, UserRole[]> = {
  dashboard:     ['superadmin','admin','atendimento','professor'],
  alunos:        ['superadmin','admin','atendimento','professor'],
  turmas:        ['superadmin','admin','atendimento','professor'],
  checkin:       ['superadmin','admin','atendimento','professor'],
  financeiro:    ['superadmin','admin'],
  graduacao:     ['superadmin','admin','professor'],
  comunicacao:   ['superadmin','admin','atendimento'],
  chat:          ['superadmin','admin','atendimento'],
  contratos:     ['superadmin','admin'],
  relatorios:    ['superadmin','admin'],
  integracoes:   ['superadmin','admin'],
  config:        ['superadmin','admin'],
  numerario:     ['superadmin'],
  matricula:     ['superadmin','admin'],
  modulos:       ['superadmin'],
  portal:        ['aluno'],
  'meu-checkin': ['aluno'],
  'minhas-aulas':['aluno'],
  evolucao:      ['aluno'],
  'meu-financeiro':['aluno'],
  conteudo:      ['aluno'],
  mensagens:     ['aluno'],
  perfil:        ['superadmin','admin','atendimento','professor','aluno'],
};

function canAccess(role: UserRole, page: string): boolean {
  const allowed = PAGE_ROLES[page];
  if (!allowed) return false;
  return allowed.includes(role);
}

function canAccessModule(page: string, isActive: (id: string) => boolean): boolean {
  // Pages without a corresponding module (core pages) are always accessible
  return isActive(page);
}

// ─── Password Setup Screen (staff invite flow) ────────────────────────────────
function SetPasswordScreen() {
  const { completePasswordSetup, logout } = useAuth();
  const [pw, setPw]       = useState('');
  const [pw2, setPw2]     = useState('');
  const [err, setErr]     = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState(false);

  const handle = async () => {
    if (pw.length < 6)       return setErr('Mínimo 6 caracteres.');
    if (pw !== pw2)           return setErr('As passwords não coincidem.');
    setSaving(true); setErr('');
    const { ok, message } = await completePasswordSetup(pw);
    setSaving(false);
    if (!ok) return setErr(message);
    setDone(true);
  };

  const INP: React.CSSProperties = { width: '100%', border: '1.5px solid #E2E0DB', borderRadius: 8, padding: '11px 13px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111', boxSizing: 'border-box' };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F4' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase', color: '#111', marginBottom: 8 }}>Password definida!</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>A tua conta está pronta. Bem-vindo à equipa Gracie Barra Braga.</p>
        <button onClick={() => window.location.reload()} style={{ background: '#C8102E', border: 'none', borderRadius: 10, padding: '12px 32px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Entrar na plataforma →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F4' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, background: '#C8102E', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔑</div>
          <div>
            <div style={{ fontFamily: "'Arial Black',sans-serif", fontWeight: 900, fontSize: 16, textTransform: 'uppercase', color: '#111' }}>Define a tua password</div>
            <div style={{ color: '#999', fontSize: 12 }}>Gracie Barra Braga — Acesso de equipa</div>
          </div>
        </div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 22, lineHeight: 1.6, background: 'rgba(200,16,46,0.04)', border: '1px solid rgba(200,16,46,0.12)', borderRadius: 8, padding: '10px 14px' }}>
          A tua conta foi criada pelo administrador. Escolhe a password que vais usar para aceder à plataforma.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#666', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 5 }}>Nova Password *</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" style={INP} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#666', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 5 }}>Confirmar Password *</label>
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repete a password" style={INP} />
        </div>
        {err && <div style={{ color: '#C8102E', fontSize: 12, marginBottom: 14, fontWeight: 600 }}>{err}</div>}
        <button onClick={handle} disabled={saving} style={{ width: '100%', background: saving ? '#aaa' : '#C8102E', border: 'none', borderRadius: 10, padding: '13px', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: "'Arial Black',sans-serif", textTransform: 'uppercase' as const, letterSpacing: '1px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(200,16,46,0.3)' }}>
          {saving ? 'A guardar...' : 'Confirmar Password →'}
        </button>
        <button onClick={() => logout()} style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid #E2E0DB', borderRadius: 10, padding: '10px', color: '#999', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, refreshProfile, pendingPasswordSetup } = useAuth();
  const { isActive } = useModulos();
  const [currentPage, setCurrentPage] = useState('');
  const [registering, setRegistering] = useState(false);

  // ── Back button support ───────────────────────────────────────────────────
  // Must be declared before any conditional returns (Rules of Hooks).
  // Guards internally with `if (!user)` so it's always called.
  useEffect(() => {
    if (!user) return;
    const defPage = user.role === 'aluno' ? 'portal' : 'dashboard';

    // Set a base history entry so the very first back press doesn't exit the app
    history.replaceState({ page: defPage }, '', location.pathname + location.search);

    const onPop = (e: PopStateEvent) => {
      const p: string | undefined = e.state?.page;
      if (p && canAccess(user.role, p)) {
        setCurrentPage(p);
      } else {
        // No more in-app history — land on default (next back will exit as expected)
        history.pushState({ page: defPage }, '', location.pathname + location.search);
        setCurrentPage(defPage);
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // re-run only when the logged-in user changes

  // Staff invite: user clicked a recovery link — must set their own password first
  if (pendingPasswordSetup) {
    return <SetPasswordScreen />;
  }

  // Keep the enrollment flow mounted even after signUp() fires onAuthStateChange.
  // If we checked !user first, the Completo component would be replaced mid-flight
  // before it finishes saving alunos/contratos and setting matricula_completa.
  if (registering) {
    return (
      <FluxoMatricula
        registerMode
        onVoltar={() => setRegistering(false)}
        onConcludo={async () => {
          // Re-read the profile so matriculaCompleta is updated before unmounting
          await refreshProfile();
          setRegistering(false);
        }}
      />
    );
  }

  if (!user) {
    return <LoginPage onRegister={() => setRegistering(true)} />;
  }

  const defaultPage = user.role === 'aluno' ? 'portal' : 'dashboard';
  const page = currentPage || defaultPage;

  // Security: redirect if user lacks role access OR module is disabled
  const safePage = (canAccess(user.role, page) && canAccessModule(page, isActive))
    ? page
    : defaultPage;

  const handleNavigate = (p: string) => {
    if (canAccess(user.role, p)) {
      // Push a history entry so the mobile back button navigates within the app
      history.pushState({ page: p }, '', location.pathname + location.search);
      setCurrentPage(p);
    }
  };

  const renderPage = () => {
    // Only alunos need to complete enrollment
    // Staff (superadmin/admin/professor/atendimento) go straight to dashboard
    const isStaff = ['superadmin','admin','professor','atendimento'].includes(user.role);
    if (!isStaff && !user.matriculaCompleta) {
      // onConcludo refreshes the profile so matriculaCompleta becomes true
      // and this block is no longer entered on the next render.
      return <FluxoMatricula onConcludo={refreshProfile} />;
    }
    if (user.role === 'aluno') {
      switch (safePage) {
        case 'portal':          return <PortalAluno onNavigate={handleNavigate}/>;
        case 'meu-checkin':     return <MeuCheckin />;
        case 'minhas-aulas':    return <MinhasAulas />;
        case 'evolucao':        return <MinhaEvolucao />;
        case 'meu-financeiro':  return <MeuFinanceiro />;
        case 'conteudo':        return <Conteudo />;
        case 'mensagens':       return <Mensagens />;
        case 'perfil':          return <PerfilPage />;
        default:                return <PortalAluno onNavigate={handleNavigate}/>;
      }
    }

    // Professor routes — dedicated view for their pages
    if (user.role === 'professor') {
      switch (safePage) {
        case 'checkin':   return <CheckinPage />;
        case 'graduacao': return <GraduacaoPage />;
        case 'perfil':    return <PerfilPage />;
        default:          return <ProfessorView />;
      }
    }

    // Superadmin dashboard
    if (user.role === 'superadmin' && safePage === 'dashboard') {
      return <SuperAdminDashboard />;
    }

    // Admin + Superadmin + Atendimento routes
    switch (safePage) {
      case 'dashboard':    return <Dashboard />;
      case 'alunos':       return <AlunosPage />;
      case 'turmas':       return <TurmasPage />;
      case 'checkin':      return <CheckinPage />;
      case 'financeiro':   return <FinanceiroPage />;
      case 'graduacao':    return <GraduacaoPage />;
      case 'comunicacao':  return <ComunicacaoPage />;
      case 'chat':         return <ChatPage />;
      case 'contratos':    return <ContratosPage />;
      case 'relatorios':   return <RelatoriosPage />;
      case 'integracoes':  return <IntegracoesPage />;
      case 'config':       return <ConfigPage />;
      case 'numerario':    return <PendentesNumerario />;
      case 'matricula':    return <FluxoMatricula embedded />;
      case 'modulos':      return <ModulosPage />;
      case 'perfil':       return <PerfilPage />;
      default:             return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={safePage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModulosProvider>
        <AppContent />
      </ModulosProvider>
    </AuthProvider>
  );
}
