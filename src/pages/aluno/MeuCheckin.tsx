import { db, useAlunos, usePresencas, useTurmas } from '../../lib/useData';
import { useEffect, useState } from 'react';

import { GB } from '../../lib/gbBrand';
import { ArrowPathIcon, CheckCircleSolidIcon, ExclamationTriangleIcon, Ico, MapPinIcon, SignalIcon } from '../../lib/icons';
import { useAuth } from '../../lib/auth';
import { useConfiguracaoSecaoQuery } from '../../hooks/useConfiguracoes';
import { haversineDistanceMeters } from '../../services/geo';

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
  const { data: presencas } = usePresencas();

  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];

  // Presenças de hoje deste aluno
  const hoje_ = hoje();
  const jaFezCheckinHoje = presencas.some(
    (p) => p.alunoId === aluno?.id && p.data === hoje_,
  );
  const presencasHoje = presencas.filter(
    (p) => p.alunoId === aluno?.id && p.data === hoje_,
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

  // Pré-selecionar turma se só há uma hoje
  useEffect(() => {
    if (turmasHoje.length === 1) setTurmaId(turmasHoje[0].id);
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
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao registar presença.');
    }
    setChecking(false);
  };

  if (!aluno) {
    return (
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 13,
          padding: 24,
          textAlign: 'center',
        }}
      >
        Perfil não encontrado.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 10.5,
            letterSpacing: '1px',
            textTransform: 'uppercase' as const,
            marginBottom: 3,
          }}
        >
          Aluno
        </div>
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: 20,
          }}
        >
          Checkin
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 13,
            margin: '4px 0 0',
          }}
        >
          Regista a tua presença na aula de hoje.
        </p>
      </div>

      {/* Data e hora */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10.5,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            Hoje
          </div>
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: 15,
            }}
          >
            {new Date().toLocaleDateString('pt-PT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10.5,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            Hora
          </div>
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: 20,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {hora}
          </div>
        </div>
      </div>

      {/* Check-ins de hoje (se já fez) */}
      {presencasHoje.length > 0 && (
        <div
          style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: '#16A34A',
              fontSize: 12.5,
              marginBottom: 6,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ico icon={CheckCircleSolidIcon} sm />Já fizeste check-in hoje</span>
          </div>
          {presencasHoje.map((p, i) => (
            <div
              key={i}
              style={{ color: 'var(--text-secondary)', fontSize: 12 }}
            >
              {p.hora?.slice(0, 5)} — {p.turmaNome || 'Treino livre'}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de check-in */}
      {done ? (
        /* ── Confirmação ── */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(34,197,94,0.3)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 12, color: '#16A34A' }}><Ico icon={CheckCircleSolidIcon} style={{ width: 52, height: 52 }} /></div>
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: 17,
              marginBottom: 6,
            }}
          >
            Presença registada!
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {turmasHoje.find((t) => t.id === turmaId)?.nome || 'Treino livre'} ·{' '}
            {horaAtual()}
          </div>
          <button
            onClick={() => {
              setDone(false);
              setTurmaId(turmasHoje.length === 1 ? turmasHoje[0].id : '');
            }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '9px 20px',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Fazer outro check-in
          </button>
        </div>
      ) : (
        /* ── Formulário ── */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}
        >
          {/* Selecionar turma */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 10.5,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Aula
            </div>

            {turmasHoje.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  padding: '12px 0',
                }}
              >
                Sem aulas agendadas para hoje. Podes fazer check-in como treino
                livre.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {turmasHoje.map((t) => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      background:
                        turmaId === t.id
                          ? `${t.cor || GB.red}18`
                          : 'var(--bg-elevated)',
                      border: `1.5px solid ${turmaId === t.id ? t.cor || GB.red : 'var(--border)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="turma"
                      value={t.id}
                      checked={turmaId === t.id}
                      onChange={() => setTurmaId(t.id)}
                      style={{ accentColor: GB.red }}
                    />
                    <div>
                      <div
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: 13,
                        }}
                      >
                        {t.nome}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {t.horario}
                      </div>
                    </div>
                  </label>
                ))}

                {/* Opção "Treino livre" */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    background:
                      turmaId === ''
                        ? 'rgba(200,16,46,0.06)'
                        : 'var(--bg-elevated)',
                    border: `1.5px solid ${turmaId === '' ? GB.red : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="turma"
                    value=""
                    checked={turmaId === ''}
                    onChange={() => setTurmaId('')}
                    style={{ accentColor: GB.red }}
                  />
                  <div>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 13,
                      }}
                    >
                      Treino livre
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
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
              style={{
                marginBottom: 14,
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg)',
                background:
                  gpsStatus === 'inside'
                    ? 'rgba(22,163,74,0.07)'
                    : gpsStatus === 'outside'
                      ? 'rgba(200,16,46,0.06)'
                      : gpsStatus === 'checking'
                        ? 'var(--bg-elevated)'
                        : 'var(--bg-elevated)',
                border: `1px solid ${
                  gpsStatus === 'inside'
                    ? 'rgba(22,163,74,0.25)'
                    : gpsStatus === 'outside'
                      ? 'rgba(200,16,46,0.2)'
                      : 'var(--border)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ico
                icon={gpsStatus === 'inside' ? CheckCircleSolidIcon : gpsStatus === 'outside' ? MapPinIcon : gpsStatus === 'checking' ? ArrowPathIcon : gpsStatus === 'error' ? ExclamationTriangleIcon : SignalIcon}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    color:
                      gpsStatus === 'inside'
                        ? '#16A34A'
                        : gpsStatus === 'outside'
                          ? GB.red
                          : 'var(--text-secondary)',
                  }}
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
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Podes fazer check-in mas a tua localização será registada.
                  </div>
                )}
              </div>
            </div>
          )}

          {err && (
            <div
              style={{
                color: GB.red,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Ico icon={ExclamationTriangleIcon} sm />{err}</span>
            </div>
          )}

          {/* Botão check-in */}
          <button
            onClick={handleCheckin}
            disabled={checking}
            style={{
              width: '100%',
              padding: '14px',
              background: checking ? '#aaa' : GB.red,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: 12,
              cursor: checking ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {checking
              ? 'A registar...'
              : jaFezCheckinHoje
                ? 'Fazer check-in novamente'
                : 'Fazer Check-in'}
          </button>
        </div>
      )}

      {/* Histórico recente */}
      {presencas.filter((p) => p.alunoId === aluno?.id).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 10.5,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Últimas presenças
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {presencas
              .filter((p) => p.alunoId === aluno?.id)
              .slice(0, 5)
              .map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 12.5,
                      }}
                    >
                      {p.turmaNome || 'Treino livre'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(p.data).toLocaleDateString('pt-PT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
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
