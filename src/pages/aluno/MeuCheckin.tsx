import { db, useAlunos, usePresencas, useTurmas } from '../../lib/useData';
import { useEffect, useState } from 'react';

import { GB } from '../../lib/gbBrand';
import { ArrowPathIcon, CheckCircleSolidIcon, ExclamationTriangleIcon, Ico, MapPinIcon, SignalIcon } from '../../lib/icons';
import { useAuth } from '../../lib/auth';
import { useConfiguracaoSecaoQuery } from '../../hooks/useConfiguracoes';
import { haversineDistanceMeters } from '../../services/geo';
import PortalPageHeader from './PortalPageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hoje = () => new Date().toISOString().split('T')[0];

const DIAS_PT: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado',
};

function hojeNomeDia() {
  return DIAS_PT[new Date().getDay()];
}

function horaAtual() {
  return new Date().toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MeuCheckin() {
  const { user } = useAuth();
  const { data: alunos } = useAlunos();
  const { data: turmas } = useTurmas();
  const { data: presencas, refetch: refetchPresencas } = usePresencas();

  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];

  // Presenças de hoje deste aluno
  const hoje_ = hoje();
  const presencasHoje = presencas.filter(
    (p) => p.alunoId === aluno?.id && p.data === hoje_,
  );
  const turmaIdsJaChecados = new Set(
    presencasHoje.filter((p) => p.turmaId).map((p) => p.turmaId),
  );

  // Turmas de hoje (por dia da semana)
  const diaSemana = hojeNomeDia();
  const turmasHoje = turmas.filter((t) =>
    Array.isArray(t.diaSemana)
      ? t.diaSemana.some((d: string) =>
          d.toLowerCase().startsWith(diaSemana.slice(0, 3)),
        )
      : false,
  );

  const [turmaId, setTurmaId] = useState('');
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [hora, setHora] = useState(horaAtual());

  // GPS fence state
  const [fence, setFence] = useState<{
    lat: number;
    lng: number;
    raio: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'checking' | 'inside' | 'outside' | 'error'
  >('idle');
  const [gpsDist, setGpsDist] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<GeolocationCoordinates | null>(null);

  // Relógio ao vivo
  useEffect(() => {
    const iv = setInterval(() => setHora(horaAtual()), 10000);
    return () => clearInterval(iv);
  }, []);

  // Load GPS fence config from DB
  const { data: academiaConfig } = useConfiguracaoSecaoQuery('academia');
  useEffect(() => {
    const d = academiaConfig as Record<string, string> | null;
    if (!d) return;
    const lat = parseFloat(d['GPS Latitude'] ?? '');
    const lng = parseFloat(d['GPS Longitude'] ?? '');
    const raio = parseInt(d['GPS Raio (m)'] ?? '100');
    if (!isNaN(lat) && !isNaN(lng))
      setFence({ lat, lng, raio: isNaN(raio) ? 100 : raio });
  }, [academiaConfig]);

  // Check user's GPS position when fence is loaded
  useEffect(() => {
    if (!fence || !navigator.geolocation) return;
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos(pos.coords);
        const dist = Math.round(
          haversineDistanceMeters(
            fence.lat,
            fence.lng,
            pos.coords.latitude,
            pos.coords.longitude,
          ),
        );
        setGpsDist(dist);
        setGpsStatus(dist <= fence.raio ? 'inside' : 'outside');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [fence]);

  // Pré-selecionar turma se só há uma hoje — mas não se já fizeste
  // check-in nela, para não pré-selecionar uma opção bloqueada.
  useEffect(() => {
    if (turmasHoje.length === 1 && !turmaIdsJaChecados.has(turmasHoje[0].id)) {
      setTurmaId(turmasHoje[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmas, turmasHoje]);

  const handleCheckin = async () => {
    if (!aluno) return;
    setErr('');
    setChecking(true);
    try {
      const turma = turmas.find((t) => t.id === turmaId);
      await db.registarPresenca({
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        turmaId: turma?.id || null,
        turmaNome: turma?.nome || null,
        metodo: 'app',
        gpsLat: userPos?.latitude ?? null,
        gpsLng: userPos?.longitude ?? null,
        gpsDist: gpsDist ?? null,
      });
      await refetchPresencas();
      setDone(true);
    } catch (e) {
      // 23505 = unique_violation — the DB-level guard against a duplicate
      // check-in in the same turma on the same day (e.g. a second tab, or
      // the picker's disabled state being bypassed some other way).
      const code = (e as { code?: string } | null)?.code;
      if (code === '23505') {
        setErr('Já fizeste check-in nesta aula hoje.');
        await refetchPresencas();
      } else {
        setErr(e instanceof Error ? e.message : 'Erro ao registar presença.');
      }
    }
    setChecking(false);
  };

  if (!aluno) {
    return (
      <div className="p-6 text-[13px] text-center text-muted">
        Perfil não encontrado.
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader title="Checkin" description="Regista a tua presença na aula de hoje." />

      {/* Data e hora */}
      <div className="flex justify-between items-center py-4 px-5 mb-4 rounded-lg border border-border bg-card">
        <div>
          <div className="mb-1 text-[10.5px] tracking-[0.8px] uppercase text-muted">
            Hoje
          </div>
          <div className="text-[15px] text-primary">
            {new Date().toLocaleDateString('pt-PT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-[10.5px] tracking-[0.8px] uppercase text-muted">
            Hora
          </div>
          <div className="text-xl font-extrabold tabular-nums text-primary">
            {hora}
          </div>
        </div>
      </div>

      {/* Check-ins de hoje (se já fez) */}
      {presencasHoje.length > 0 && (
        <div className="py-3 px-4 mb-4 rounded-lg border border-green-600/25 bg-green-600/[0.07]">
          <div className="mb-1.5 text-[12.5px] text-green-600">
            <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckCircleSolidIcon} sm />Já fizeste check-in hoje</span>
          </div>
          {presencasHoje.map((p, i) => (
            <div key={i} className="text-xs text-secondary">
              {p.hora?.slice(0, 5)} — {p.turmaNome || 'Treino livre'}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de check-in */}
      {done ? (
        /* ── Confirmação ── */
        <div className="py-8 px-6 text-center border border-green-600/30 bg-card">
          <div className="mb-3 text-green-600"><Ico icon={CheckCircleSolidIcon} style={{ width: 52, height: 52 }} /></div>
          <div className="mb-1.5 text-[17px] text-primary">
            Presença registada!
          </div>
          <div className="mb-5 text-[13px] text-muted">
            {turmasHoje.find((t) => t.id === turmaId)?.nome || 'Treino livre'} ·{' '}
            {horaAtual()}
          </div>
          <button
            onClick={() => {
              setDone(false);
              setTurmaId(turmasHoje.length === 1 ? turmasHoje[0].id : '');
            }}
            className="py-2.5 px-5 min-h-11 sm:min-h-0 text-[13px] rounded-lg border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card hover:text-primary active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
          >
            Fazer outro check-in
          </button>
        </div>
      ) : (
        /* ── Formulário ── */
        <Card padding="lg">
          {/* Selecionar turma */}
          <div className="mb-5">
            <div className="mb-2 text-[10.5px] tracking-[0.8px] uppercase text-muted">
              Aula
            </div>

            {turmasHoje.length === 0 ? (
              <div className="py-3 text-[13px] text-muted">
                Sem aulas agendadas para hoje. Podes fazer check-in como treino
                livre.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {turmasHoje.map((t) => {
                  const jaChecada = turmaIdsJaChecados.has(t.id);
                  return (
                  <label
                    key={t.id}
                    className={[
                      'flex gap-3 items-center py-2.5 px-3.5 rounded-lg border-[1.5px] transition-colors duration-200',
                      jaChecada ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    ].join(' ')}
                    style={{
                      background: turmaId === t.id ? `${t.cor || GB.red}18` : 'var(--bg-elevated)',
                      borderColor: turmaId === t.id ? t.cor || GB.red : 'var(--border)',
                    }}
                  >
                    <input
                      type="radio"
                      name="turma"
                      value={t.id}
                      checked={turmaId === t.id}
                      disabled={jaChecada}
                      onChange={() => setTurmaId(t.id)}
                      className="outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                    />
                    <div>
                      <div className="text-[13px] text-primary">
                        {t.nome}
                      </div>
                      <div className="text-[11px] text-muted">
                        {jaChecada ? 'Já fizeste check-in hoje' : t.horario}
                      </div>
                    </div>
                  </label>
                  );
                })}

                {/* Opção "Treino livre" */}
                <label
                  className={[
                    'flex gap-3 items-center py-2.5 px-3.5 rounded-lg border-[1.5px] cursor-pointer transition-colors duration-200',
                    turmaId === '' ? 'border-gb-red bg-gb-red/[0.06]' : 'border-border bg-elevated',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="turma"
                    value=""
                    checked={turmaId === ''}
                    onChange={() => setTurmaId('')}
                    className="outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
                  />
                  <div>
                    <div className="text-[13px] text-primary">
                      Treino livre
                    </div>
                    <div className="text-[11px] text-muted">
                      Sem turma específica
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* GPS Fence indicator */}
          {fence && (
            <div
              className={[
                'flex gap-2.5 items-center py-2.5 px-3.5 mb-3.5 rounded-lg border',
                gpsStatus === 'inside' ? 'border-green-600/25 bg-green-600/[0.07]'
                  : gpsStatus === 'outside' ? 'border-gb-red/20 bg-gb-red/[0.06]'
                  : 'border-border bg-elevated',
              ].join(' ')}
            >
              <Ico
                icon={gpsStatus === 'inside' ? CheckCircleSolidIcon : gpsStatus === 'outside' ? MapPinIcon : gpsStatus === 'checking' ? ArrowPathIcon : gpsStatus === 'error' ? ExclamationTriangleIcon : SignalIcon}
                className="w-[18px] h-[18px] shrink-0"
              />
              <div>
                <div
                  className={[
                    'text-[12.5px]',
                    gpsStatus === 'inside' ? 'text-green-600' : gpsStatus === 'outside' ? 'text-gb-red' : 'text-secondary',
                  ].join(' ')}
                >
                  {gpsStatus === 'inside'
                    ? `Dentro da academia (${gpsDist}m)`
                    : gpsStatus === 'outside'
                      ? `Fora da academia — ${gpsDist}m (máx. ${fence.raio}m)`
                      : gpsStatus === 'checking'
                        ? 'A verificar localização...'
                        : gpsStatus === 'error'
                          ? 'Não foi possível obter localização'
                          : 'GPS fence activo'}
                </div>
                {gpsStatus === 'outside' && (
                  <div className="mt-0.5 text-[11px] text-muted">
                    Podes fazer check-in mas a tua localização será registada.
                  </div>
                )}
              </div>
            </div>
          )}

          {err && (
            <div className="mb-3 text-xs font-semibold text-gb-red">
              <span className="inline-flex gap-1.5 items-center"><Ico icon={ExclamationTriangleIcon} sm />{err}</span>
            </div>
          )}

          {/* Botão check-in */}
          <Button
            variant="primary" fullWidth
            disabled={checking || (turmaId !== '' && turmaIdsJaChecados.has(turmaId))}
            onClick={handleCheckin}
          >
            {turmaId !== '' && turmaIdsJaChecados.has(turmaId)
              ? 'Já fizeste check-in nesta aula'
              : checking
                ? 'A registar...'
                : 'Fazer Check-in'}
          </Button>
        </Card>
      )}

      {/* Histórico recente */}
      {presencas.filter((p) => p.alunoId === aluno?.id).length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 text-[10.5px] tracking-[0.8px] uppercase text-muted">
            Últimas presenças
          </div>
          <div className="flex flex-col gap-1.5">
            {presencas
              .filter((p) => p.alunoId === aluno?.id)
              .slice(0, 5)
              .map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2.5 px-3.5 rounded-lg border border-border bg-card"
                >
                  <div>
                    <div className="text-[12.5px] text-primary">
                      {p.turmaNome || 'Treino livre'}
                    </div>
                    <div className="text-[11px] text-muted">
                      {new Date(p.data).toLocaleDateString('pt-PT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <div className="text-xs tabular-nums text-muted">
                    {p.hora?.slice(0, 5)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
