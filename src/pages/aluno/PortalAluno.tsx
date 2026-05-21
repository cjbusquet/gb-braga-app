import { useState } from 'react';
import { useAlunos, usePagamentos, usePresencas } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { GB, beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import type { Belt } from '../../types';

const BELT_PATH: Belt[] = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'];

function NavCard({ icon, label, desc, accent, onClick }: { icon: string; label: string; desc: string; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '60'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: accent, borderRadius: '4px 0 0 4px' }}/>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{desc}</div>
      </div>
      <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 14 }}>→</div>
    </button>
  );
}

export default function PortalAluno({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const { data: presencas } = usePresencas();
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  const minhasPresencas = presencas.filter(p => p.alunoId === aluno.id);
  const proximoPagamento = pagamentos.find(p => p.status === 'pendente' || p.status === 'vencido');

  const bc = beltConfig[aluno.faixa];
  const beltIdx = BELT_PATH.indexOf(aluno.faixa);
  const progressoPct = ((beltIdx / (BELT_PATH.length - 1)) * 60) + ((aluno.grau / 4) * (60 / BELT_PATH.length));

  return (
    <div>
      {/* Edit Profile Modal */}
      {showEditPerfil && (
        <div onClick={()=>setShowEditPerfil(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:500, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ color:'var(--text-primary)', fontSize:15, fontWeight:800 }}>Editar Dados Pessoais</div>
              <button onClick={()=>setShowEditPerfil(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
            </div>
            {[['Nome completo',aluno.nome],['Email',aluno.email],['Telefone',aluno.telefone],['WhatsApp',aluno.whatsapp||'']].map(([k,v])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ display:'block', color:'var(--text-muted)', fontSize:10.5, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:4 }}>{k}</label>
                <input defaultValue={v} style={{ width:'100%', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 11px', color:'var(--text-primary)', fontSize:13, boxSizing:'border-box' }}
                  onFocus={e=>(e.target.style.borderColor='var(--gb-red)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={()=>setShowEditPerfil(false)} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={()=>setShowEditPerfil(false)} style={{ flex:2, background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'10px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Contract Modal */}
      {showContrato && (
        <div onClick={()=>setShowContrato(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:28, maxWidth:560, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ color:'var(--text-primary)', fontSize:15, fontWeight:800 }}>Contrato de Adesão</div>
              <button onClick={()=>setShowContrato(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'16px 20px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.8, marginBottom:18 }}>
              <p><strong>Tribo Laurada Lda.</strong> (NIF 518948471) · Gracie Barra Braga<br/>
              Rua Nova de Santa Cruz, 11 – 4710-409 Braga</p>
              <p>O aluno <strong>{aluno.nome}</strong> comprometeu-se a:</p>
              <ul style={{ marginLeft:18, marginBottom:10 }}>
                <li>Efetuar o pagamento da mensalidade até ao dia 5 de cada mês</li>
                <li>Utilizar o uniforme oficial da Gracie Barra durante os treinos</li>
                <li>Cumprir o regulamento interno da escola</li>
                <li>Declarar estar fisicamente apto para a prática do Jiu-Jitsu</li>
              </ul>
              <p style={{ color:'var(--text-muted)', fontSize:11.5 }}>Contrato em vigor desde {aluno.dataMatricula}.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>{ alert('📄 Contrato enviado para ' + aluno.email); setShowContrato(false); }} style={{ flex:1, background:'var(--gb-red)', border:'none', borderRadius:'var(--radius-sm)', padding:'10px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                📧 Enviar por email
              </button>
              <button onClick={()=>{ alert('📥 Download iniciado: contrato_' + aluno.nome.replace(' ','_') + '.pdf'); }} style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>
                📥 Download PDF
              </button>
              <button onClick={()=>{ if(window.confirm('Cancelar subscrição?\n\nA tua conta ficará inativa no fim do período pago. Tens a certeza?')) { alert('Pedido de cancelamento registado. Entraremos em contacto.'); setShowContrato(false); }}} style={{ flex:1, background:'rgba(200,16,46,0.08)', border:'1px solid rgba(200,16,46,0.2)', borderRadius:'var(--radius-sm)', padding:'10px', color:'var(--gb-red)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                ⚠️ Cancelar subscrição
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── rest of portal ── */}
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #0D0508 0%, rgba(200,16,46,0.25) 100%)`, border: '1px solid rgba(200,16,46,0.2)', borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        {/* Belt stripe at very bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: bc?.bg || '#888', opacity: 0.8 }}/>
        {/* Subtle grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Bem-vindo de volta</div>
            <h1 style={{ color: '#fff', fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: 0, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{aluno.nome}</h1>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 5 }}>Membro desde {aluno.dataMatricula}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 11, background: bc?.bg || '#888', borderRadius: 3, border: aluno.faixa === 'branca' ? '1px solid #555' : 'none', boxShadow: `0 0 14px ${(bc?.bg || '#888')}88`, flexShrink: 0 }}/>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{bc?.label} · {aluno.grau}° Grau</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>{aluno.plano}</span>
            </div>
          </div>

          {/* Belt progression circle */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <svg width={isMobile ? 68 : 80} height={isMobile ? 68 : 80} viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke={bc?.bg || GB.red} strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 34 * progressoPct / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round" transform="rotate(-90 40 40)" style={{ opacity: 0.9 }}/>
              <text x="40" y="36" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="DM Sans, sans-serif">{aluno.grau}/4</text>
              <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="DM Sans, sans-serif">GRAU</text>
            </svg>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 4 }}>progresso</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
        {[
          { label: 'Aulas este mês', value: minhasPresencas.length, accent: GB.red },
          { label: 'Frequência',     value: `${aluno.frequencia}%`, accent: aluno.frequencia >= 80 ? '#22C55E' : '#F59E0B' },
          { label: 'Grau na faixa',  value: `${aluno.grau}/4`, accent: '#A78BFA' },
          { label: 'Dias de treino', value: '842', accent: '#3B82F6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `2px solid ${s.accent}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment alert */}
      {proximoPagamento && (
        <div style={{ background: proximoPagamento.status === 'vencido' ? 'rgba(200,16,46,0.08)' : 'rgba(245,158,11,0.07)', border: `1px solid ${proximoPagamento.status === 'vencido' ? 'rgba(200,16,46,0.3)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ color: proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
                {proximoPagamento.status === 'vencido' ? '⚠️ Pagamento em atraso' : '💳 Mensalidade a vencer'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{proximoPagamento.plano} · Vence {proximoPagamento.vencimento}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>€{proximoPagamento.valor}</span>
              <button style={{ background: '#635BFF', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 16px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 14px rgba(99,91,255,0.3)', whiteSpace: 'nowrap' }}>Pagar agora</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 8 : 10, marginBottom: 16 }}>
        <NavCard icon="📅" label="Minhas Aulas"   desc="Horários e presenças"   accent="#3B82F6" onClick={() => onNavigate?.('minhas-aulas')}/>
        <NavCard icon="🎖️" label="Minha Evolução" desc="Faixa e graduações"     accent="#A78BFA" onClick={() => onNavigate?.('evolucao')}/>
        <NavCard icon="💳" label="Financeiro"     desc="Pagamentos e faturas"   accent="#22C55E" onClick={() => onNavigate?.('meu-financeiro')}/>
        <NavCard icon="🎥" label="Conteúdo"       desc="Técnicas e vídeos"     accent={GB.red}   onClick={() => onNavigate?.('conteudo')}/>
        <NavCard icon="💬" label="Mensagens"      desc="Comunicação"           accent="#F59E0B"  onClick={() => onNavigate?.('mensagens')}/>
        <NavCard icon="🏆" label="Graduação"      desc="Próxima cerimónia"     accent="#EAB308"  onClick={() => onNavigate?.('evolucao')}/>
        <NavCard icon="⚙️" label="Minha Conta"    desc="Editar dados pessoais"  accent="#6B7280"  onClick={() => setShowEditPerfil(true)}/>
        <NavCard icon="📄" label="Meu Contrato"   desc="Ver e descarregar"      accent="#7C3AED"  onClick={() => setShowContrato(true)}/>
      </div>

      {/* Recent activity */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>Atividade Recente</div>
        {minhasPresencas.length > 0 ? minhasPresencas.slice(0, 4).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{p.turmaNome}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.data} às {p.hora}</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{p.metodo}</span>
          </div>
        )) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Sem atividade recente</p>
        )}
      </div>
    </div>
  );
}
