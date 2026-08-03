import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HomeIcon,
  LinkIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon,
  type HeroIcon,
} from '../../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { roleThemes } from '../../lib/gbBrand';
import { useEffect, useState } from 'react';

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
  // Aluno
  { Icon: HomeIcon, label: 'Portal', id: 'portal', roles: ['aluno'] },
  { Icon: QrCodeIcon, label: 'Check-in', id: 'meu-checkin', roles: ['aluno'] },
  {
    Icon: CalendarDaysIcon,
    label: 'Aulas',
    id: 'minhas-aulas',
    roles: ['aluno'],
  },
];

// Bottom nav items per role (max 4 + "Mais")
const BOTTOM_NAV: Record<string, string[]> = {
  aluno: ['portal', 'meu-checkin', 'minhas-aulas', 'evolucao'],
  admin: ['dashboard', 'alunos', 'financeiro', 'config'],
  atendimento: ['dashboard', 'alunos', 'checkin', 'comunicacao'],
  professor: ['dashboard', 'alunos', 'checkin', 'graduacao'],
  superadmin: ['dashboard', 'alunos', 'financeiro', 'config'],
};

/* Shared focus ring for interactive elements sitting on a card/sidebar background */
const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-card';

interface AvatarUser {
  avatar?: string;
  nome?: string;
}

/* ── Circular user avatar (photo or initial), used in sidebar + both top bars ── */
function Avatar({ user, accent, size }: { user: AvatarUser; accent: string; size: number }) {
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (isMobile) setMobileOpen(false);
  };

  if (!user) return null;

  const rt = roleThemes[user.role] || roleThemes.aluno;
  const visibleNav = NAV_ITEMS.filter(
    (n) => n.roles.includes(user.role as UserRole) && isActive(n.id),
  );
  const isCollapsed = collapsed && !isMobile;
  const sidebarW = isCollapsed ? 64 : 240;

  // Bottom nav items for this role
  const bottomIds = BOTTOM_NAV[user.role] || BOTTOM_NAV.admin;
  const bottomItems = bottomIds
    .map((id) => visibleNav.find((n) => n.id === id))
    .filter(Boolean) as NavItem[];

  /* ── Sidebar nav button ──────────────────────────── */
  const navBtn = (item: NavItem) => {
    const active = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={[
          'flex relative items-center w-full min-h-11 rounded-lg border-l-[3px] border-transparent cursor-pointer transition-colors duration-200 active:bg-elevated',
          FOCUS_RING,
          isCollapsed ? 'justify-center gap-0 py-2.5 px-0' : 'gap-2.5 justify-start py-2.5 px-3.5',
        ].join(' ')}
        style={{
          background: active
            ? `rgba(${rt.accent
                .replace('#', '')
                .match(/../g)
                ?.map((x) => parseInt(x, 16))
                .join(',')},0.12)`
            : 'transparent',
        }}
      >
        <FontAwesomeIcon
          icon={item.Icon}
          className="w-[18px] h-[18px] shrink-0"
          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        />
        {!isCollapsed && (
          <span
            className="flex-1 text-[13px] font-medium text-left"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {item.label}
          </span>
        )}
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
        'flex overflow-hidden flex-col shrink-0 h-screen border-r border-border bg-card transition-[width] duration-200',
        isMobile
          ? [
              'fixed inset-y-0 left-0 z-[200] w-[min(280px,88vw)] transition-transform duration-250 ease-out',
              mobileOpen ? 'translate-x-0 shadow-[4px_0_32px_rgba(0,0,0,0.25)]' : '-translate-x-full shadow-none',
            ].join(' ')
          : '',
      ].join(' ')}
      style={{ width: isMobile ? undefined : sidebarW }}
    >
      {/* Logo */}
      <div
        className={[
          'flex items-center border-b border-border',
          isCollapsed ? 'justify-center py-4 px-2' : 'justify-between pt-4 px-4 pb-3',
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

      {/* User info */}
      {!isCollapsed && (
        <button
          onClick={() => handleNav('perfil')}
          title="Ver perfil"
          className={['py-3 px-4 w-full text-left border-b cursor-pointer transition-colors duration-200 border-border hover:bg-elevated active:bg-elevated', FOCUS_RING].join(' ')}
        >
          <div className="flex gap-2.5 items-center">
            <Avatar user={user} accent={rt.accent} size={36} />
            <div className="overflow-hidden flex-1">
              <div className="overflow-hidden text-[13px] font-semibold whitespace-nowrap text-ellipsis text-primary">
                {user.nome}
              </div>
              <div
                className="text-[10.5px] font-semibold tracking-[0.5px] uppercase"
                style={{ color: rt.accent }}
              >
                {rt.label}
              </div>
            </div>
            <span className="text-[11px] text-muted">›</span>
          </div>
        </button>
      )}

      {/* Nav items */}
      <div className="overflow-y-auto flex-1 p-2 [scrollbar-width:none]">
        {visibleNav.map(navBtn)}
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
            {isCollapsed ? (
              <FontAwesomeIcon icon={ChevronRightIcon} className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={ChevronLeftIcon} className="w-4 h-4" />
            )}
            {!isCollapsed && 'Colapsar'}
          </button>
        )}
        <button
          onClick={logout}
          title={isCollapsed ? 'Terminar sessão' : undefined}
          className={[
            'flex items-center w-full min-h-11 text-[13px] font-semibold bg-none border-none rounded-lg cursor-pointer transition-colors duration-200 text-red-500 hover:bg-red-50 active:bg-red-50',
            'outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            isCollapsed ? 'justify-center gap-0 py-2.5 px-0' : 'gap-2.5 justify-start py-2.5 px-3.5',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={ArrowRightOnRectangleIcon} className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && 'Terminar sessão'}
        </button>
      </div>
    </div>
  );

  /* ── Bottom tab bar (mobile only) ────────────────── */
  const bottomTabBar = isMobile && (
    <div className="flex fixed right-0 bottom-0 left-0 z-[190] items-stretch pb-[env(safe-area-inset-bottom)] border-t shadow-[0_-2px_12px_rgba(0,0,0,0.08)] border-border bg-card">
      {bottomItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={['flex relative flex-col flex-1 gap-0.5 justify-center items-center py-2 px-1 pb-2.5 min-h-14 bg-none border-none transition-all duration-200 cursor-pointer active:bg-elevated', 'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-inset'].join(' ')}
            style={{ borderTop: `2px solid ${active ? rt.accent : 'transparent'}` }}
          >
            <FontAwesomeIcon
              icon={item.Icon}
              className="w-[22px] h-[22px]"
              style={{ color: active ? rt.accent : 'var(--text-muted)' }}
            />
            <span
              className="text-[9.5px] tracking-[0.2px]"
              style={{ fontWeight: active ? 700 : 400, color: active ? rt.accent : 'var(--text-muted)' }}
            >
              {item.label}
            </span>
            {item.badge && (
              <span
                className="flex absolute top-1.5 right-1/2 justify-center items-center w-3.5 h-3.5 text-[9px] font-bold text-white rounded-full translate-x-2 bg-gb-red"
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
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
      {/* Backdrop on mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[199] bg-black/50"
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
          <div className="flex fixed inset-x-0 top-0 z-[100] justify-between items-center py-0 px-4 pt-[env(safe-area-inset-top)] min-h-14 border-b shadow-xs border-border bg-card">
            <button
              onClick={() =>
                handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
              }
              className={['flex p-0 bg-none border-none rounded-md cursor-pointer transition-transform duration-200 active:scale-95', FOCUS_RING].join(' ')}
            >
              <GBLogoFull size={36} />
            </button>
            <div className="overflow-hidden text-xs font-semibold tracking-[0.5px] uppercase truncate text-muted">
              {visibleNav.find((n) => n.id === currentPage)?.label || ''}
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
          className={[
            'overflow-x-hidden',
            isMobile
              ? 'py-4 px-3.5 pt-[calc(56px+env(safe-area-inset-top)+16px)] pb-[calc(72px+env(safe-area-inset-bottom)+16px)]'
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
