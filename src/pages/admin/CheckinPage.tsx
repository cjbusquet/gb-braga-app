/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePresencas, useAlunos, useTurmas, db } from '../../lib/useData';
import { Ico, type HeroIcon, ArrowDownTrayIcon, MapPinIcon, CheckIcon, PlusIcon, XMarkIcon, CircleIcon } from '../../lib/icons';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Tabs from '../../components/common/Tabs';
import { useConfiguracaoSecaoQuery } from '../../hooks/useConfiguracoes';
import { haversineDistanceMeters } from '../../services/geo';
import KioskMode from './KioskMode';

export default function CheckinPage() {
  const { data: alunos }   = useAlunos();
  const { data: turmas }   = useTurmas();
  const { data: presencasDB, refetch } = usePresencas();
  const checkIns = presencasDB ?? [];

  // Reference point comes from the same 'academia' config section the aluno
  // check-in page reads (ConfigPage > Academia > GPS Fence) — this used to be
  // a hardcoded fallback coordinate here, which is why distances shown to
  // staff didn't match the real address once the academia's point was set.
  const { data: academiaConfig } = useConfiguracaoSecaoQuery('academia');
  const cfg = (academiaConfig as Record<string, string> | null) ?? {};
  const academiaLat = parseFloat(cfg['GPS Latitude'] ?? '');
  const academiaLng = parseFloat(cfg['GPS Longitude'] ?? '');
  const academiaConfigurada = !isNaN(academiaLat) && !isNaN(academiaLng);

  const [tab, setTab]           = useState<'gps'|'manual'|'live'>('live');
  const [gpsStatus, setGpsStatus] = useState<'idle'|'checking'|'inside'|'outside'|'denied'>('idle');
  const [gpsDist, setGpsDist]   = useState<number|null>(null);
  const [fenceRadius, setFenceRadius] = useState(parseInt(cfg['GPS Raio (m)'] ?? '100') || 100);
  const [kioskMode, setKioskMode] = useState(false);
  const [turmaFilter, setTurmaFilter] = useState('');

  const checkGPS = () => {
    if (!academiaConfigurada) return;
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const dist = haversineDistanceMeters(pos.coords.latitude, pos.coords.longitude, academiaLat, academiaLng);
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
  const gpsLabel = { idle:'Verificar GPS', checking:'A verificar...', inside:'Dentro do perímetro', outside:`Fora (${gpsDist}m)`, denied:'GPS negado' }[gpsStatus];
  const gpsLabelIcon: HeroIcon | null = { idle: null, checking: null, inside: CheckIcon, outside: XMarkIcon, denied: null }[gpsStatus];

  if (kioskMode) {
    return <KioskMode onExit={() => setKioskMode(false)} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Academia"
        title="Check-in"
        actions={<>
          <Button variant="secondary" onClick={exportCSV}>
            <Ico icon={ArrowDownTrayIcon} sm /> Export CSV
          </Button>
          <Button variant="primary" onClick={() => setKioskMode(true)}>
            Kiosk
          </Button>
        </>}
      />

      <Tabs
        tabs={[
          { id: 'live', label: 'Live', icon: <Ico icon={CircleIcon} className="w-2 h-2 text-green-500" /> },
          { id: 'gps', label: 'GPS Fence' },
          { id: 'manual', label: 'Manual' },
        ]}
        active={tab}
        onChange={setTab}
      />

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
          {!academiaConfigurada && (
            <div className="flex gap-2 items-center py-2.5 px-3.5 mb-4 text-[12.5px] rounded-sm border border-amber-600/30 bg-amber-600/[0.08] text-amber-600">
              <Ico icon={MapPinIcon} sm /> Ponto de referência da academia por definir em Config. → Academia → GPS Fence.
            </div>
          )}
          <div className="p-6 mb-4 rounded-lg border border-border bg-card">
            <div className="mb-5 text-center">
              <div
                className="flex justify-center items-center mx-auto mb-3 w-20 h-20 rounded-full border-[3px]"
                style={{ borderColor: gpsColor, color: gpsColor }}
              >
                <Ico icon={MapPinIcon} lg />
              </div>
              <div className="inline-flex gap-1.5 items-center text-sm font-bold" style={{ color: gpsColor }}>{gpsLabelIcon && <Ico icon={gpsLabelIcon} sm />}{gpsLabel}</div>
              {gpsDist !== null && <div className="mt-1 text-xs text-muted">{gpsDist}m da academia</div>}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Button variant="primary" disabled={gpsStatus==='checking' || !academiaConfigurada} onClick={checkGPS}>
                <Ico icon={MapPinIcon} sm /> Verificar GPS
              </Button>
              <Button variant="secondary" onClick={demoGPS}>
                Demo
              </Button>
            </div>
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-muted">Raio: {fenceRadius}m</label>
              <input type="range" min={30} max={500} value={fenceRadius} onChange={e => setFenceRadius(parseInt(e.target.value))}
                className="w-full accent-gb-red"/>
            </div>
            <Button
              variant="primary" fullWidth
              disabled={gpsStatus !== 'inside'}
              onClick={() => gpsStatus==='inside' && doCheckin('me','Utilizador Actual')}
            >
              <Ico icon={CheckIcon} sm /> Check-in Pessoal
            </Button>
          </div>
        </div>
      )}

      {/* MANUAL */}
      {tab === 'manual' && (
        <div>
          <div className="mb-3">
            {/* Alunos not linked to a turma in the data model yet, so this can't
                filter the roster below — it tags the resulting check-in record
                with the chosen turma instead (doCheckin's turmaId/turmaNome). */}
            <Select variant="sm" value={turmaFilter} onChange={e => setTurmaFilter(e.target.value)}>
              <option value="">Sem turma associada</option>
              {turmas.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {alunos.filter((a: any) => a.status === 'ativo').map((a: any) => {
              const jaFez = checkIns.some(p => p.alunoId === a.id && p.data === new Date().toISOString().split('T')[0]);
              const turmaSel = turmas.find((t: any) => t.id === turmaFilter);
              return (
                <button key={a.id} onClick={() => !jaFez && doCheckin(a.id, a.nome, turmaSel?.id, turmaSel?.nome)}
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
