import { useState, useEffect, useCallback } from 'react';
import { mockAlunos, mockTurmas, ACADEMIA } from '../../data/mockData';
import { beltConfig } from '../../lib/gbBrand';
import { GBIcon } from '../../components/GBLogo';
import type { Aluno } from '../../types';

const ACADEMIA_COORDS = { lat: 41.5484, lng: -8.4259, radius: 100 };

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1*Math.PI)/180, φ2 = (lat2*Math.PI)/180;
  const Δφ = ((lat2-lat1)*Math.PI)/180, Δλ = ((lon2-lon1)*Math.PI)/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

interface Props { onExit: () => void }

type CheckInState = 'idle' | 'locating' | 'success' | 'outside' | 'error';

export default function KioskMode({ onExit }: Props) {
  const [state, setState] = useState<CheckInState>('idle');
  const [lastCheckin, setLastCheckin] = useState<{nome:string;faixa:string;hora:string;dist:number}|null>(null);
  const [todayCount, setTodayCount] = useState(12);
  const [showManual, setShowManual] = useState(false);
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gpsError, setGpsError] = useState<string|null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (state === 'success' || state === 'outside' || state === 'error') {
      const t = setTimeout(() => { setState('idle'); setGpsError(null); }, 3500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const horaAtual = currentTime.getHours();
  const turmaAtual = mockTurmas.find(t => {
    const inicio = parseInt(t.horario.split(':')[0]);
    return inicio <= horaAtual && horaAtual < inicio + 2;
  }) || mockTurmas[0];

  const doCheckin = useCallback((aluno: Aluno) => {
    if (state !== 'idle') return;
    setState('locating');

    if (!navigator.geolocation) {
      // Fallback: allow manual check-in without GPS
      setState('success');
      setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, hora: new Date().toTimeString().slice(0,5), dist: 0 });
      setTodayCount(c => c+1);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = distanciaMetros(pos.coords.latitude, pos.coords.longitude, ACADEMIA_COORDS.lat, ACADEMIA_COORDS.lng);
        if (dist <= ACADEMIA_COORDS.radius) {
          setState('success');
          setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, hora: new Date().toTimeString().slice(0,5), dist: Math.round(dist) });
          setTodayCount(c => c+1);
          setShowManual(false);
          setSearch('');
        } else {
          setState('outside');
          setGpsError(`Estás a ${Math.round(dist)}m da academia. Deves estar dentro do perímetro (${ACADEMIA_COORDS.radius}m) para fazer check-in.`);
        }
      },
      () => {
        // GPS denied/error → allow manual override in kiosk
        setState('success');
        setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, hora: new Date().toTimeString().slice(0,5), dist: 0 });
        setTodayCount(c => c+1);
        setShowManual(false);
        setSearch('');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [state]);

  const filteredAlunos = mockAlunos.filter(a =>
    a.status === 'ativo' && a.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0A0A0C', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-ui)', userSelect: 'none' as const }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid #1A1A20', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GBIcon size={38} bg="#C8102E"/>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const }}>Gracie Barra Braga</div>
            <div style={{ color: '#4A4A58', fontSize: 11 }}>Check-in por GPS · {ACADEMIA.morada.split(',')[0]}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
            {currentTime.toTimeString().slice(0,5)}
          </div>
          <div style={{ color: '#4A4A58', fontSize: 11 }}>{currentTime.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ color: '#C8102E', fontSize: 28, fontWeight: 800 }}>{todayCount}</div>
            <div style={{ color: '#4A4A58', fontSize: 11 }}>check-ins hoje</div>
          </div>
          <button onClick={onExit} style={{ background: '#1A1A20', border: '1px solid #2A2A32', borderRadius: 8, padding: '8px 14px', color: '#6B6B78', fontSize: 12, cursor: 'pointer' }}>← Sair</button>
        </div>
      </div>

      {/* Active class banner */}
      <div style={{ background: '#C8102E', padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }}/>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>AULA EM CURSO</span>
        </div>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{turmaAtual.nome}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Prof. {turmaAtual.professorNome} · {turmaAtual.horario}</div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', gap: 40 }}>

        {/* GPS status + action area */}
        {!showManual && (
          <div style={{ flex: 1, maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {state === 'idle' && (
              <>
                {/* GPS radar */}
                <div style={{ width: 240, height: 240, position: 'relative', marginBottom: 24 }}>
                  <svg width="240" height="240" viewBox="0 0 240 240">
                    <circle cx="120" cy="120" r="100" fill="none" stroke="#1A1A20" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <circle cx="120" cy="120" r="70" fill="none" stroke="#1A1A20" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <circle cx="120" cy="120" r="40" fill="none" stroke="#1A1A20" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="120" y1="20" x2="120" y2="220" stroke="#1A1A20" strokeWidth="1"/>
                    <line x1="20" y1="120" x2="220" y2="120" stroke="#1A1A20" strokeWidth="1"/>
                    {/* Fence circle */}
                    <circle cx="120" cy="120" r="90" fill="rgba(200,16,46,0.06)" stroke="#C8102E" strokeWidth="2" strokeDasharray="8 4"/>
                    {/* Academia dot */}
                    <circle cx="120" cy="120" r="8" fill="#C8102E"/>
                    <circle cx="120" cy="120" r="16" fill="none" stroke="#C8102E" strokeWidth="1.5" opacity="0.4"/>
                    <circle cx="120" cy="120" r="26" fill="none" stroke="#C8102E" strokeWidth="1" opacity="0.2"/>
                    {/* Sweep animation line */}
                    <line x1="120" y1="120" x2="120" y2="30" stroke="#C8102E" strokeWidth="2" opacity="0.6" style={{ transformOrigin: '120px 120px', animation: 'sweep 3s linear infinite' }}/>
                  </svg>
                  <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center' as const }}>
                    <div style={{ color: '#C8102E', fontSize: 13, fontWeight: 700, letterSpacing: '1px' }}>📍 GPS FENCE</div>
                    <div style={{ color: '#3A3A48', fontSize: 11, marginTop: 2 }}>Raio: {ACADEMIA_COORDS.radius}m</div>
                  </div>
                </div>

                <div style={{ color: '#6B6B78', fontSize: 14, textAlign: 'center' as const, lineHeight: 1.6, maxWidth: 340, marginBottom: 20 }}>
                  Seleciona o teu nome na lista ao lado.<br/>O GPS confirma automaticamente se estás na academia.
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: '#161620', border: '1px solid #2A2A32', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8102E' }}/>
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>Academia</span>
                  </div>
                  <div style={{ background: '#161620', border: '1px solid #2A2A32', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }}/>
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>Dentro do raio</span>
                  </div>
                </div>
              </>
            )}

            {state === 'locating' && (
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ width: 80, height: 80, border: '3px solid #C8102E', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }}/>
                <div style={{ color: '#C8102E', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>A verificar localização...</div>
                <div style={{ color: '#4A4A58', fontSize: 13 }}>GPS a confirmar que estás na academia</div>
              </div>
            )}

            {state === 'success' && lastCheckin && (
              <div style={{ textAlign: 'center' as const, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', border: '3px solid rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, margin: '0 auto 20px' }}>✓</div>
                <div style={{ color: '#16A34A', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>CHECK-IN!</div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{lastCheckin.nome}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 9, background: beltConfig[lastCheckin.faixa]?.bg || '#888', borderRadius: 3, border: lastCheckin.faixa==='branca'?'1px solid #555':'none' }}/>
                  <span style={{ color: '#9CA3AF', fontSize: 14, textTransform: 'capitalize' as const }}>{beltConfig[lastCheckin.faixa]?.label}</span>
                </div>
                <div style={{ color: '#4A4A58', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{lastCheckin.hora}</div>
                {lastCheckin.dist > 0 && (
                  <div style={{ color: '#16A34A', fontSize: 12 }}>📍 {lastCheckin.dist}m da academia · GPS confirmado</div>
                )}
                <div style={{ color: '#16A34A', fontSize: 14, fontWeight: 700, marginTop: 8 }}>OSS! 🥋</div>
              </div>
            )}

            {state === 'outside' && (
              <div style={{ textAlign: 'center' as const, maxWidth: 360 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', border: '3px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>📍</div>
                <div style={{ color: '#C8102E', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Fora do perímetro</div>
                <div style={{ color: '#4A4A58', fontSize: 13, lineHeight: 1.6 }}>{gpsError}</div>
              </div>
            )}
          </div>
        )}

        {/* Aluno list */}
        <div style={{ width: showManual ? '100%' : 320, maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setShowManual(!showManual)} style={{ background: '#161620', border: '1px solid #2A2A32', borderRadius: 10, padding: '12px 18px', color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👥</span> {showManual ? '← Voltar ao GPS' : 'Selecionar Aluno'}
          </button>

          {showManual && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Pesquisar..." autoFocus
              style={{ width: '100%', background: '#161620', border: '1px solid #2A2A32', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 15, marginBottom: 12 }}/>
          )}

          <div style={{ maxHeight: showManual ? 420 : 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(showManual ? filteredAlunos : mockAlunos.filter(a => a.status === 'ativo').slice(0, 6)).map(a => {
              const bc = beltConfig[a.faixa];
              return (
                <button key={a.id} onClick={() => doCheckin(a)}
                  style={{ background: '#161620', border: '1px solid #2A2A32', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' as const }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#C8102E')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2A32')}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#C8102E20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8102E', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{a.nome.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{a.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <div style={{ width: 16, height: 5, background: bc?.bg || '#888', borderRadius: 2, border: a.faixa==='branca'?'1px solid #555':'none' }}/>
                      <span style={{ color: '#6B6B78', fontSize: 11, textTransform: 'capitalize' as const }}>{bc?.label}</span>
                    </div>
                  </div>
                  <span style={{ color: '#C8102E', fontSize: 13, fontWeight: 700 }}>📍 Check-in</span>
                </button>
              );
            })}
          </div>

          {!showManual && (
            <button onClick={() => setShowManual(true)} style={{ marginTop: 10, background: 'transparent', border: '1px solid #2A2A32', borderRadius: 8, padding: '8px', color: '#4A4A58', fontSize: 12, cursor: 'pointer' }}>
              Ver todos os alunos...
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
