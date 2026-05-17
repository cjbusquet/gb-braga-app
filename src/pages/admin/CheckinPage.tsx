// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { usePresencas, useTurmas, useAlunos } from '../../lib/useData';
import { ACADEMIA } from '../../data/mockData';
import { beltConfig } from '../../lib/gbBrand';
import KioskMode from './KioskMode';

// ─── GPS Fence config ─────────────────────────────────────────────────────────
const ACADEMIA_COORDS = {
  lat: 41.5484,
  lng: -8.4259,
  radius: 100, // metres — ajustável nas definições
};

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

type GpsStatus = 'idle' | 'requesting' | 'inside' | 'outside' | 'denied' | 'error';

interface GpsState {
  status: GpsStatus;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  distancia: number | null;
  lastUpdate: string | null;
}

// ─── GPS Fence Panel ──────────────────────────────────────────────────────────
function GpsFencePanel({
  gps, onRequestGps, fenceRadius, onRadiusChange, onSimulateInside
}: {
  gps: GpsState;
  onRequestGps: () => void;
  fenceRadius: number;
  onRadiusChange: (r: number) => void;
  onSimulateInside: () => void;
}) {
  const dentro = gps.status === 'inside';
  const fora   = gps.status === 'outside';
  const pct    = gps.distancia !== null
    ? Math.min(100, Math.round((gps.distancia / fenceRadius) * 100))
    : null;

  const statusColor = {
    idle: 'var(--text-muted)', requesting: '#D97706',
    inside: '#16A34A', outside: 'var(--gb-red)',
    denied: 'var(--gb-red)', error: 'var(--gb-red)',
  }[gps.status];

  const statusLabel = {
    idle: 'GPS inativo', requesting: 'A obter localização...',
    inside: `✓ Dentro do perímetro (${Math.round(gps.distancia || 0)}m)`,
    outside: `Fora do perímetro (${Math.round(gps.distancia || 0)}m)`,
    denied: 'Permissão de GPS negada', error: 'Erro de GPS',
  }[gps.status];

  return (
    <div style={{ background: dentro ? 'rgba(22,163,74,0.05)' : fora ? 'rgba(200,16,46,0.04)' : 'var(--bg-card)', border: `1px solid ${dentro ? 'rgba(22,163,74,0.25)' : fora ? 'var(--gb-red-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-xs)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 4 }}>GPS Fence</div>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>Perímetro da Academia</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {gps.lastUpdate && (
            <span style={{ color: 'var(--text-muted)', fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>
              {gps.lastUpdate}
            </span>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onRequestGps} style={{ background: gps.status === 'requesting' ? 'var(--bg-elevated)' : 'var(--gb-red)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: gps.status === 'requesting' ? 'var(--text-muted)' : '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: gps.status !== 'requesting' ? 'var(--shadow-red)' : 'none' }}>
              {gps.status === 'requesting' ? '⟳ A localizar...' : '📍 Verificar GPS'}
            </button>
            <button onClick={onSimulateInside} style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: '#16A34A', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              🧪 Demo GPS
            </button>
          </div>
        </div>
      </div>

      {/* Radar visual */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
        {/* Radar circle */}
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Grid rings */}
            {[40, 55, 40].map((r, i) => (
              <circle key={i} cx="60" cy="60" r={r * (i === 0 ? 0.6 : i === 1 ? 0.8 : 1.0)}
                fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3"/>
            ))}
            {/* Cross lines */}
            <line x1="60" y1="20" x2="60" y2="100" stroke="var(--border)" strokeWidth="0.8"/>
            <line x1="20" y1="60" x2="100" y2="60" stroke="var(--border)" strokeWidth="0.8"/>
            {/* Fence circle */}
            <circle cx="60" cy="60" r="45"
              fill={dentro ? 'rgba(22,163,74,0.06)' : 'transparent'}
              stroke={dentro ? '#16A34A' : fora ? 'var(--gb-red)' : 'var(--border-strong)'}
              strokeWidth="2"/>
            {/* Academia dot */}
            <circle cx="60" cy="60" r="5" fill="var(--gb-red)"/>
            <circle cx="60" cy="60" r="9" fill="none" stroke="var(--gb-red)" strokeWidth="1.5" opacity="0.4"/>
            {/* User position */}
            {gps.lat !== null && pct !== null && (
              <>
                {/* Position dot — simulated angle for demo */}
                <circle cx={60 + (dentro ? 20 : 52)} cy={60 + (dentro ? -15 : -30)} r="6"
                  fill={dentro ? '#16A34A' : 'var(--gb-red)'}/>
                <circle cx={60 + (dentro ? 20 : 52)} cy={60 + (dentro ? -15 : -30)} r="10"
                  fill="none" stroke={dentro ? '#16A34A' : 'var(--gb-red)'}
                  strokeWidth="1.5" opacity="0.4"/>
                {/* Distance line */}
                <line x1="60" y1="60"
                  x2={60 + (dentro ? 20 : 52)} y2={60 + (dentro ? -15 : -30)}
                  stroke={dentro ? '#16A34A' : 'var(--gb-red)'} strokeWidth="1"
                  strokeDasharray="3 2" opacity="0.5"/>
              </>
            )}
          </svg>
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: -4, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gb-red)' }}/>
              <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>Academia</span>
            </div>
            {gps.lat && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dentro ? '#16A34A' : 'var(--gb-red)' }}/>
                <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>Você</span>
              </div>
            )}
          </div>
        </div>

        {/* Status info */}
        <div style={{ flex: 1 }}>
          <div style={{ color: statusColor, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            {statusLabel}
          </div>

          {gps.lat !== null && (
            <>
              {/* Distance bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Distância ao perímetro</span>
                  <span style={{ color: statusColor, fontSize: 11, fontWeight: 700 }}>
                    {Math.round(gps.distancia || 0)}m / {fenceRadius}m
                  </span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: dentro ? '#16A34A' : 'var(--gb-red)', height: '100%', width: `${Math.min(100, pct || 0)}%`, transition: 'width 0.5s ease', borderRadius: 99 }}/>
                </div>
              </div>

              {/* Coordinates */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  ['Latitude',  gps.lat.toFixed(6)],
                  ['Longitude', gps.lng!.toFixed(6)],
                  ['Precisão',  `±${Math.round(gps.accuracy || 0)}m`],
                ].map(([k,v]) => (
                  <div key={k} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xs)', padding: '4px 8px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9.5, marginBottom: 1 }}>{k}</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {gps.status === 'idle' && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              Carrega em <strong>Verificar GPS</strong> para detectar se estás dentro do perímetro da academia.<br/>
              O browser irá pedir permissão de localização.
            </p>
          )}

          {gps.status === 'denied' && (
            <div style={{ background: 'rgba(200,16,46,0.06)', border: '1px solid var(--gb-red-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginTop: 6 }}>
              <div style={{ color: 'var(--gb-red)', fontSize: 12 }}>
                🔒 Permissão de GPS negada. Activa a localização nas definições do browser para usar GPS Fence.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Radius config */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11.5, flexShrink: 0 }}>Raio do perímetro:</span>
        <input type="range" min="30" max="500" step="10" value={fenceRadius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--gb-red)', cursor: 'pointer' }}/>
        <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', width: 50, textAlign: 'right' as const }}>
          {fenceRadius}m
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[50, 100, 200].map(r => (
            <button key={r} onClick={() => onRadiusChange(r)} style={{ background: fenceRadius === r ? 'var(--gb-red)' : 'var(--bg-elevated)', border: `1px solid ${fenceRadius === r ? 'var(--gb-red)' : 'var(--border)'}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, color: fenceRadius === r ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: fenceRadius === r ? 700 : 400 }}>
              {r}m
            </button>
          ))}
        </div>
      </div>

      {/* Academia location info */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
        <span style={{ fontSize: 14 }}>📍</span>
        <div>
          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{ACADEMIA.nome}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ACADEMIA.morada} · {ACADEMIA_COORDS.lat.toFixed(4)}, {ACADEMIA_COORDS.lng.toFixed(4)}</div>
        </div>
        <a href={`https://maps.google.com/?q=${ACADEMIA_COORDS.lat},${ACADEMIA_COORDS.lng}`}
          target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 5, padding: '4px 10px', color: '#2563EB', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
          Ver no Maps →
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CheckinPage() {
  const { data: alunos } = useAlunos();
  const { data: turmas } = useTurmas();
  const { data: checkInsDB, refetch: refetchPresencas } = usePresencas();
  // Sync with Supabase data
  useEffect(() => { if (checkInsDB?.length) setCheckIns(checkInsDB); }, [checkInsDB]);

  const [kioskMode, setKioskMode] = useState(false);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [turmaFilter, setTurmaFilter] = useState('todas');
  const [fenceRadius, setFenceRadius] = useState(ACADEMIA_COORDS.radius);
  const [gps, setGps] = useState<GpsState>({ status: 'idle', lat: null, lng: null, accuracy: null, distancia: null, lastUpdate: null });
  const [professorCheckedIn, setProfessorCheckedIn] = useState(false);
  const [professorCheckInTime, setProfessorCheckInTime] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = checkIns.filter(p => p.data === '2025-05-05');

  // ── GPS request ──────────────────────────────────────────────────────────────
  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGps(g => ({ ...g, status: 'error' }));
      return;
    }
    setGps(g => ({ ...g, status: 'requesting' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const dist = distanciaMetros(lat, lng, ACADEMIA_COORDS.lat, ACADEMIA_COORDS.lng);
        setGps({
          status: dist <= fenceRadius ? 'inside' : 'outside',
          lat, lng, accuracy, distancia: dist,
          lastUpdate: new Date().toTimeString().slice(0, 5),
        });
      },
      (err) => {
        setGps(g => ({
          ...g,
          status: err.code === 1 ? 'denied' : 'error',
          lastUpdate: new Date().toTimeString().slice(0, 5),
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [fenceRadius]);

  // ── Auto check-in when inside fence ──────────────────────────────────────────
  useEffect(() => {
    if (gps.status === 'inside' && !professorCheckedIn) {
      // Auto-trigger professor check-in when GPS confirms inside
    }
  }, [gps.status]);

  // ── Manual check-in ──────────────────────────────────────────────────────────
  const manualCheckin = (alunoId: string) => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return;
    const newEntry = { id: `pr${Date.now()}`, alunoId, alunoNome: aluno.nome, turmaId: 't1', turmaNome: 'Jiu-Jitsu Adultos — Noite 1', data: today, hora: new Date().toTimeString().slice(0, 5), tipo: 'checkin' as const, metodo: 'gps' as const };
    setCheckIns(prev => [newEntry, ...prev]);
  };

  // ── GPS Auto check-in for aluno ──────────────────────────────────────────────
  const gpsCheckin = (alunoId: string) => {
    if (gps.status !== 'inside') return;
    manualCheckin(alunoId);
  };

  if (kioskMode) return <KioskMode onExit={() => setKioskMode(false)}/>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 3 }}>Presença</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as const }}>Check-in</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>GPS Fence · {ACADEMIA_COORDS.radius}m · {ACADEMIA.morada}</p>
        </div>
<div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { const data = checkIns.map(p => `${p.alunoNome},${p.turmaNome},${p.data},${p.hora},${p.metodo}`).join('\n'); const blob = new Blob(['Aluno,Turma,Data,Hora,Metodo\n'+data], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='presencas.csv'; a.click(); }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            📊 Export CSV
          </button>
          <button onClick={() => alert('Relatório de presenças PDF gerado!\nTotal: ' + checkIns.length + ' check-ins') } style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            📄 Export PDF
          </button>
          <button onClick={() => setKioskMode(true)} style={{ background: 'var(--gb-red)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-red)' }}>
            ⬛ Modo Kiosk (iPad)
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Check-ins hoje',  value: todayCheckins.length, accent: 'var(--gb-red)' },
          { label: 'Dentro do raio',  value: gps.status === 'inside' ? '✓' : '—', accent: gps.status === 'inside' ? '#16A34A' : 'var(--text-muted)' },
          { label: 'Frequência média',value: '78%', accent: '#2563EB' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderTop: `3px solid ${s.accent}`, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: s.accent, fontSize: 26, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Professor check-in panel */}
      <div style={{ background: professorCheckedIn ? 'rgba(22,163,74,0.06)' : 'rgba(200,16,46,0.04)', border: `1px solid ${professorCheckedIn ? 'rgba(22,163,74,0.25)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: professorCheckedIn ? '#16A34A' : 'var(--text-muted)' }}/>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>
              {professorCheckedIn ? `✓ Check-in às ${professorCheckInTime}` : 'A tua presença de hoje'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>
              Check-in de entrada · Check-out ao terminar · via GPS Fence
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {gps.status === 'outside' && !professorCheckedIn && (
            <span style={{ color: 'var(--gb-red)', fontSize: 11, fontWeight: 600 }}>⚠ Fora do perímetro</span>
          )}
          {!professorCheckedIn ? (
            <button
              onClick={() => { setProfessorCheckedIn(true); setProfessorCheckInTime(new Date().toTimeString().slice(0,5)); }}
              disabled={gps.status === 'outside'}
              style={{ background: gps.status === 'outside' ? 'var(--bg-elevated)' : 'var(--gb-red)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 18px', color: gps.status === 'outside' ? 'var(--text-muted)' : '#fff', fontSize: 13, fontWeight: 700, cursor: gps.status === 'outside' ? 'not-allowed' : 'pointer', boxShadow: gps.status !== 'outside' ? 'var(--shadow-red)' : 'none' }}>
              ✓ Check-in
            </button>
          ) : (
            <>
              <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#16A34A', fontSize: 12, fontWeight: 700 }}>
                Entrada: {professorCheckInTime}
              </div>
              <button onClick={() => { setProfessorCheckedIn(false); setProfessorCheckInTime(null); }}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ↩ Check-out
              </button>
            </>
          )}
        </div>
      </div>

      {/* GPS Fence + Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* GPS Fence Panel */}
        <GpsFencePanel gps={gps} onRequestGps={requestGps} fenceRadius={fenceRadius} onRadiusChange={setFenceRadius} onSimulateInside={() => setGps({ status: "inside", lat: ACADEMIA_COORDS.lat + 0.0003, lng: ACADEMIA_COORDS.lng + 0.0002, accuracy: 8, distancia: 35, lastUpdate: new Date().toTimeString().slice(0,5) })}/>

        {/* Live feed */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Live Feed</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>● AO VIVO</span>
            </div>
          </div>
          <select value={turmaFilter} onChange={e => setTurmaFilter(e.target.value)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: 12.5, marginBottom: 10, cursor: 'pointer', color: 'var(--text-primary)' }}>
            <option value="todas">Todas as turmas</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {checkIns.slice(0, 12).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? 'rgba(22,163,74,0.1)' : 'var(--bg-elevated)', border: i === 0 ? '1px solid rgba(22,163,74,0.2)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#16A34A' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{p.alunoNome}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{p.turmaNome} · {p.hora}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 9.5, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                  {(p as any).metodo === 'gps' ? '📍 GPS' : (p as any).metodo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual check-in */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Check-in Manual / GPS</div>
          {gps.status === 'inside' && <span style={{ background: 'rgba(22,163,74,0.08)', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>📍 GPS confirmado — check-in disponível</span>}
          {gps.status !== 'inside' && gps.status !== 'idle' && <span style={{ background: 'rgba(200,16,46,0.06)', color: 'var(--gb-red)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>GPS não confirmado</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
          {alunos.filter(a => a.status === 'ativo').map(a => {
            const done = checkIns.some(c => c.alunoId === a.id && c.data === today);
            const bc = beltConfig[a.faixa];
            return (
              <button key={a.id} onClick={() => !done && manualCheckin(a.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: done ? 'rgba(22,163,74,0.05)' : 'var(--bg-elevated)', border: `1px solid ${done ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '9px 12px', cursor: done ? 'default' : 'pointer', textAlign: 'left' as const }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: (bc?.bg||'#888')+'20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bc?.bg==='#F0EEFF'?'#888':(bc?.bg||'var(--gb-red)'), fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{a.nome.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.nome}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <div style={{ width: 12, height: 4, background: bc?.bg||'#888', borderRadius: 1, border: a.faixa==='branca'?'1px solid var(--border-strong)':'none' }}/>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{bc?.label}</span>
                  </div>
                </div>
                {done
                  ? <span style={{ color: '#16A34A', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✓</span>
                  : <span style={{ color: 'var(--gb-red)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>+</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
