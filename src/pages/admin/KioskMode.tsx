import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAlunos, useTurmas } from '../../lib/useData';
import { ACADEMIA } from '../../data/mockData';
import { GBLogo } from '../../components/GBLogo';
import { Ico, MapPinIcon, CheckIcon, MartialArtsIcon, UsersIcon, MagnifyingGlassIcon } from '../../lib/icons';
import BeltBadge from '../../components/common/BeltBadge';
import { useConfiguracaoSecaoQuery } from '../../hooks/useConfiguracoes';
import { haversineDistanceMeters } from '../../services/geo';
import type { Aluno } from '../../types';

interface Props { onExit: () => void }

type CheckInState = 'idle' | 'locating' | 'success' | 'outside' | 'error';

export default function KioskMode({ onExit }: Props) {
  const { data: alunos } = useAlunos();
  const { data: turmas } = useTurmas();

  // Same 'academia' config section ConfigPage.tsx (Academia > GPS Fence) and
  // MeuCheckin.tsx read — this used to be a hardcoded coordinate here, which
  // reported wrong distances once the real academia point was configured.
  const { data: academiaConfig } = useConfiguracaoSecaoQuery('academia');
  const cfg = (academiaConfig as Record<string, string> | null) ?? {};
  const ACADEMIA_COORDS = {
    lat: parseFloat(cfg['GPS Latitude'] ?? ''),
    lng: parseFloat(cfg['GPS Longitude'] ?? ''),
    radius: parseInt(cfg['GPS Raio (m)'] ?? '100') || 100,
  };
  const academiaConfigurada = !isNaN(ACADEMIA_COORDS.lat) && !isNaN(ACADEMIA_COORDS.lng);

  const [state, setState] = useState<CheckInState>('idle');
  const [lastCheckin, setLastCheckin] = useState<{nome:string;faixa:string;grau:number;hora:string;dist:number}|null>(null);
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
  const turmaAtual = turmas.find(t => {
    const inicio = parseInt(t.horario.split(':')[0]);
    return inicio <= horaAtual && horaAtual < inicio + 2;
  }) || turmas[0];

  const doCheckin = useCallback((aluno: Aluno) => {
    if (state !== 'idle') return;
    setState('locating');

    if (!navigator.geolocation || !academiaConfigurada) {
      // Fallback: allow manual check-in without GPS
      setState('success');
      setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau || 0, hora: new Date().toTimeString().slice(0,5), dist: 0 });
      setTodayCount(c => c+1);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistanceMeters(pos.coords.latitude, pos.coords.longitude, ACADEMIA_COORDS.lat, ACADEMIA_COORDS.lng);
        if (dist <= ACADEMIA_COORDS.radius) {
          setState('success');
          setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau || 0, hora: new Date().toTimeString().slice(0,5), dist: Math.round(dist) });
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
        setLastCheckin({ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau || 0, hora: new Date().toTimeString().slice(0,5), dist: 0 });
        setTodayCount(c => c+1);
        setShowManual(false);
        setSearch('');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [state, academiaConfigurada, ACADEMIA_COORDS.lat, ACADEMIA_COORDS.lng, ACADEMIA_COORDS.radius]);

  const filteredAlunos = alunos.filter(a =>
    a.status === 'ativo' && a.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex fixed inset-0 z-[9999] flex-col font-ui select-none bg-[#0A0A0C]">

      {/* Top bar */}
      <div className="flex shrink-0 justify-between items-center py-4 px-7 border-b border-[#1A1A20]">
        <div className="flex gap-3 items-center">
          <GBLogo size={38}/>
          <div>
            <div className="font-display text-base font-bold text-white uppercase">Gracie Barra Braga</div>
            <div className="text-[11px] text-[#4A4A58]">Check-in por GPS · {ACADEMIA.morada.split(',')[0]}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[32px] font-extrabold tracking-[2px] text-white">
            {currentTime.toTimeString().slice(0,5)}
          </div>
          <div className="text-[11px] text-[#4A4A58]">{currentTime.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-[28px] font-extrabold text-gb-red">{todayCount}</div>
            <div className="text-[11px] text-[#4A4A58]">check-ins hoje</div>
          </div>
          <button onClick={onExit} className="py-2 px-3.5 min-h-11 sm:min-h-0 text-xs rounded-lg border cursor-pointer transition-colors duration-200 border-[#2A2A32] bg-[#1A1A20] text-[#6B6B78] hover:text-white hover:border-[#3A3A44] active:bg-[#22222A] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]">← Sair</button>
        </div>
      </div>

      {/* Active class banner — turmaAtual is undefined when the academia has
          no turmas registered yet; this used to crash the whole kiosk on
          .nome access instead of just hiding the banner. */}
      {turmaAtual && (
        <div className="flex shrink-0 justify-between items-center py-2.5 px-7 bg-gb-red">
          <div className="flex gap-2.5 items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-[pulse_1.5s_infinite]"/>
            <span className="text-[13px] font-bold tracking-[0.5px] text-white uppercase">AULA EM CURSO</span>
          </div>
          <div className="text-sm font-semibold text-white">{turmaAtual.nome}</div>
          <div className="text-[13px] text-white/70">Prof. {turmaAtual.professorNome} · {turmaAtual.horario}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex overflow-y-auto flex-col flex-1 gap-6 justify-center items-center py-8 px-7 lg:flex-row lg:gap-10">

        {/* GPS status + action area */}
        {!showManual && (
          <div className="flex flex-col flex-1 items-center max-w-[480px]">

            {state === 'idle' && (
              <>
                {/* GPS radar */}
                <div className="relative mb-6 w-60 h-60">
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
                  <div className="absolute right-0 bottom-2 left-0 text-center">
                    <div className="flex gap-1.5 justify-center items-center text-[13px] font-bold tracking-[1px] text-gb-red"><Ico icon={MapPinIcon} sm />GPS FENCE</div>
                    <div className="mt-0.5 text-[11px] text-[#3A3A48]">Raio: {ACADEMIA_COORDS.radius}m</div>
                  </div>
                </div>

                <div className="mb-5 max-w-[340px] text-sm leading-[1.6] text-center text-[#6B6B78]">
                  Seleciona o teu nome na lista ao lado.<br/>O GPS confirma automaticamente se estás na academia.
                </div>

                {!academiaConfigurada && (
                  <div className="mb-4 max-w-[340px] text-xs leading-[1.6] text-center text-amber-500">
                    Ponto de referência por definir em Config. → Academia. Check-in a decorrer sem validação de GPS.
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex gap-1.5 items-center py-2 px-4 rounded-lg border border-[#2A2A32] bg-[#161620]">
                    <div className="w-2 h-2 rounded-full bg-gb-red"/>
                    <span className="text-xs text-[#9CA3AF]">Academia</span>
                  </div>
                  <div className="flex gap-1.5 items-center py-2 px-4 rounded-lg border border-[#2A2A32] bg-[#161620]">
                    <div className="w-2 h-2 rounded-full bg-[#4ADE80]"/>
                    <span className="text-xs text-[#9CA3AF]">Dentro do raio</span>
                  </div>
                </div>
              </>
            )}

            {state === 'locating' && (
              <div className="text-center">
                <div className="mx-auto mb-5 w-20 h-20 rounded-full border-[3px] border-gb-red animate-[spin_0.8s_linear_infinite]" style={{ borderTopColor: 'transparent' }}/>
                <div className="mb-2 text-lg font-bold text-gb-red">A verificar localização...</div>
                <div className="text-[13px] text-[#4A4A58]">GPS a confirmar que estás na academia</div>
              </div>
            )}

            {state === 'success' && lastCheckin && (
              <div className="text-center animate-[fadeIn_0.3s_ease]">
                <div className="flex justify-center items-center mx-auto mb-5 w-[100px] h-[100px] rounded-full border-[3px] border-green-600/40 bg-green-600/[0.12]"><FontAwesomeIcon icon={CheckIcon} className="w-12 h-12 text-green-600" /></div>
                <div className="mb-1.5 text-[28px] font-extrabold text-green-600">CHECK-IN!</div>
                <div className="mb-2 text-[22px] font-bold text-white">{lastCheckin.nome}</div>
                <div className="flex gap-2.5 justify-center items-center mb-1.5">
                  <BeltBadge faixa={lastCheckin.faixa} grau={lastCheckin.grau} size="md" />
                </div>
                <div className="mb-1 font-mono text-[13px] text-[#4A4A58]">{lastCheckin.hora}</div>
                {lastCheckin.dist > 0 && (
                  <div className="flex gap-1 justify-center items-center text-xs text-green-600"><Ico icon={MapPinIcon} sm />{lastCheckin.dist}m da academia · GPS confirmado</div>
                )}
                <div className="flex gap-1.5 justify-center items-center mt-2 text-sm font-bold text-green-600">OSS! <Ico icon={MartialArtsIcon} sm /></div>
              </div>
            )}

            {state === 'outside' && (
              <div className="max-w-[360px] text-center">
                <div className="flex justify-center items-center mx-auto mb-5 w-20 h-20 rounded-full border-[3px] border-gb-red/30 bg-gb-red/10"><FontAwesomeIcon icon={MapPinIcon} className="w-9 h-9 text-gb-red" /></div>
                <div className="mb-2 text-xl font-bold text-gb-red">Fora do perímetro</div>
                <div className="text-[13px] leading-[1.6] text-[#4A4A58]">{gpsError}</div>
              </div>
            )}
          </div>
        )}

        {/* Aluno list */}
        <div className={['flex flex-col w-full max-w-[480px]', showManual ? '' : 'lg:w-80'].join(' ')}>
          <button onClick={() => setShowManual(!showManual)} className="flex gap-2 items-center py-3 px-[18px] min-h-11 mb-3.5 text-[13px] font-semibold rounded-md border cursor-pointer transition-colors duration-200 border-[#2A2A32] bg-[#161620] text-[#9CA3AF] hover:text-white hover:border-[#3A3A44] active:bg-[#1E1E28] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]">
            <Ico icon={UsersIcon} sm /> {showManual ? '← Voltar ao GPS' : 'Selecionar Aluno'}
          </button>

          {showManual && (
            <div className="relative mb-3">
              <Ico icon={MagnifyingGlassIcon} sm className="absolute top-1/2 left-3 text-[#6B6B78] -translate-y-1/2 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." autoFocus
                className="py-3 pr-4 pl-9 w-full min-h-11 text-[15px] text-white rounded-md border outline-none transition-colors duration-200 border-[#2A2A32] bg-[#161620] focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25"/>
            </div>
          )}

          <div className={['flex overflow-y-auto flex-col gap-1.5', showManual ? 'max-h-[420px]' : 'max-h-[380px]'].join(' ')}>
            {(showManual ? filteredAlunos : alunos.filter(a => a.status === 'ativo').slice(0, 6)).map(a => {
              return (
                <button key={a.id} onClick={() => doCheckin(a)}
                  className="flex gap-3 items-center py-3 px-3.5 min-h-11 text-left rounded-md border cursor-pointer transition-colors duration-200 border-[#2A2A32] bg-[#161620] hover:border-gb-red active:bg-[#1E1E28] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]"
                >
                  <div className="flex justify-center items-center w-[38px] h-[38px] text-[15px] font-extrabold rounded-full shrink-0 text-gb-red bg-gb-red/[0.13]">{a.nome.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{a.nome}</div>
                    <div className="flex gap-1.5 items-center mt-1">
                      <BeltBadge faixa={a.faixa} grau={a.grau || 0} size="sm" />
                    </div>
                  </div>
                  <span className="inline-flex gap-1 items-center text-[13px] font-bold text-gb-red"><Ico icon={MapPinIcon} sm />Check-in</span>
                </button>
              );
            })}
          </div>

          {!showManual && (
            <button onClick={() => setShowManual(true)}
              className="py-2 mt-2.5 min-h-11 text-xs bg-transparent rounded-lg border cursor-pointer transition-colors duration-200 border-[#2A2A32] text-[#4A4A58] hover:text-white hover:border-[#3A3A44] active:bg-[#161620] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]">
              Ver todos os alunos...
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
