import { useState } from 'react';
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
  portal:        ['aluno'],
  'minhas-aulas':['aluno'],
  evolucao:      ['aluno'],
  'meu-financeiro':['aluno'],
  conteudo:      ['aluno'],
  mensagens:     ['aluno'],
};

function canAccess(role: UserRole, page: string): boolean {
  const allowed = PAGE_ROLES[page];
  if (!allowed) return false;
  return allowed.includes(role);
}

function AppContent() {
  const { user, refreshProfile } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [registering, setRegistering] = useState(false);

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

  // Security: if user tries to access a page they don't have permission for,
  // redirect to their default page silently
  const safePage = canAccess(user.role, page) ? page : defaultPage;

  const handleNavigate = (p: string) => {
    if (canAccess(user.role, p)) {
      setCurrentPage(p);
    }
    // Silently ignore unauthorized navigation attempts
  };

  const renderPage = () => {
    // Only alunos need to complete enrollment
    // Staff (superadmin/admin/professor/atendimento) go straight to dashboard
    const isStaff = ['superadmin','admin','professor','atendimento'].includes(user.role);
    if (!isStaff && !user.matriculaCompleta) {
      return <FluxoMatricula onConcludo={() => {}} />;
    }
    if (user.role === 'aluno') {
      switch (safePage) {
        case 'portal':          return <PortalAluno onNavigate={handleNavigate}/>;
        case 'minhas-aulas':    return <MinhasAulas />;
        case 'evolucao':        return <MinhaEvolucao />;
        case 'meu-financeiro':  return <MeuFinanceiro />;
        case 'conteudo':        return <Conteudo />;
        case 'mensagens':       return <Mensagens />;
        default:                return <PortalAluno onNavigate={handleNavigate}/>;
      }
    }

    // Professor routes — dedicated view for their pages
    if (user.role === 'professor') {
      switch (safePage) {
        case 'checkin':   return <CheckinPage />;
        case 'graduacao': return <GraduacaoPage />;
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
  return <AuthProvider><AppContent /></AuthProvider>;
}
