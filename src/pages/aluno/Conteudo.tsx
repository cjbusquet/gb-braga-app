import { useState } from 'react';
import { GB, beltConfig } from '../../lib/gbBrand';
import { Ico, MagnifyingGlassIcon } from '../../lib/icons';
import PortalPageHeader from './PortalPageHeader';

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
      <PortalPageHeader
        title="Conteúdo Técnico"
        description="Explora técnicas e conteúdos para complementar o teu treino."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="flex-1 relative min-w-[200px]">
        <Ico icon={MagnifyingGlassIcon} className="absolute left-[11px] top-2.5 text-muted" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar técnica..."
          aria-label="Pesquisar técnica"
          className="box-border py-2 pr-3 pl-8 w-full text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-card text-primary min-h-11 sm:min-h-0 focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"/>
        </div>
        {['todos','branca','azul','roxa','marrom','preta'].map(n => (
          <button key={n} onClick={() => setFilterNivel(n)}
            className={[
              'flex gap-1.5 items-center py-1.5 px-3 min-h-11 sm:min-h-0 text-xs capitalize rounded-sm border cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              filterNivel === n ? 'font-semibold text-white bg-gb-red border-gb-red active:bg-gb-red-dark' : 'font-normal text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            {n !== 'todos' && <div className="w-2.5 h-1 rounded-[1px]" style={{ background: beltConfig[n]?.bg || '#888', border: n === 'branca' ? '1px solid #555' : 'none' }}/>}
            {n === 'todos' ? 'Todos' : beltConfig[n]?.label}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {filtered.map(v => {
          const bc = beltConfig[v.nivel];
          const isPlaying = playing === v.id;
          return (
            <div key={v.id}
              className="overflow-hidden rounded-lg border cursor-pointer transition-shadow duration-200 shadow-xs hover:shadow-md"
              style={{ borderColor: isPlaying ? GB.red + '50' : 'var(--border)', boxShadow: isPlaying ? `0 0 20px ${GB.redGlow}` : undefined }}
              onClick={() => setPlaying(isPlaying ? null : v.id)}>
              {/* Thumbnail */}
              <div
                className="flex relative justify-center items-center h-[130px]"
                style={{ background: isPlaying ? `radial-gradient(ellipse at center, ${GB.red}33 0%, #0D0D0F 70%)` : 'radial-gradient(ellipse at center, #1A1A1E 0%, #0D0D0F 100%)' }}
              >
                <div
                  className="flex justify-center items-center w-12 h-12 text-xl rounded-full border-2 transition-all"
                  style={{ background: isPlaying ? GB.red : 'rgba(255,255,255,0.08)', borderColor: isPlaying ? GB.red : 'rgba(255,255,255,0.12)' }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </div>
                <div className="absolute top-2.5 right-2.5 py-0.5 px-[7px] rounded bg-black/60">
                  <span className="font-mono text-[10.5px] text-white">{v.duracao}</span>
                </div>
                <div className="absolute right-0 bottom-0 left-0 h-[3px]" style={{ background: bc?.bg || '#888' }}/>
              </div>
              <div className="pt-3.5 px-3.5 pb-4">
                <div className="flex gap-1.5 items-center mb-1.5">
                  <div className="w-3.5 h-[5px] rounded-[1px] shrink-0" style={{ background: bc?.bg || '#888', border: v.nivel === 'branca' ? '1px solid #555' : 'none' }}/>
                  <span className="text-[10.5px] capitalize text-muted">{bc?.label}</span>
                </div>
                <div className="mb-1 text-[13.5px] font-semibold leading-[1.3] text-primary">{v.titulo}</div>
                <div className="mb-2 text-[11.5px] leading-[1.4] text-muted">{v.desc}</div>
                <div className="text-[10.5px] text-muted">Prof. {v.prof}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
