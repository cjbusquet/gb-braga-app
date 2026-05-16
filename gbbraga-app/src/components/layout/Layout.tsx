import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { roleThemes } from '../../lib/gbBrand';
import { GBHorizontal, GBIcon } from '../GBLogo';
import type { UserRole } from '../../types';

interface NavItem { icon: string; label: string; id: string; roles: UserRole[]; badge?: number; }

const NAV: NavItem[] = [
  { icon: '⊞', label: 'Dashboard',   id: 'dashboard',     roles: ['superadmin','admin','atendimento','professor'] },
  { icon: '◎', label: 'Alunos',      id: 'alunos',        roles: ['superadmin','admin','atendimento','professor'] },
  { icon: '▤', label: 'Turmas',      id: 'turmas',        roles: ['superadmin','admin','atendimento','professor'] },
  { icon: '✓', label: 'Check-in',    id: 'checkin',       roles: ['superadmin','admin','atendimento','professor'] },
  { icon: '€', label: 'Financeiro',  id: 'financeiro',    roles: ['superadmin','admin'], badge: 2 },
  { icon: '◈', label: 'Graduação',   id: 'graduacao',     roles: ['superadmin','admin','professor'] },
  { icon: '✉', label: 'Comunicação', id: 'comunicacao',   roles: ['superadmin','admin','atendimento'] },
  { icon: '💬', label: 'Chat',         id: 'chat',          roles: ['superadmin','admin','atendimento'], badge: 2 },
  { icon: '◻', label: 'Contratos',   id: 'contratos',     roles: ['superadmin','admin'] },
  { icon: '↗', label: 'Relatórios',  id: 'relatorios',    roles: ['superadmin','admin'] },
  { icon: '⛓', label: 'Integrações', id: 'integracoes',   roles: ['superadmin','admin'] },
  { icon: '⚙', label: 'Config.',     id: 'config',        roles: ['superadmin','admin'] },
  { icon: '🌐', label: 'Matr. Online', id: 'matricula',     roles: ['superadmin','admin'] },
  { icon: '💵', label: 'Numerário',    id: 'numerario',     roles: ['superadmin'], badge: 2 },
  { icon: '⌂', label: 'Portal',      id: 'portal',        roles: ['aluno'] },
  { icon: '▤', label: 'Aulas',       id: 'minhas-aulas',  roles: ['aluno'] },
  { icon: '◈', label: 'Evolução',    id: 'evolucao',      roles: ['aluno'] },
  { icon: '€', label: 'Financeiro',  id: 'meu-financeiro',roles: ['aluno'] },
  { icon: '▷', label: 'Conteúdo',    id: 'conteudo',      roles: ['aluno'] },
  { icon: '✉', label: 'Mensagens',   id: 'mensagens',     roles: ['aluno'], badge: 1 },
];

const NOTIFS = [
  { t: '2 pagamentos vencidos', i: '⚠️', sub: 'Ana Lima · Carla Nunes',   time: '2h' },
  { t: 'Nova matrícula',        i: '✅', sub: 'Paulo Martins inscreveu-se', time: '4h' },
  { t: '14 check-ins hoje',     i: 'ℹ️', sub: 'Aula das 7h — Gi Interm.',  time: '6h' },
];

interface Props { currentPage: string; onNavigate: (p: string) => void; children: ReactNode; }

export default function Layout({ currentPage, onNavigate, children }: Props) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;
  const t = roleThemes[user.role];
  const visible = NAV.filter(n => n.roles.includes(user.role));
  const W = collapsed ? 58 : 216;

  const navBtn = (item: NavItem) => {
    const active = currentPage === item.id;
    return (
      <button key={item.id} onClick={() => onNavigate(item.id)}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9,
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%', padding: collapsed ? '9px 0' : '8px 10px',
          borderRadius: 'var(--radius-sm)', border: 'none',
          background: active ? 'var(--sidebar-active)' : 'transparent',
          color: active ? 'var(--gb-red)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: active ? 600 : 400,
          marginBottom: 1, cursor: 'pointer', position: 'relative',
          borderLeft: `3px solid ${active ? 'var(--gb-red)' : 'transparent'}`,
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' as const }}>{item.label}</span>}
        {!collapsed && item.badge && (
          <span style={{ background: 'var(--gb-red)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>{item.badge}</span>
        )}
        {collapsed && item.badge && (
          <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: 'var(--gb-red)', borderRadius: '50%', border: '1.5px solid #fff' }}/>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-ui)', background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR — full white ── */}
      <aside style={{
        width: W, flexShrink: 0, transition: 'width 0.18s ease',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Logo */}
        <div style={{ height: 62, padding: collapsed ? '0 13px' : '0 18px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {collapsed ? <GBIcon size={32} bg="var(--gb-red)"/> : <GBHorizontal size={30} theme="light"/>}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ background: t.accentGlow, border: `1px solid ${t.accent}25`, borderLeft: `3px solid ${t.accent}`, borderRadius: 6, padding: '6px 10px' }}>
              <div style={{ color: t.accent, fontSize: 9.5, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const }}>{t.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{user.nome}</div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
          {visible.map(navBtn)}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px 6px 10px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {[
            { icon: collapsed ? '→' : '←', label: collapsed ? 'Expandir' : 'Colapsar', action: () => setCollapsed(!collapsed) },
            { icon: '⎋', label: 'Sair', action: logout },
          ].map(b => (
            <button key={b.label} onClick={b.action} style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', padding: collapsed ? '8px 0' : '7px 10px', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', borderRadius: 'var(--radius-sm)', marginBottom: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span>{b.icon}</span>
              {!collapsed && <span>{b.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ height: 58, padding: '0 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 18, background: 'var(--gb-red)', borderRadius: 99 }}/>
            <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
              {visible.find(n => n.id === currentPage)?.label || 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', position: 'relative' }}>
                🔔
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: 'var(--gb-red)', borderRadius: '50%', border: '1.5px solid white' }}/>
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 44, width: 310, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Notificações</span>
                    <span style={{ background: 'var(--gb-red)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>3</span>
                  </div>
                  {NOTIFS.map((n, i) => (
                    <div key={i} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{n.i}</span>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{n.t}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{n.sub}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>{n.time} atrás</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', textAlign: 'center' as const }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--gb-red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ver todas →</button>
                  </div>
                </div>
              )}
            </div>

            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.accentGlow, border: `2px solid ${t.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: t.accent, fontFamily: 'var(--font-display)' }}>
                {user.nome.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{user.nome.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1.5 }}>{t.label}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-base)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
