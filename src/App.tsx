import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import MinhasAulasPage from './pages/professor/MinhasAulasPage';
import AulaDetalhePage from './pages/professor/AulaDetalhePage';
import PortalAluno from './pages/aluno/PortalAluno';
import MinhasAulas from './pages/aluno/MinhasAulas';
import MinhaEvolucao from './pages/aluno/MinhaEvolucao';
import MeuFinanceiro from './pages/aluno/MeuFinanceiro';
import Conteudo from './pages/aluno/Conteudo';
import Mensagens from './pages/aluno/Mensagens';
import MeuCheckin from './pages/aluno/MeuCheckin';
import PerfilPage from './pages/PerfilPage';
import ModulosPage from './pages/admin/ModulosPage';
import ProfessoresPage from './pages/admin/ProfessoresPage';
import { ModulosProvider, useModulos } from './lib/useModulos';
import { ToastProvider } from './components/common/Toast';
import Button from './components/common/Button';
import { Ico, ArrowPathIcon, CheckCircleIcon, ClockIcon, KeyIcon } from './lib/icons';
import { usePedidosNumerarioQuery, type PedidoNumerario } from './hooks/usePedidosNumerario';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

// ─── Role-based page access control ──────────────────────────────────────────
const PAGE_ROLES: Record<string, UserRole[]> = {
  dashboard:     ['superadmin','admin','atendimento','professor'],
  alunos:        ['superadmin','admin','atendimento','professor'],
  turmas:        ['superadmin','admin','atendimento','professor'],
  checkin:       ['superadmin','admin','atendimento','professor'],
  financeiro:    ['superadmin','admin'],
  graduacao:     ['superadmin','admin','professor'],
  aulas:         ['professor'],
  'aula-detalhe':['professor'],
  comunicacao:   ['superadmin','admin','atendimento'],
  chat:          ['superadmin','admin','atendimento'],
  contratos:     ['superadmin','admin'],
  relatorios:    ['superadmin','admin'],
  integracoes:   ['superadmin','admin'],
  config:        ['superadmin','admin'],
  numerario:     ['superadmin'],
  professores:   ['superadmin'],
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
const FIELD_CLASS = 'block box-border w-full py-2.5 px-3.5 font-ui text-sm rounded-lg border-[1.5px] outline-none transition-all duration-200 border-border bg-white text-primary min-h-11 sm:min-h-0 focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[11px] font-bold tracking-[0.8px] uppercase text-secondary';

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

  if (done) return (
    <div className="flex justify-center items-center py-8 px-4 min-h-screen bg-base">
      <div className="p-8 w-full max-w-[400px] text-center rounded-2xl border border-border bg-white">
        <div className="mb-4 text-gb-green"><Ico icon={CheckCircleIcon} style={{ width: 48, height: 48 }} /></div>
        <h2 className="mb-2 font-display text-lg font-extrabold uppercase text-primary">Password definida!</h2>
        <p className="mb-6 text-sm text-secondary">A tua conta está pronta. Bem-vindo à equipa Gracie Barra Braga.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Entrar na plataforma →
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center py-8 px-4 min-h-screen bg-base">
      <div className="p-6 w-full max-w-[420px] rounded-2xl border border-border sm:p-10 bg-white">
        <div className="flex gap-3 items-center mb-6">
          <div className="flex justify-center items-center w-11 h-11 text-white rounded-xl shrink-0 bg-gb-red">
            <Ico icon={KeyIcon} style={{ width: 20, height: 20 }} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-black uppercase text-primary">Define a tua password</div>
            <div className="text-xs text-muted">Gracie Barra Braga — Acesso de equipa</div>
          </div>
        </div>
        <p className="py-2.5 px-3.5 mb-5 text-[13px] leading-[1.6] rounded-lg border text-secondary border-gb-red/[0.12] bg-gb-red/[0.04]">
          A tua conta foi criada pelo administrador. Escolhe a password que vais usar para aceder à plataforma.
        </p>
        <div className="mb-3.5">
          <label className={LABEL_CLASS}>Nova Password *</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" className={FIELD_CLASS} />
        </div>
        <div className="mb-5">
          <label className={LABEL_CLASS}>Confirmar Password *</label>
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repete a password" className={FIELD_CLASS} />
        </div>
        {err && <div className="mb-3.5 text-xs font-semibold text-gb-red">{err}</div>}
        <Button variant="primary" fullWidth loading={saving} onClick={handle}>
          {saving ? 'A guardar...' : 'Confirmar Password →'}
        </Button>
        <button
          onClick={() => logout()}
          className="py-2.5 mt-2.5 w-full min-h-11 text-sm bg-transparent rounded-md border outline-none transition-colors duration-200 cursor-pointer border-border text-muted hover:bg-elevated hover:text-secondary focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 active:bg-elevated"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Aguardando Confirmação de Matrícula (pagamento em numerário por aprovar) ──
function AguardandoConfirmacaoScreen({ pedido }: { pedido: PedidoNumerario }) {
  const { logout, refreshProfile } = useAuth();
  const { refetch } = usePedidosNumerarioQuery();
  const [checking, setChecking] = useState(false);

  const handleVerificar = async () => {
    setChecking(true);
    await Promise.all([refetch(), refreshProfile()]);
    setChecking(false);
  };

  return (
    <div className="flex justify-center items-center py-8 px-4 min-h-screen bg-base">
      <div className="p-8 w-full max-w-[440px] text-center rounded-2xl border border-border bg-white">
        <div className="flex justify-center items-center mx-auto mb-4 w-14 h-14 text-amber-500 rounded-full bg-amber-500/10">
          <Ico icon={ClockIcon} style={{ width: 26, height: 26 }} />
        </div>
        <h2 className="mb-2 font-display text-lg font-extrabold uppercase text-primary">Aguardando Confirmação de Matrícula</h2>
        <p className="mb-1 text-sm leading-[1.6] text-secondary">
          Recebemos o teu pedido de matrícula com pagamento em numerário{pedido.plano ? ` para o plano ${pedido.plano}` : ''}.
        </p>
        <p className="mb-6 text-sm leading-[1.6] text-secondary">
          A equipa da academia vai confirmar o pagamento em breve e a tua conta será ativada automaticamente. Não é necessário preencher a ficha novamente.
        </p>
        <Button variant="primary" fullWidth className="mb-2.5" disabled={checking} onClick={handleVerificar}>
          <Ico icon={ArrowPathIcon} sm className={checking ? 'animate-spin' : undefined} />
          {checking ? 'A verificar...' : 'Verificar novamente'}
        </Button>
        <button
          onClick={() => logout()}
          className="py-2.5 w-full min-h-11 text-sm bg-transparent rounded-md border outline-none transition-colors duration-200 cursor-pointer border-border text-muted hover:bg-elevated hover:text-secondary focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 active:bg-elevated"
        >
          Terminar sessão
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, refreshProfile, pendingPasswordSetup } = useAuth();
  const { isActive } = useModulos();
  const [currentPage, setCurrentPage] = useState('');
  const [currentParam, setCurrentParam] = useState<string | undefined>(undefined);
  const [registering, setRegistering] = useState(false);

  // Only relevant for an aluno whose enrollment isn't complete yet — called
  // unconditionally (Rules of Hooks) but the query itself stays disabled
  // otherwise, so staff logins never pay for this fetch.
  const precisaVerificarPendente = user?.role === 'aluno' && !user?.matriculaCompleta;
  const { data: meusPedidosNumerario } = usePedidosNumerarioQuery({ enabled: precisaVerificarPendente });
  const pedidoPendente = precisaVerificarPendente
    ? meusPedidosNumerario?.find(p => p.email === user?.email && p.status === 'pendente')
    : undefined;

  // ── Back button support ───────────────────────────────────────────────────
  // Must be declared before any conditional returns (Rules of Hooks).
  // Guards internally with `if (!user)` so it's always called.
  useEffect(() => {
    if (!user) return;
    const defPage = user.role === 'aluno' ? 'portal' : 'dashboard';

    // currentPage is local component state, so it survives a logout (the
    // user just goes null, AppContent never unmounts) — without this, log
    // out from e.g. "perfil" and back in and it silently reopens "perfil"
    // instead of landing on the portal/dashboard like a fresh login should.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage('');
    setCurrentParam(undefined);

    // Set a base history entry so the very first back press doesn't exit the app
    history.replaceState({ page: defPage }, '', location.pathname + location.search);

    const onPop = (e: PopStateEvent) => {
      const p: string | undefined = e.state?.page;
      if (p && canAccess(user.role, p)) {
        setCurrentPage(p);
        setCurrentParam(e.state?.param);
      } else {
        // No more in-app history — land on default (next back will exit as expected)
        history.pushState({ page: defPage }, '', location.pathname + location.search);
        setCurrentPage(defPage);
        setCurrentParam(undefined);
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

  // Only alunos need to complete enrollment; staff go straight to the dashboard.
  // Rendered here (before <Layout>) so this full-screen flow never gets
  // wrapped by the internal Sidebar/Layout — it's not "in the app" yet.
  if (user.role === 'aluno' && !user.matriculaCompleta) {
    // Already submitted a cash-payment (numerário) request that's awaiting staff
    // approval — show a dedicated waiting screen instead of restarting the whole
    // Ficha/Contrato/Pagamento flow from scratch on every login.
    if (pedidoPendente) {
      return <AguardandoConfirmacaoScreen pedido={pedidoPendente} />;
    }
    return <FluxoMatricula onConcludo={refreshProfile} />;
  }

  const defaultPage = user.role === 'aluno' ? 'portal' : 'dashboard';
  const page = currentPage || defaultPage;

  // Security: redirect if user lacks role access OR module is disabled
  const safePage = (canAccess(user.role, page) && canAccessModule(page, isActive))
    ? page
    : defaultPage;

  const handleNavigate = (p: string, param?: string) => {
    if (canAccess(user.role, p)) {
      // Push a history entry so the mobile back button navigates within the app
      history.pushState({ page: p, param }, '', location.pathname + location.search);
      setCurrentPage(p);
      setCurrentParam(param);
    }
  };

  const renderPage = () => {
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

    // Professor routes
    if (user.role === 'professor') {
      switch (safePage) {
        case 'dashboard':    return <ProfessorView onNavigate={handleNavigate} />;
        case 'alunos':       return <AlunosPage />;
        case 'turmas':       return <TurmasPage />;
        case 'checkin':      return <CheckinPage />;
        case 'graduacao':    return <GraduacaoPage />;
        case 'aulas':        return <MinhasAulasPage onNavigate={handleNavigate} />;
        case 'aula-detalhe': return <AulaDetalhePage aulaId={currentParam} onNavigate={handleNavigate} />;
        case 'perfil':       return <PerfilPage />;
        default:             return <ProfessorView onNavigate={handleNavigate} />;
      }
    }

    // Superadmin dashboard
    if (user.role === 'superadmin' && safePage === 'dashboard') {
      return <SuperAdminDashboard onNavigate={handleNavigate} />;
    }

    // Admin + Superadmin + Atendimento routes
    switch (safePage) {
      case 'dashboard':    return <Dashboard />;
      case 'alunos':       return <AlunosPage initialAlunoId={currentParam} onNavigate={handleNavigate} />;
      case 'turmas':       return <TurmasPage />;
      case 'checkin':      return <CheckinPage />;
      case 'financeiro':   return <FinanceiroPage />;
      case 'graduacao':    return <GraduacaoPage />;
      case 'comunicacao':  return <ComunicacaoPage />;
      case 'chat':         return <ChatPage onNavigate={handleNavigate} initialAlunoId={currentParam} />;
      case 'contratos':    return <ContratosPage />;
      case 'relatorios':   return <RelatoriosPage />;
      case 'integracoes':  return <IntegracoesPage onNavigate={handleNavigate} />;
      case 'config':       return <ConfigPage />;
      case 'numerario':    return <PendentesNumerario />;
      case 'professores':  return <ProfessoresPage />;
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <ModulosProvider>
            <AppContent />
          </ModulosProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
