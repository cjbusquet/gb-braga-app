// @ts-nocheck
import { useState } from 'react';
import { useKPIs, usePagamentos, usePresencas, useAlunos, useTurmas } from '../../lib/useData';
import { revenueHistory } from '../../data/mockData';
import { beltConfig } from '../../lib/gbBrand';

function KPI({ label, value, sub, accent = 'var(--gb-red)', delta, icon }: {
  label: string; value: string | number; sub?: string;
  accent?: string; delta?: string; icon?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', borderTop: `3px solid ${accent}`, boxShadow: 'var(--shadow-xs)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 6 }}>{label}</div>
        {icon && <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {delta && <div style={{ color: accent, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{delta}</div>}
    </div>
  );
}

function Card({ children, style = {}, title, action }: { children: React.ReactNode; style?: React.CSSProperties; title?: string; action?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ padding: '14px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>{title}</div>
          {action}
        </div>
      )}
      <div style={{ padding: title ? '14px 18px 18px' : '18px' }}>{children}</div>
    </div>
  );
}

// Today's schedule
const TODAY_SCHEDULE = [
  { hora: '18:00', turma: 'Jiu-Jitsu Adultos — Noite 1', prof: 'Carlos Silva',   inscritos: 15, nivel: 'all'      },
  { hora: '19:30', turma: 'Jiu-Jitsu Adultos — Noite 2', prof: 'Carlos Silva',   inscritos: 18, nivel: 'all'      },
  { hora: '20:00', turma: 'No-Gi / Wrestling',            prof: 'João Santos',   inscritos: 11, nivel: 'all'      },
  { hora: '21:00', turma: 'Jiu-Jitsu Avançado',          prof: 'Carlos Silva',   inscritos: 10, nivel: 'avancado' },
];

const NIVEL_COLOR: Record<string, string> = {
  all: '#3B82F6', iniciante: '#16A34A', intermediario: '#7C3AED', avancado: 'var(--gb-red)', kids: '#D97706'
};

export default function Dashboard() {
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const { data: presencas } = usePresencas();
  const { data: turmas } = useTurmas();
  const { data: kpis } = useKPIs();
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const vencidos  = pagamentos.filter(p => p.status === 'vencido');
  const pendentes = pagamentos.filter(p => p.status === 'pendente');
  const maxR = Math.max(...revenueHistory.map(r => r.valor));
  const now = new Date();
  const horaAtual = now.getHours();
  const atulaProxAula = TODAY_SCHEDULE.find(t => parseInt(t.hora) >= horaAtual);

  const QUICK_ACTIONS = [
    { icon: '➕', label: 'Nova Matrícula',    color: 'var(--gb-red)',   id: 'matricula' },
    { icon: '💬', label: 'Enviar WhatsApp',   color: '#25D366',         id: 'whatsapp'  },
    { icon: '🧾', label: 'Emitir Fatura',     color: '#635BFF',         id: 'fatura'    },
    { icon: '✓',  label: 'Check-in Manual',  color: '#16A34A',         id: 'checkin'   },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>
            {now.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const }}>
            Gracie Barra Braga
          </h1>
        </div>
        {atulaProxAula && (
          <div style={{ background: 'var(--gb-red-glow)', border: '1px solid var(--gb-red-border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gb-red)', animation: 'pulse 2s infinite' }}/>
            <div>
              <div style={{ color: 'var(--gb-red)', fontSize: 11, fontWeight: 700 }}>PRÓXIMA AULA</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{atulaProxAula.hora} — {atulaProxAula.turma}</div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {(vencidos.length > 0) && (
        <div style={{ background: 'rgba(200,16,46,0.05)', border: '1px solid var(--gb-red-border)', borderRadius: 'var(--radius-md)', padding: '11px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
              <strong style={{ color: 'var(--gb-red)' }}>{vencidos.length} pagamentos vencidos</strong> — {vencidos.map(p => p.alunoNome.split(' ')[0]).join(', ')}
            </span>
          </div>
          <button style={{ background: 'var(--gb-red)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 14px', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
            Notificar agora →
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18 }}>
        <KPI label="Alunos Ativos"   value={kpis.alunosAtivos}    accent="var(--gb-red)"  delta={`${kpis.totalAlunos} total`}    icon="👥"/>
        <KPI label="Receita Mensal"  value={`€${kpis.receitaMensal.toLocaleString('pt-PT')}`} accent="#16A34A" delta="↑ +1.5% vs Abr" icon="💰"/>
        <KPI label="A Receber"       value={`€${pendentes.reduce((s,p)=>s+p.valor,0)}`} accent="#D97706" sub={`${pendentes.length} pendentes`} icon="⏳"/>
        <KPI label="Vencidos"        value={vencidos.length}           accent="var(--gb-red)"  sub="Ação necessária"                      icon="⚠️"/>
        <KPI label="Frequência"      value={`${kpis.taxaFrequencia}%`} accent="#2563EB"   sub="Este mês"                             icon="📊"/>
        <KPI label="Retenção"        value={`${kpis.taxaRetencao}%`}  accent="#7C3AED"   sub="Últimos 12 meses"                     icon="🔄"/>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.id} onClick={() => setQuickAction(a.id === quickAction ? null : a.id)}
            style={{ background: quickAction === a.id ? a.color + '10' : 'var(--bg-card)', border: `1.5px solid ${quickAction === a.id ? a.color : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; }}
            onMouseLeave={e => { if (quickAction !== a.id) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <span style={{ fontSize: 20 }}>{a.icon}</span>
            <span style={{ color: quickAction === a.id ? a.color : 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Chart */}
        <Card title="Receita Mensal">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
            {revenueHistory.map((r, i) => {
              const last = i === revenueHistory.length - 1;
              const h = maxR > 0 ? Math.round((r.valor / maxR) * 110) : 8;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {last && maxR > 0 && <span style={{ fontSize: 9.5, color: 'var(--gb-red)', fontWeight: 800 }}>€{(r.valor/1000).toFixed(1)}k</span>}
                  <div style={{ width: '100%', background: last ? 'var(--gb-red)' : 'var(--bg-elevated)', borderRadius: '4px 4px 0 0', height: `${h || 8}px`, boxShadow: last ? 'var(--shadow-red)' : 'none' }}/>
                  <span style={{ fontSize: 10.5, color: last ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: last ? 700 : 400 }}>{r.mes}</span>
                </div>
              );
            })}
          </div>
          {maxR === 0 && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' as const }}>
              Configure os preços dos planos em <strong>Financeiro → Planos</strong>
            </div>
          )}
        </Card>

        {/* Belt distribution */}
        <Card title="Distribuição de Faixas">
          {Object.entries(beltConfig).map(([faixa, cfg]) => {
            const count = alunos.filter(a => a.faixa === faixa).length;
            if (!count) return null;
            return (
              <div key={faixa} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 20, height: 7, background: cfg.bg, borderRadius: 2, border: faixa === 'branca' ? '1px solid var(--border-strong)' : 'none', flexShrink: 0 }}/>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11.5, width: 52, textTransform: 'capitalize' as const }}>{cfg.label}</span>
                <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ background: cfg.bg === '#F0EEFF' ? '#aaa' : cfg.bg, height: '100%', width: `${(count / alunos.length) * 100}%` }}/>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 14, textAlign: 'right' as const }}>{count}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Today's schedule */}
        <Card title="Aulas de Hoje">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TODAY_SCHEDULE.map((t, i) => {
              const isNow = parseInt(t.hora) <= horaAtual && horaAtual < parseInt(t.hora) + 2;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: isNow ? 'rgba(200,16,46,0.05)' : 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: `1px solid ${isNow ? 'var(--gb-red-border)' : 'var(--border-subtle)'}` }}>
                  <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
                    <div style={{ color: isNow ? 'var(--gb-red)' : 'var(--text-primary)', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{t.hora}</div>
                    {isNow && <div style={{ fontSize: 8, color: 'var(--gb-red)', fontWeight: 700, letterSpacing: '1px' }}>AGORA</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{t.turma}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginTop: 1 }}>Prof. {t.prof.split(' ')[0]} · {t.inscritos} alunos</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: NIVEL_COLOR[t.nivel] || '#888', flexShrink: 0 }}/>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pending payments */}
        <Card title="Pagamentos Pendentes" action={
          vencidos.length > 0 ? <span style={{ background: 'rgba(200,16,46,0.08)', color: 'var(--gb-red)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>{vencidos.length} vencidos</span> : undefined
        }>
          {[...vencidos, ...pendentes].slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{p.alunoNome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{p.vencimento}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€{p.valor}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: p.status === 'vencido' ? 'rgba(200,16,46,0.08)' : 'rgba(217,119,6,0.08)', color: p.status === 'vencido' ? 'var(--gb-red)' : 'var(--warning)' }}>{p.status}</span>
              </div>
            </div>
          ))}
          {[...vencidos, ...pendentes].length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' as const, padding: '12px 0' }}>✓ Tudo em dia</p>
          )}
        </Card>

        {/* Recent check-ins */}
        <Card title="Check-ins Recentes" action={
          <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>● LIVE</span>
        }>
          {presencas.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{p.alunoNome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{p.turmaNome} · {p.hora}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 9.5, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 5px', borderRadius: 3 }}>{p.metodo}</span>
            </div>
          ))}
        </Card>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}
