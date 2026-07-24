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
  PlayCircleIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { GB, roleThemes } from '../../lib/gbBrand';
import { useEffect, useState } from 'react';

import { GBLogoFull } from '../GBLogo';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types';
import { useAuth } from '../../lib/auth';
import { useModulos } from '../../lib/useModulos';

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCollapsed ? 0 : 10,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          width: '100%',
          padding: isCollapsed ? '11px 0' : '10px 14px',
          background: active
            ? `rgba(${rt.accent
                .replace('#', '')
                .match(/../g)
                ?.map((x) => parseInt(x, 16))
                .join(',')},0.12)`
            : 'transparent',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          borderLeft: '3px solid transparent',
          transition: 'all 0.15s',
          position: 'relative',
        }}
      >
        <item.Icon
          style={{
            width: 18,
            height: 18,
            flexShrink: 0,
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        />
        {!isCollapsed && (
          <span
            style={{
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              flex: 1,
              textAlign: 'left',
            }}
          >
            {item.label}
          </span>
        )}
        {item.badge && !isCollapsed && (
          <span
            style={{
              background: GB.red,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 99,
            }}
          >
            {item.badge}
          </span>
        )}
        {item.badge && isCollapsed && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: GB.red,
              borderRadius: '50%',
            }}
          />
        )}
      </button>
    );
  };

  /* ── Sidebar ──────────────────────────────────────── */
  const sidebar = (
    <div
      style={{
        width: sidebarW,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.2s',
        ...(isMobile
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 200,
              width: 'min(280px, 88vw)',
              transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s ease',
              boxShadow: mobileOpen ? '4px 0 32px rgba(0,0,0,0.25)' : 'none',
            }
          : {}),
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {!isCollapsed && (
          <button
            onClick={() =>
              handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
            }
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <GBLogoFull size={44} />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() =>
              handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
            }
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            🥋
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 6,
              minHeight: 44,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div
          onClick={() => handleNav('perfil')}
          title="Ver perfil"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: user.avatar ? 'transparent' : rt.accent,
                position: 'relative',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
                overflow: 'hidden',
                border: `2px solid ${rt.accent}`,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.nome?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.nome}
              </div>
              <div
                style={{
                  color: rt.accent,
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {rt.label}
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>›</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          scrollbarWidth: 'none',
        }}
      >
        {visibleNav.map(navBtn)}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          padding: 8,
          borderTop: '1px solid var(--border)',
          paddingBottom: isMobile
            ? 'calc(8px + env(safe-area-inset-bottom))'
            : 8,
        }}
      >
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '9px 14px',
              background: 'none',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            {isCollapsed ? (
              <ChevronRightIcon style={{ width: 16, height: 16 }} />
            ) : (
              <ChevronLeftIcon style={{ width: 16, height: 16 }} />
            )}
            {!isCollapsed && 'Colapsar'}
          </button>
        )}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? 0 : 10,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
            padding: isCollapsed ? '11px 0' : '10px 14px',
            background: 'none',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 600,
          }}
          title={isCollapsed ? 'Terminar sessão' : undefined}
        >
          <ArrowRightOnRectangleIcon
            style={{ width: 18, height: 18, flexShrink: 0 }}
          />
          {!isCollapsed && 'Terminar sessão'}
        </button>
      </div>
    </div>
  );

  /* ── Bottom tab bar (mobile only) ────────────────── */
  const bottomTabBar = isMobile && (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 190,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {bottomItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '8px 4px 10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderTop: `2px solid ${active ? rt.accent : 'transparent'}`,
              transition: 'all 0.15s',
              minHeight: 56,
              position: 'relative',
            }}
          >
            <item.Icon
              style={{
                width: 22,
                height: 22,
                color: active ? rt.accent : 'var(--text-muted)',
              }}
            />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: active ? 700 : 400,
                color: active ? rt.accent : 'var(--text-muted)',
                letterSpacing: '0.2px',
              }}
            >
              {item.label}
            </span>
            {item.badge && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: '50%',
                  transform: 'translateX(8px)',
                  background: GB.red,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
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
      style={{
        display: 'flex',
        // Desktop: fixed-height box, inner divs scroll
        // Mobile: natural flow so window/body scrolls → Chrome auto-hides address bar
        height: isMobile ? undefined : '100vh',
        minHeight: isMobile ? '100dvh' : undefined,
        overflow: isMobile ? undefined : 'hidden',
        fontFamily: 'var(--font-ui)',
        background: 'var(--bg-base)',
      }}
    >
      {/* Backdrop on mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
          }}
        />
      )}

      {sidebar}

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: isMobile ? 'block' : 'flex',
          flexDirection: isMobile ? undefined : 'column',
          overflow: isMobile ? undefined : 'hidden',
          // On mobile sidebar is position:fixed so main takes full width
          width: isMobile ? '100%' : undefined,
          minWidth: 0,
        }}
      >
        {/* Mobile top bar — position:fixed so window can scroll freely */}
        {isMobile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              // Extra top padding for iPhone notch / Dynamic Island in PWA mode
              paddingTop: 'env(safe-area-inset-top)',
              minHeight: 56,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <button
              onClick={() =>
                handleNav(user.role === 'aluno' ? 'portal' : 'dashboard')
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <GBLogoFull size={36} />
            </button>
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {visibleNav.find((n) => n.id === currentPage)?.label || ''}
            </div>
            <div
              onClick={() => handleNav('perfil')}
              title="Ver perfil"
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                minHeight: 38,
                borderRadius: '50%',
                background: user.avatar ? 'transparent' : rt.accent,
                position: 'relative',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
                border: `2px solid ${rt.accent}`,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.nome?.charAt(0) || '?'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Desktop top bar */}
        {!isMobile && (
          <div
            style={{
              height: 56,
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 24px',
              flexShrink: 0,
            }}
          >
            <div
              onClick={() => handleNav('perfil')}
              title="Ver perfil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {user.nome}
                </div>
                <div
                  style={{
                    color: rt.accent,
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {rt.label}
                </div>
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: user.avatar ? 'transparent' : rt.accent,
                  position: 'relative',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  overflow: 'hidden',
                  border: `2px solid ${rt.accent}`,
                  flexShrink: 0,
                }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {user.nome?.charAt(0) || '?'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div
          style={{
            // Desktop: flex item that scrolls inside the fixed-height layout
            flex: isMobile ? undefined : 1,
            overflowY: isMobile ? undefined : 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '16px 14px' : '28px 32px',
            // Mobile: push content below fixed top bar + leave room for fixed bottom nav
            paddingTop: isMobile
              ? 'calc(56px + env(safe-area-inset-top) + 16px)'
              : '28px',
            paddingBottom: isMobile
              ? 'calc(72px + env(safe-area-inset-bottom) + 16px)'
              : undefined,
          }}
        >
          {children}
        </div>
      </div>

      {bottomTabBar}
    </div>
  );
}
