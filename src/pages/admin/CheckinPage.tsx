/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePresencas, useAlunos, useTurmas, db } from '../../lib/useData';
import { Ico, ArrowDownTrayIcon, MapPinIcon, CheckIcon, PlusIcon } from '../../lib/icons';
import PageHeader from '../../components/common/PageHeader';

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

  const gpsColor = { idle:'var(--text-muted)', checking:'#F59E0B', inside:'#22C55E', outside:'var(--gb-red)', denied:'#9CA3AF' }[gpsStatus];
  const gpsLabel = { idle:'Verificar GPS', checking:'A verificar...', inside:'✓ Dentro do perímetro', outside:`✗ Fora (${gpsDist}m)`, denied:'GPS negado' }[gpsStatus];

  return (
    <div>
      <PageHeader
        eyebrow="Academia"
        title="Check-in"
        actions={<>
          <button onClick={exportCSV} className="flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border cursor-pointer border-border bg-card text-secondary transition-colors duration-200 hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            <Ico icon={ArrowDownTrayIcon} sm /> Export CSV
          </button>
          <button onClick={() => setKioskMode(true)} className="py-2.5 px-[18px] min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none shadow-red cursor-pointer bg-gb-red transition-colors duration-200 hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            Kiosk
          </button>
        </>}
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-5 border-b border-border">
        {([['live','● Live'],['gps','GPS Fence'],['manual','Manual']] as const).map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={[
              'py-2 px-4 -mb-px min-h-11 sm:min-h-0 text-[13px] bg-none border-none border-b-2 cursor-pointer whitespace-nowrap transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              tab === id ? 'font-bold border-gb-red text-gb-red' : 'font-normal border-transparent text-muted hover:text-secondary active:text-secondary',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      {/* LIVE */}
      {tab === 'live' && (
        <div>
          <div className="flex gap-2 items-center mb-3.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-[pulse_1.5s_infinite]" />
            <span className="text-xs text-muted">Hoje: {todayCheckins.length} check-ins</span>
          </div>
          {checkIns.slice(0,20).map((p: any) => (
            <div key={p.id} className="flex justify-between items-center py-2.5 px-3.5 mb-1.5 rounded-sm border border-border bg-card">
              <div>
                <div className="text-[13px] font-semibold text-primary">{p.alunoNome}</div>
                <div className="text-[11px] text-muted">{p.turmaNome||'—'} · {p.metodo}</div>
              </div>
              <div className="text-xs text-right text-muted">
                {p.hora}<br/><span className="text-[10px]">{p.data}</span>
              </div>
            </div>
          ))}
          {checkIns.length === 0 && <div className="p-10 text-center text-muted">Sem check-ins hoje</div>}
        </div>
      )}

      {/* GPS */}
      {tab === 'gps' && (
        <div className="max-w-[500px]">
          <div className="p-6 mb-4 rounded-lg border border-border bg-card">
            <div className="mb-5 text-center">
              <div
                className="flex justify-center items-center mx-auto mb-3 w-20 h-20 rounded-full border-[3px]"
                style={{ borderColor: gpsColor, color: gpsColor }}
              >
                <Ico icon={MapPinIcon} lg />
              </div>
              <div className="text-sm font-bold" style={{ color: gpsColor }}>{gpsLabel}</div>
              {gpsDist !== null && <div className="mt-1 text-xs text-muted">{gpsDist}m da academia</div>}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button onClick={checkGPS} disabled={gpsStatus==='checking'}
                className="flex gap-1.5 items-center py-2.5 px-5 min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none cursor-pointer bg-gb-red transition-colors duration-200 hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <Ico icon={MapPinIcon} sm /> Verificar GPS
              </button>
              <button onClick={demoGPS}
                className="py-2.5 px-4 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                Demo
              </button>
            </div>
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-muted">Raio: {fenceRadius}m</label>
              <input type="range" min={30} max={500} value={fenceRadius} onChange={e => setFenceRadius(parseInt(e.target.value))}
                className="w-full accent-gb-red"/>
            </div>
            <button onClick={() => gpsStatus==='inside' && doCheckin('me','Utilizador Actual')}
              disabled={gpsStatus !== 'inside'}
              className={[
                'flex gap-1.5 justify-center items-center py-2.5 w-full min-h-11 sm:min-h-0 text-[13px] font-bold text-white rounded-sm border-none transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                gpsStatus==='inside' ? 'cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'cursor-not-allowed bg-neutral-400',
              ].join(' ')}>
              <Ico icon={CheckIcon} sm /> Check-in Pessoal
            </button>
          </div>
        </div>
      )}

      {/* MANUAL */}
      {tab === 'manual' && (
        <div>
          <div className="mb-3">
            <select onChange={e => setTurmaFilter(e.target.value)} className="py-2 px-3 min-h-11 sm:min-h-0 text-[13px] rounded-sm border cursor-pointer border-border bg-card text-primary transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
              <option value="">Todas as turmas</option>
              {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {alunos.filter((a: any) => a.status === 'ativo').map((a: any) => {
              const jaFez = checkIns.some(p => p.alunoId === a.id && p.data === new Date().toISOString().split('T')[0]);
              return (
                <button key={a.id} onClick={() => !jaFez && doCheckin(a.id, a.nome)}
                  disabled={jaFez}
                  className={[
                    'flex justify-between items-center py-3 px-3.5 min-h-11 text-left rounded-sm border transition-colors duration-200',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    jaFez ? 'cursor-default border-green-500/30 bg-green-500/[0.08]' : 'cursor-pointer border-border bg-card hover:bg-elevated active:bg-elevated',
                  ].join(' ')}>
                  <span className="text-[13px] text-primary">{a.nome}</span>
                  {jaFez ? <Ico icon={CheckIcon} className="w-4 h-4 text-green-500 shrink-0" /> : <Ico icon={PlusIcon} className="w-[18px] h-[18px] shrink-0 text-muted" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
