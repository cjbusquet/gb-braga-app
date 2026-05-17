/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePresencas, useAlunos, useTurmas, db } from '../../lib/useData';
import { GB } from '../../lib/gbBrand';

const ACADEMIA_LAT = 41.5484, ACADEMIA_LNG = -8.4259;

function distanciaM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function CheckinPage() {
  const { data: alunos }   = useAlunos();
  const { data: turmas }   = useTurmas();
  const { data: presencasDB, refetch } = usePresencas();
  const checkIns = presencasDB ?? [];
  const [tab, setTab]           = useState<'gps'|'manual'|'live'>('live');
  const [gpsStatus, setGpsStatus] = useState<'idle'|'checking'|'inside'|'outside'|'denied'>('idle');
  const [gpsDist, setGpsDist]   = useState<number|null>(null);
  const [fenceRadius, setFenceRadius] = useState(100);
  const [, setKioskMode] = useState(false);
  const [, setTurmaFilter] = useState('');

  const checkGPS = () => {
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = distanciaM(pos.coords.latitude, pos.coords.longitude, ACADEMIA_LAT, ACADEMIA_LNG);
        setGpsDist(Math.round(dist));
        setGpsStatus(dist <= fenceRadius ? 'inside' : 'outside');
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const demoGPS = () => {
    setGpsDist(35); setGpsStatus('inside');
  };

  const doCheckin = async (alunoId: string, alunoNome: string, turmaId?: string, turmaNome?: string) => {
    const nova = {
      id: `ci${Date.now()}`, alunoId, alunoNome,
      turmaId: turmaId||'', turmaNome: turmaNome||'',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0,5),
      tipo: 'checkin', metodo: gpsStatus==='inside' ? 'gps' : 'manual',
    };
    try {
      await db.registarPresenca({ alunoId, alunoNome, turmaId, turmaNome, metodo: nova.metodo, gpsDist: gpsDist??undefined });
      refetch();
    } catch(e) { console.error('checkin error:', e); }
  };

  const exportCSV = () => {
    const rows = checkIns.map(p => `${p.alunoNome},${p.turmaNome||''},${p.data},${p.hora},${p.metodo}`);
    const blob = new Blob(['Aluno,Turma,Data,Hora,Método\n'+rows.join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `presencas_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const todayCheckins = checkIns.filter(p => p.data === new Date().toISOString().split('T')[0]);

  const gpsColor = { idle:'var(--text-muted)', checking:'#F59E0B', inside:'#22C55E', outside:GB.red, denied:'#9CA3AF' }[gpsStatus];
  const gpsLabel = { idle:'Verificar GPS', checking:'A verificar...', inside:'✓ Dentro do perímetro', outside:`✗ Fora (${gpsDist}m)`, denied:'GPS negado' }[gpsStatus];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <div style={{ color:'var(--text-muted)', fontSize:10.5, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Academia</div>
          <h1 style={{ color:'var(--text-primary)', fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', textTransform:'uppercase' }}>Check-in</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 14px', color:'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
            📊 Export CSV
          </button>
          <button onClick={() => setKioskMode(true)} style={{ background:GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>
            ⬛ Kiosk
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {([['live','● Live'],['gps','GPS Fence'],['manual','Manual']] as const).map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===id?GB.red:'transparent'}`, padding:'8px 16px', color:tab===id?GB.red:'var(--text-muted)', fontSize:13, fontWeight:tab===id?700:400, cursor:'pointer', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* LIVE */}
      {tab === 'live' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', animation:'pulse 1.5s infinite' }}/>
            <span style={{ color:'var(--text-muted)', fontSize:12 }}>Hoje: {todayCheckins.length} check-ins</span>
          </div>
          {checkIns.slice(0,20).map((p: any) => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', marginBottom:6 }}>
              <div>
                <div style={{ color:'var(--text-primary)', fontSize:13, fontWeight:600 }}>{p.alunoNome}</div>
                <div style={{ color:'var(--text-muted)', fontSize:11 }}>{p.turmaNome||'—'} · {p.metodo}</div>
              </div>
              <div style={{ textAlign:'right', color:'var(--text-muted)', fontSize:12 }}>
                {p.hora}<br/><span style={{ fontSize:10 }}>{p.data}</span>
              </div>
            </div>
          ))}
          {checkIns.length === 0 && <div style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>Sem check-ins hoje</div>}
        </div>
      )}

      {/* GPS */}
      {tab === 'gps' && (
        <div style={{ maxWidth:500 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24, marginBottom:16 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ width:80, height:80, borderRadius:'50%', border:`3px solid ${gpsColor}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:28 }}>
                📍
              </div>
              <div style={{ color:gpsColor, fontSize:14, fontWeight:700 }}>{gpsLabel}</div>
              {gpsDist !== null && <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>{gpsDist}m da academia</div>}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:16 }}>
              <button onClick={checkGPS} disabled={gpsStatus==='checking'}
                style={{ background:GB.red, border:'none', borderRadius:'var(--radius-sm)', padding:'10px 20px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                📍 Verificar GPS
              </button>
              <button onClick={demoGPS}
                style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 16px', color:'var(--text-secondary)', fontSize:12.5, cursor:'pointer' }}>
                🧪 Demo
              </button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ color:'var(--text-muted)', fontSize:11, fontWeight:600 }}>Raio: {fenceRadius}m</label>
              <input type="range" min={30} max={500} value={fenceRadius} onChange={e => setFenceRadius(parseInt(e.target.value))}
                style={{ width:'100%', accentColor:GB.red }}/>
            </div>
            <button onClick={() => gpsStatus==='inside' && doCheckin('me','Utilizador Actual')}
              disabled={gpsStatus !== 'inside'}
              style={{ width:'100%', background:gpsStatus==='inside'?GB.red:'#aaa', border:'none', borderRadius:'var(--radius-sm)', padding:'11px', color:'#fff', fontSize:13, fontWeight:700, cursor:gpsStatus==='inside'?'pointer':'not-allowed' }}>
              ✓ Check-in Pessoal
            </button>
          </div>
        </div>
      )}

      {/* MANUAL */}
      {tab === 'manual' && (
        <div>
          <div style={{ marginBottom:12 }}>
            <select onChange={e => setTurmaFilter(e.target.value)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'8px 12px', color:'var(--text-primary)', fontSize:13, cursor:'pointer' }}>
              <option value="">Todas as turmas</option>
              {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:8 }}>
            {alunos.filter((a: any) => a.status === 'ativo').map((a: any) => {
              const jaFez = checkIns.some(p => p.alunoId === a.id && p.data === new Date().toISOString().split('T')[0]);
              return (
                <button key={a.id} onClick={() => !jaFez && doCheckin(a.id, a.nome)}
                  disabled={jaFez}
                  style={{ background:jaFez?'rgba(34,197,94,0.08)':'var(--bg-card)', border:`1px solid ${jaFez?'rgba(34,197,94,0.3)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 14px', cursor:jaFez?'default':'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left' }}>
                  <span style={{ color:'var(--text-primary)', fontSize:13 }}>{a.nome}</span>
                  {jaFez ? <span style={{ color:'#22C55E', fontSize:16 }}>✓</span> : <span style={{ color:'var(--text-muted)', fontSize:20 }}>+</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
