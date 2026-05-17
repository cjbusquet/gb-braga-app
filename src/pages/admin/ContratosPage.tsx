// @ts-nocheck
import { useState } from 'react';
import { useContratos, useAlunos, usePlanos } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';
import type { Contrato } from '../../types';

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>;
}

function NovoContratoModal({ onClose }: { onClose: () => void }) {
  const { data: alunos } = useAlunos();
  const { data: planos } = usePlanos();
  const [aluno, setAluno] = useState('');
  const [plano, setPlano] = useState('');
  const [inicio, setInicio] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const planoSel = planos.find(p => p.id === plano);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28, width: 460, boxShadow: 'var(--shadow-float)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>Novo Contrato</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Criar contrato de matrícula</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 28, height: 28, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>✕</button>
        </div>

        {[
          { label: 'Aluno', content: (
            <select value={aluno} onChange={e => setAluno(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
              <option value="">Selecionar aluno...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          )},
          { label: 'Plano', content: (
            <select value={plano} onChange={e => setPlano(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
              <option value="">Selecionar plano...</option>
              {planos.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome} — €{p.valor}</option>)}
            </select>
          )},
          { label: 'Data de Início', content: (
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
          )},
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>{f.label}</label>
            {f.content}
          </div>
        ))}

        {planoSel && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 18 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Resumo do contrato</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Valor mensal</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€{planoSel.valor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Stripe Price ID</span>
              <span style={{ color: '#635BFF', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{planoSel.stripePriceId}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { setSaved(true); setTimeout(onClose, 1200); }} style={{ flex: 2, background: saved ? '#22C55E' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '11px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saved ? '✓ Contrato criado!' : '📋 Criar Contrato'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContratosPage() {
  const { data: contratos } = useContratos();
  const { data: alunos } = useAlunos();
  const { data: planos } = usePlanos();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('todos');

  const filtered = contratos.filter(c => filter === 'todos' || c.status === filter);

  return (
    <div>
      {showModal && <NovoContratoModal onClose={() => setShowModal(false)}/>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Jurídico</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Contratos</h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: `0 0 14px ${GB.redGlow}`, cursor: 'pointer' }}>
          + Novo Contrato
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Contratos ativos', value: contratos.filter(c => c.status === 'ativo').length, accent: '#22C55E' },
          { label: 'Assinados', value: contratos.filter(c => c.assinado).length, accent: '#3B82F6' },
          { label: 'Cancelados', value: contratos.filter(c => c.status === 'cancelado').length, accent: GB.red },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `2px solid ${s.accent}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['todos','ativo','cancelado','expirado'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? GB.red : 'var(--bg-card)', border: `1px solid ${filter === s ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '6px 14px', color: filter === s ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: filter === s ? 600 : 400, textTransform: 'capitalize' as const, cursor: 'pointer' }}>{s}</button>
        ))}
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Aluno', 'Plano', 'Início', 'Válido até', 'Valor', 'Status', 'Assinado', 'Ações'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.alunoNome}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.plano}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{c.dataInicio}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: c.status === 'ativo' ? '#16A34A' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {c.status === 'ativo' ? 'Em vigor' : c.dataFim || '—'}
                </td>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>€{c.valor}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ background: c.status === 'ativo' ? 'rgba(34,197,94,0.1)' : c.status === 'cancelado' ? 'rgba(200,16,46,0.1)' : 'var(--bg-elevated)', color: c.status === 'ativo' ? '#22C55E' : c.status === 'cancelado' ? GB.red : 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize' as const }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {c.assinado ? <span style={{ color: '#22C55E', fontWeight: 600 }}>✓ {c.dataAssinatura}</span> : <span style={{ color: '#F59E0B' }}>⏳ Pendente</span>}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5, padding: '4px 9px', color: '#3B82F6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📄 PDF</button>
                    {!c.assinado && <button style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, padding: '4px 9px', color: '#22C55E', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✍ Assinar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
