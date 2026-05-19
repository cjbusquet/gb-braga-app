import { useState } from 'react';
import { GB, beltConfig } from '../../lib/gbBrand';

const VIDEOS = [
  { id: 1, titulo: 'Fundamentos da Guarda Fechada', nivel: 'branca', duracao: '45min', prof: 'João Santos', desc: 'Posição básica, saídas e controlo de distância.' },
  { id: 2, titulo: 'Passagem de Guarda Toreando', nivel: 'azul', duracao: '32min', prof: 'João Santos', desc: 'Técnica de passagem lateral com controlo de quadril.' },
  { id: 3, titulo: 'Triângulo do Monte', nivel: 'roxa', duracao: '28min', prof: 'Bruno Tavares', desc: 'Setup, finalização e defesa do triângulo.' },
  { id: 4, titulo: 'De La Riva — Série completa', nivel: 'azul', duracao: '62min', prof: 'Fernanda Rocha', desc: 'Sistema completo de guarda De La Riva — 4 episódios.' },
  { id: 5, titulo: 'Back Take Series', nivel: 'marrom', duracao: '55min', prof: 'João Santos', desc: 'Sequências para tomar as costas do adversário.' },
  { id: 6, titulo: 'Leg Locks — Heel Hook Entry', nivel: 'preta', duracao: '40min', prof: 'Bruno Tavares', desc: 'Entradas seguras e controlo para leg locks.' },
  { id: 7, titulo: 'Kimura — Ataque e Defesa', nivel: 'branca', duracao: '24min', prof: 'Fernanda Rocha', desc: 'Mecânica completa do kimura de todas as posições.' },
  { id: 8, titulo: 'Sistema de Joelho na Barriga', nivel: 'verde', duracao: '35min', prof: 'João Santos', desc: 'Controlo, transições e finalizações.' },
];

export default function Conteudo() {
  const [filterNivel, setFilterNivel] = useState('todos');
  const [busca, setBusca] = useState('');
  const [playing, setPlaying] = useState<number | null>(null);

  const filtered = VIDEOS.filter(v =>
    (filterNivel === 'todos' || v.nivel === filterNivel) &&
    (v.titulo.toLowerCase().includes(busca.toLowerCase()) || v.desc.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Aluno</div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>Conteúdo Técnico</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Pesquisar técnica..."
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
        {['todos','branca','azul','roxa','marrom','preta'].map(n => (
          <button key={n} onClick={() => setFilterNivel(n)} style={{ background: filterNivel === n ? GB.red : 'var(--bg-card)', border: `1px solid ${filterNivel === n ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '7px 12px', color: filterNivel === n ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: filterNivel === n ? 600 : 400, textTransform: 'capitalize' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            {n !== 'todos' && <div style={{ width: 10, height: 4, background: beltConfig[n]?.bg || '#888', borderRadius: 1, border: n === 'branca' ? '1px solid #555' : 'none' }}/>}
            {n === 'todos' ? 'Todos' : beltConfig[n]?.label}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map(v => {
          const bc = beltConfig[v.nivel];
          const isPlaying = playing === v.id;
          return (
            <div key={v.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isPlaying ? GB.red + '50' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', boxShadow: isPlaying ? `0 0 20px ${GB.redGlow}` : 'var(--shadow-card)' }}
              onClick={() => setPlaying(isPlaying ? null : v.id)}>
              {/* Thumbnail */}
              <div style={{ height: 130, background: isPlaying ? `radial-gradient(ellipse at center, ${GB.red}33 0%, #0D0D0F 70%)` : 'radial-gradient(ellipse at center, #1A1A1E 0%, #0D0D0F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: isPlaying ? GB.red : 'rgba(255,255,255,0.08)', border: `2px solid ${isPlaying ? GB.red : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'all 0.2s' }}>
                  {isPlaying ? '⏸' : '▶'}
                </div>
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 7px' }}>
                  <span style={{ color: '#fff', fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{v.duracao}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: bc?.bg || '#888' }}/>
              </div>
              <div style={{ padding: '14px 14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 14, height: 5, background: bc?.bg || '#888', borderRadius: 1, border: v.nivel === 'branca' ? '1px solid #555' : 'none', flexShrink: 0 }}/>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10.5, textTransform: 'capitalize' as const }}>{bc?.label}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{v.titulo}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginBottom: 8, lineHeight: 1.4 }}>{v.desc}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>Prof. {v.prof}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
