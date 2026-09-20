import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  HomeIcon,
  LinkIcon,
  MedalIcon,
  PuzzlePieceIcon,
  UserPlusIcon,
  QrCodeIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
  VideoCameraIcon,
  XMarkIcon,
  type HeroIcon,
} from '../../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { roleThemes } from '../../lib/gbBrand';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { GBLogoFull } from '../GBLogo';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types';
import { useAuth } from '../../lib/auth';
import { useModulos } from '../../lib/useModulos';
import NotificationBell from './NotificationBell';

interface NavItem {
  Icon: HeroIcon;
  label: string;
  id: string;
  roles: UserRole[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    Icon: Squares2X2Icon,
    label: 'Dashboard',
    id: 'dashboard',
    roles: ['superadmin', 'admin', 'atendimento', 'professor'],
  },
  {
    Icon: UsersIcon,
    label: 'Alunos',
    id: 'alunos',
    roles: ['superadmin', 'admin', 'atendimento', 'professor'],
  },
  {
    Icon: CalendarDaysIcon,
    label: 'Turmas',
    id: 'turmas',
    roles: ['superadmin', 'admin', 'atendimento', 'professor'],
  },
  {
    Icon: QrCodeIcon,
    label: 'Check-in',
    id: 'checkin',
    roles: ['superadmin', 'admin', 'atendimento', 'professor'],
  },
  {
    Icon: BanknotesIcon,
    label: 'Financeiro',
    id: 'financeiro',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: TrophyIcon,
    label: 'Graduação',
    id: 'graduacao',
    roles: ['superadmin', 'admin', 'professor'],
  },
  {
    Icon: ClipboardDocumentCheckIcon,
    label: 'Minhas Aulas',
    id: 'aulas',
    roles: ['professor'],
  },
  {
    Icon: ClockIcon,
    label: 'Agenda',
    id: 'agenda',
    roles: ['professor'],
  },
  {
    Icon: ChartBarIcon,
    label: 'Resumo',
    id: 'aulas-resumo',
    roles: ['professor'],
  },
  {
    Icon: UserPlusIcon,
    label: 'Particulares',
    id: 'particulares',
    roles: ['professor'],
  },
  {
    Icon: EnvelopeIcon,
    label: 'Comunicação',
    id: 'comunicacao',
    roles: ['superadmin', 'admin', 'atendimento'],
  },
  {
    Icon: ChatBubbleLeftRightIcon,
    label: 'Chat',
    id: 'chat',
    roles: ['superadmin', 'admin', 'atendimento'],
  },
  {
    Icon: DocumentTextIcon,
    label: 'Contratos',
    id: 'contratos',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: ChartBarIcon,
    label: 'Relatórios',
    id: 'relatorios',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: LinkIcon,
    label: 'Integrações',
    id: 'integracoes',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: Cog6ToothIcon,
    label: 'Config.',
    id: 'config',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: GlobeAltIcon,
    label: 'Matr. Online',
    id: 'matricula',
    roles: ['superadmin', 'admin'],
  },
  {
    Icon: AcademicCapIcon,
    label: 'Professores',
    id: 'professores',
    roles: ['superadmin'],
  },
  {
    Icon: CurrencyEuroIcon,
    label: 'Numerário',
    id: 'numerario',
    roles: ['superadmin'],
  },
  {
    Icon: PuzzlePieceIcon,
    label: 'Módulos',
    id: 'modulos',
    roles: ['superadmin'],
  },
  {
    Icon: ExclamationTriangleIcon,
    label: 'Alertas',
    id: 'alertas',
    roles: ['superadmin', 'admin', 'professor'],
  },
  // Aluno
  { Icon: HomeIcon, label: 'Portal', id: 'portal', roles: ['aluno'] },
  { Icon: QrCodeIcon, label: 'Check-in', id: 'meu-checkin', roles: ['aluno'] },
  {
    Icon: CalendarDaysIcon,
    label: 'Aulas',
    id: 'minhas-aulas',
    roles: ['aluno'],
  },
  { Icon: MedalIcon, label: 'Evolução', id: 'evolucao', roles: ['aluno'] },
  {
    Icon: BanknotesIcon,
    label: 'Financeiro',
    id: 'meu-financeiro',
    roles: ['aluno'],
  },
  { Icon: VideoCameraIcon, label: 'Conteúdo', id: 'conteudo', roles: ['aluno'] },
  {
    Icon: EnvelopeIcon,
    label: 'Mensagens',
    id: 'mensagens',
    roles: ['aluno'],
  },
  // Rank de frequência — visível a toda a academia, staff e aluno. Fica no
  // fim da lista (depois do "Portal" de cada role) por ser um extra social,
  // não um destino do dia a dia.
  {
    Icon: TrophyIcon,
    label: 'Rank',
    id: 'ranking',
    roles: ['superadmin', 'admin', 'atendimento', 'professor', 'aluno'],
  },
];

// Bottom nav items per role (max 4 + "Mais")
const BOTTOM_NAV: Record<string, string[]> = {
  aluno: ['portal', 'meu-checkin', 'minhas-aulas', 'evolucao'],
  admin: ['dashboard', 'alunos', 'financeiro', 'config'],
  atendimento: ['dashboard', 'alunos', 'checkin', 'comunicacao'],
  professor: ['dashboard', 'aulas', 'agenda', 'checkin'],
  superadmin: ['dashboard', 'alunos', 'financeiro', 'config'],
};

/* Shared focus ring for interactive elements sitting on a card/sidebar background */
const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card';

export interface AvatarUser {
  avatar?: string;
  nome?: string;
}

/* ── Circular user avatar (photo or initial), used in sidebar + both top bars,
   and reused by PortalAluno.tsx's masthead card. ── */
export function Avatar({ user, accent, size }: { user: AvatarUser; accent: string; size: number }) {
  return (
    <div
      className="overflow-hidden relative shrink-0 rounded-full"
      style={{ width: size, height: size, background: user.avatar ? 'transparent' : accent, border: `2px solid ${accent}` }}
    >
      {user.avatar ? (
        <img src={user.avatar} alt="" className="block absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="flex absolute inset-0 justify-center items-center text-sm font-bold text-white">
          {user.nome?.charAt(0) || '?'}
        </span>
      )}
    </div>
  );
}

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}

export default function Layout({
  currentPage,
  onNavigate,
  children,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const { isActive } = useModulos();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const navListRef = useRef<HTMLDivElement>(null);
  // Highlight for the active nav item is one shared element that slides to
  // the active button's measured position, instead of each button painting
  // its own background — that's what makes switching pages feel like real
  // motion instead of two items just swapping colour.
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);
  // Bumped every time the mobile drawer opens, and used as the nav list's
  // `key` — remounting it is what lets the items' entrance animation replay
  // on every open instead of only once when the sidebar first mounts.
  const [mobileOpenCount, setMobileOpenCount] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);


  // The page-content element is never remounted between pages (only its
  // children swap in App.tsx's renderPage()), so it silently kept whatever
  // scroll position the previous page was left at instead of starting each
  // page at the top. Desktop scrolls its own container; mobile scrolls the
  // window itself (see the content div's classes below).
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Re-measure the active nav button whenever the page, the collapsed
  // state, or the desktop/mobile breakpoint changes — useLayoutEffect so
  // the indicator is already in place before paint on first render, and
  // only animates (via the CSS transition below) on later moves.
  useLayoutEffect(() => {
    const container = navListRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-nav-id="${currentPage}"]`);
    setIndicator(activeEl ? { top: activeEl.offsetTop, height: activeEl.offsetHeight } : null);
  }, [currentPage, collapsed, isMobile, mobileOpenCount]);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (isMobile) setMobileOpen(false);
  };

  if (!user) return null;

  const rt = roleThemes[user.role] || roleThemes.aluno;
  // Pagamento pendente (ver App.tsx/auth.tsx): só "Meu Financeiro" fica
  // acessível até o webhook confirmar o 1.º pagamento — não faz sentido
  // mostrar navegação para páginas que o próprio AppContent vai bloquear.
  const visibleNav = user.pagamentoPendente
    ? NAV_ITEMS.filter((n) => n.id === 'meu-financeiro')
    : NAV_ITEMS.filter(
        (n) => n.roles.includes(user.role as UserRole) && isActive(n.id),
      );
  const isCollapsed = collapsed && !isMobile;
  const sidebarW = isCollapsed ? 64 : 240;

  // Bottom nav items for this role
  const bottomIds = user.pagamentoPendente ? ['meu-financeiro'] : (BOTTOM_NAV[user.role] || BOTTOM_NAV.admin);
  const bottomItems = bottomIds
    .map((id) => visibleNav.find((n) => n.id === id))
    .filter(Boolean) as NavItem[];

  /* ── Sidebar nav button — no longer paints its own active background;
     a single shared indicator (below) slides to whichever button is
     active, so switching pages reads as one element moving, not two
     items swapping colour independently. ── */
  const navBtn = (item: NavItem, i: number) => {
    const active = currentPage === item.id;
    return (
      <button
        key={item.id}
        data-nav-id={item.id}
        onClick={() => handleNav(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={[
          'flex relative z-10 items-center py-2.5 px-3.5 w-full min-h-11 rounded-lg cursor-pointer transition-all duration-200 active:bg-elevated active:scale-[0.98] animate-[slideInLeft_0.3s_ease_both]',
          FOCUS_RING,
          isCollapsed ? 'justify-center gap-0' : 'gap-2.5 justify-start',
        ].join(' ')}
        style={{ animationDelay: `${i * 30}ms` }}
      >
        <FontAwesomeIcon
          icon={item.Icon}
          className="w-[18px] h-[18px] shrink-0 transition-colors duration-200"
          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        />
        <span
          className={[
            'overflow-hidden text-[13px] font-medium text-left whitespace-nowrap transition-all duration-200',
            isCollapsed ? 'max-w-0 opacity-0' : 'flex-1 max-w-[160px] opacity-100',
          ].join(' ')}
          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {item.label}
        </span>
        {item.badge && !isCollapsed && (
          <span className="py-px px-1.5 text-[10px] font-bold text-white rounded-full bg-gb-red">
            {item.badge}
          </span>
        )}
        {item.badge && isCollapsed && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gb-red" />
        )}
      </button>
    );
  };

  /* ── Sidebar ──────────────────────────────────────── */
  const sidebar = (
    <div
      className={[
        'flex overflow-hidden flex-col shrink-0 h-screen border-r border-border bg-card transition-[width] duration-200 ease-out',
        isMobile
          ? [
              'fixed inset-y-0 left-0 z-[200] w-[min(280px,88vw)] transition-transform duration-250 ease-out',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')
          : '',
      ].join(' ')}
      style={{ width: isMobile ? undefined : sidebarW }}
    >
      {/* Logo — h-14 para bater certo com a altura do header (top bar
          desktop e mobile usam a mesma h-14/min-h-14); antes tinha
          padding próprio e ficava ~16px mais alto, desalinhando a
          linha divisória da sidebar com a do header. */}
      <div
        className={[
          'flex items-center h-14 border-b border-border',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        ].join(' ')}
      >
        {!isCollapsed && (
          <button
            onClick={() =>
              handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
            }
            className={['flex p-0 bg-none border-none rounded-md cursor-pointer transition-transform duration-200 active:scale-95', FOCUS_RING].join(' ')}
          >
            <GBLogoFull size={44} />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() =>
              handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
            }
            className={['flex p-0 bg-none border-none rounded-md cursor-pointer transition-transform duration-200 active:scale-95', FOCUS_RING].join(' ')}
          >
            <GBLogoFull size={28} />
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className={['flex justify-center items-center p-1.5 min-h-11 min-w-11 bg-none border-none rounded-lg cursor-pointer transition-colors duration-200 text-muted hover:text-primary hover:bg-elevated active:bg-elevated', FOCUS_RING].join(' ')}
          >
            <FontAwesomeIcon icon={XMarkIcon} className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div key={mobileOpenCount} ref={navListRef} className="overflow-y-auto relative flex-1 p-2 [scrollbar-width:none]">
        {indicator && (
          <div
            aria-hidden="true"
            className="absolute inset-x-2 z-0 rounded-lg transition-[top,height] duration-300 pointer-events-none"
            style={{
              top: indicator.top,
              height: indicator.height,
              background: `${rt.accent}1F`,
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        )}
        {visibleNav.map((item, i) => navBtn(item, i))}
      </div>

      {/* Bottom actions */}
      <div
        className={[
          'p-2 border-t border-border',
          isMobile ? 'pb-[calc(8px+env(safe-area-inset-bottom))]' : 'pb-2',
        ].join(' ')}
      >
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={['flex gap-2 items-center py-2 px-3.5 min-h-11 w-full text-xs bg-none border-none rounded-lg cursor-pointer transition-colors duration-200 text-muted hover:text-primary hover:bg-elevated active:bg-elevated', FOCUS_RING].join(' ')}
          >
            <FontAwesomeIcon
              icon={ChevronLeftIcon}
              className={['w-4 h-4 transition-transform duration-200', isCollapsed ? 'rotate-180' : ''].join(' ')}
            />
            {!isCollapsed && 'Colapsar'}
          </button>
        )}
        <button
          onClick={logout}
          title={isCollapsed ? 'Terminar sessão' : undefined}
          className={[
            'flex items-center w-full min-h-11 text-[13px] font-semibold bg-none border-none rounded-lg cursor-pointer transition-colors duration-200 text-gb-red hover:bg-gb-red-glow active:bg-gb-red-glow',
            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            isCollapsed ? 'justify-center gap-0 py-2.5 px-0' : 'gap-2.5 justify-start py-2.5 px-3.5',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={ArrowRightOnRectangleIcon} className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && 'Terminar sessão'}
        </button>
      </div>
    </div>
  );

  /* ── Bottom tab bar (mobile only) — floating translucent dock ──────
     Icon-only pill that hovers above the page instead of spanning edge to
     edge; the active item gets a filled accent circle rather than a top
     bar, since there's no full-width strip left to hang an indicator off.
     Glassy light tint (not a dark panel) so it sits on top of the page's
     own off-white background instead of fighting it. */
  const bottomTabBar = isMobile && (
    <div className="flex fixed inset-x-0 bottom-0 z-[190] justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pointer-events-none">
      <div
        className="flex gap-1 items-center py-2 px-2 rounded-full border pointer-events-auto bg-card border-black/[0.06]"
      >
        {bottomItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              title={item.label}
              className={['flex relative justify-center items-center w-11 h-11 bg-none border-none rounded-full cursor-pointer transition-all duration-200 active:scale-90', 'outline-none focus-visible:ring-2 focus-visible:ring-gb-red/60 focus-visible:ring-inset'].join(' ')}
              style={{ background: active ? rt.accent : 'transparent' }}
            >
              <FontAwesomeIcon
                icon={item.Icon}
                className="w-[19px] h-[19px]"
                style={{ color: active ? 'var(--color-white)' : 'var(--text-muted)' }}
              />
              {item.badge && (
                <span
                  className="flex absolute top-0.5 right-0.5 justify-center items-center w-3.5 h-3.5 text-[9px] font-bold text-white rounded-full bg-gb-red"
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Render ──────────────────────────────────────── */
  return (
    <div
      className={[
        'flex overflow-x-hidden font-ui bg-base',
        isMobile ? 'min-h-dvh' : 'overflow-hidden h-screen',
      ].join(' ')}
    >
      {/* Backdrop on mobile — stays mounted while isMobile (not gated by
          mobileOpen) so opacity can transition on both open and close;
          before this it just popped in/out instantly while the drawer
          beside it slid smoothly, which read as broken. */}
      {isMobile && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden={!mobileOpen}
          className={[
            'fixed inset-0 z-[199] bg-black/50 transition-opacity duration-250 ease-out',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
        />
      )}

      {sidebar}

      {/* Main area */}
      <div
        className={[
          'flex-1 min-w-0',
          isMobile ? 'block w-full' : 'flex overflow-hidden flex-col',
        ].join(' ')}
      >
        {/* Mobile top bar — position:fixed so window can scroll freely */}
        {isMobile && (
          <div className="flex fixed inset-x-0 top-0 z-[100] justify-between items-center py-0 px-4 pt-[env(safe-area-inset-top)] min-h-14 border-b border-border bg-card">
            <div className="flex gap-1 items-center shrink-0">
              <button
                onClick={() => {
                  setMobileOpen(true);
                  setMobileOpenCount((c) => c + 1);
                }}
                title="Abrir menu"
                className={['flex justify-center items-center min-h-11 min-w-11 -ml-2 bg-none border-none rounded-lg cursor-pointer transition-colors duration-200 text-secondary hover:bg-elevated active:bg-elevated', FOCUS_RING].join(' ')}
              >
                <FontAwesomeIcon icon={Bars3Icon} className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="flex gap-3 items-center shrink-0">
              <NotificationBell onNavigate={handleNav} accent={rt.accent} />
              <button
                onClick={() => handleNav('perfil')}
                title="Ver perfil"
                className={['shrink-0 rounded-full cursor-pointer transition-transform duration-200 active:scale-95', FOCUS_RING].join(' ')}
              >
                <Avatar user={user} accent={rt.accent} size={38} />
              </button>
            </div>
          </div>
        )}

        {/* Desktop top bar */}
        {!isMobile && (
          <div className="flex gap-4 shrink-0 justify-end items-center py-0 px-6 h-14 border-b border-border bg-card">
            <NotificationBell onNavigate={handleNav} accent={rt.accent} />
            <button
              onClick={() => handleNav('perfil')}
              title="Ver perfil"
              className={['flex gap-2.5 items-center py-1.5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-elevated active:bg-elevated', FOCUS_RING].join(' ')}
            >
              <div className="text-right">
                <div className="text-[13px] font-semibold text-primary">{user.nome}</div>
                <div className="text-[10.5px] font-semibold uppercase" style={{ color: rt.accent }}>
                  {rt.label}
                </div>
              </div>
              <Avatar user={user} accent={rt.accent} size={34} />
            </button>
          </div>
        )}

        {/* Page content */}
        <div
          ref={contentRef}
          className={[
            'overflow-x-hidden',
            isMobile
              ? 'py-4 px-3.5 pt-[calc(56px+env(safe-area-inset-top)+16px)] pb-[calc(88px+env(safe-area-inset-bottom)+16px)]'
              : 'flex-1 overflow-y-auto py-7 px-8',
          ].join(' ')}
        >
          {children}
        </div>
      </div>

      {bottomTabBar}
    </div>
  );
}
