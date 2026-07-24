import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  Ico,
  TrophyIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '../../lib/icons';
import { ComponentType, SVGProps } from 'react';
import { GB, beltConfig } from '../../lib/gbBrand';
import {
  useAlunos,
  useContratos,
  usePagamentos,
  usePresencas,
} from '../../lib/useData';

import type { Belt } from '../../types';
import { ClockIcon } from '@heroicons/react/24/solid';
import { exportContratoPDF } from '../../lib/reportExport';
import { useAuth } from '../../lib/auth';
import { useMobile } from '../../lib/useMobile';
import { useState } from 'react';

type HeroIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const BELT_PATH: Belt[] = [
  'branca',
  'cinza',
  'amarela',
  'laranja',
  'verde',
  'azul',
  'roxa',
  'marrom',
  'preta',
];

function NavCard({
  Icon,
  label,
  desc,
  accent,
  onClick,
}: {
  Icon: HeroIconComponent;
  label: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent + '30';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-sm)',
          background: accent + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 22, height: 22, color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: 'rgb(0,0,0,0.85)',
            fontWeight: 500,
            fontSize: 13,
            marginBottom: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: 'rgb(0,0,0,0.5)',
            fontWeight: 500,
            fontSize: 11,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {desc}
        </div>
      </div>
      <ChevronRightIcon
        style={{
          width: 14,
          height: 14,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      />
    </button>
  );
}

export default function PortalAluno({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const { data: presencas } = usePresencas();
  const { data: contratos } = useContratos();
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const aluno = alunos.find((a) => a.email === user?.email) || alunos[0];
  const meuContrato = contratos.find((c) => c.alunoId === aluno?.id);
  const minhasPresencas = presencas.filter((p) => p.alunoId === aluno.id);
  const hoje = new Date();
  const diasTreinoMes = new Set(
    minhasPresencas
      .filter((p) => {
        const d = new Date(p.data);
        return (
          d.getMonth() === hoje.getMonth() &&
          d.getFullYear() === hoje.getFullYear()
        );
      })
      .map((p) => p.data),
  ).size;
  const proximoPagamento = pagamentos.find(
    (p) => p.status === 'pendente' || p.status === 'vencido',
  );

  const bc = beltConfig[aluno.faixa];
  const beltIdx = BELT_PATH.indexOf(aluno.faixa);
  const progressoPct =
    (beltIdx / (BELT_PATH.length - 1)) * 60 +
    (aluno.grau / 4) * (60 / BELT_PATH.length);

  return (
    <div>
      {/* Edit Profile Modal */}
      {showEditPerfil && (
        <div
          onClick={() => setShowEditPerfil(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                Editar Dados Pessoais
              </div>
              <button
                onClick={() => setShowEditPerfil(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ico icon={XMarkIcon} />
              </button>
            </div>
            {[
              ['Nome completo', aluno.nome],
              ['Email', aluno.email],
              ['Telefone', aluno.telefone],
              ['WhatsApp', aluno.whatsapp || ''],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'block',
                    color: 'var(--text-muted)',
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {k}
                </label>
                <input
                  defaultValue={v}
                  style={{
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 11px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'var(--gb-red)')
                  }
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setShowEditPerfil(false)}
                style={{
                  flex: 1,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowEditPerfil(false)}
                style={{
                  flex: 2,
                  background: 'var(--gb-red)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Contract Modal */}
      {showContrato && (
        <div
          onClick={() => setShowContrato(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              maxWidth: 560,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                Contrato de Adesão
              </div>
              <button
                onClick={() => setShowContrato(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ico icon={XMarkIcon} />
              </button>
            </div>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 20px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                marginBottom: 18,
              }}
            >
              <p>
                <strong>Tribo Laurada Lda.</strong> (NIF 518948471) · Gracie
                Barra Braga
                <br />
                Rua Nova de Santa Cruz, 11 – 4710-409 Braga
              </p>
              <p>
                O aluno <strong>{aluno.nome}</strong> comprometeu-se a:
              </p>
              <ul style={{ marginLeft: 18, marginBottom: 10 }}>
                <li>
                  Efetuar o pagamento da mensalidade até ao dia 5 de cada mês
                </li>
                <li>
                  Utilizar o uniforme oficial da Gracie Barra durante os treinos
                </li>
                <li>Cumprir o regulamento interno da escola</li>
                <li>
                  Declarar estar fisicamente apto para a prática do Jiu-Jitsu
                </li>
              </ul>
              <p style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                Contrato em vigor desde {aluno.dataMatricula}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  exportContratoPDF({
                    alunoNome: meuContrato?.alunoNome || aluno.nome,
                    alunoNif: meuContrato?.alunoNif || '',
                    plano: meuContrato?.plano || aluno.plano || '',
                    valor: meuContrato?.valor ?? 0,
                    dataAssinatura: (
                      meuContrato?.dataAssinatura ||
                      aluno.dataMatricula ||
                      ''
                    ).slice(0, 10),
                    dataInicio:
                      meuContrato?.dataInicio || aluno.dataMatricula || '',
                    assinaturaImg: meuContrato?.assinaturaImg || null,
                  });
                  setShowContrato(false);
                }}
                style={{
                  flex: '1 1 140px',
                  background: 'var(--gb-red)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ico icon={ArrowDownTrayIcon} sm /> Descarregar PDF
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Cancelar subscrição?\n\nA tua conta ficará inativa no fim do período pago. Tens a certeza?',
                    )
                  ) {
                    alert(
                      'Pedido de cancelamento registado. Entraremos em contacto.',
                    );
                    setShowContrato(false);
                  }
                }}
                style={{
                  flex: '1 1 140px',
                  background: 'rgba(200,16,46,0.08)',
                  border: '1px solid rgba(200,16,46,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  color: 'var(--gb-red)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ico icon={ExclamationTriangleIcon} sm /> Cancelar subscrição
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── rest of portal ── */}
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, #0D0508 0%, ${bc?.bg || '#888'} 100%)`,
          border: '1px solid rgba(200,16,46,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(transparent 1px, rgba(255,255,255,0.02) 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'relative',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Bem-vindo de volta
            </div>
            <h1
              style={{
                color: '#fff',
                fontSize: isMobile ? 22 : 26,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {aluno.nome}
            </h1>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Membro desde {aluno.dataMatricula}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 11,
                  background: bc?.bg || '#888',
                  borderRadius: 3,
                  border: aluno.faixa === 'branca' ? '1px solid #555' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {bc?.label} ·{' '}
                {aluno.grau > 0 ? `${aluno.grau}° Grau` : 'Nenhum Grau'}
              </span>
            </div>

            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 99,
                }}
              >
                {aluno.plano}
              </span>
            </div>
          </div>

          {/* Belt progression circle */}
          <div
            style={{
              textAlign: 'center',
              flexShrink: 0,
              margin: 'auto 0',
            }}
          >
            <svg
              width={isMobile ? 68 : 80}
              height={isMobile ? 68 : 80}
              viewBox="0 0 80 80"
            >
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeDasharray={`${(2 * Math.PI * 34 * progressoPct) / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ opacity: 0.9 }}
              />
              <text
                x="40"
                y="44"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                kim-dors
                fontWeight="700"
                fontFamily="DM Sans, sans-serif"
              >
                {aluno.grau}/4
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? 8 : 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Dias este mês', value: diasTreinoMes },
          {
            label: 'Frequência',
            value: `${aluno.frequencia}%`,
          },
          { label: 'Dias de treino', value: '842' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 10.5,
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Payment alert */}
      {proximoPagamento && (
        <div
          style={{
            background:
              proximoPagamento.status === 'vencido'
                ? 'rgba(200,16,46,0.08)'
                : 'rgba(245,158,11,0.07)',
            border: `1px solid ${proximoPagamento.status === 'vencido' ? 'rgba(200,16,46,0.3)' : 'rgba(245,158,11,0.25)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  color:
                    proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B',
                  fontSize: 12,
                  marginBottom: 3,
                }}
              >
                {proximoPagamento.status === 'vencido' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Ico icon={ExclamationTriangleIcon} />
                    <span style={{ fontSize: 14 }}>Pagamento em atraso</span>
                  </div>
                ) : (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Ico icon={ClockIcon} />
                    <span style={{ fontSize: 14 }}>Mensalidade a vencer</span>
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {proximoPagamento.plano} · Vence {proximoPagamento.vencimento}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                style={{
                  background:
                    proximoPagamento.status === 'vencido' ? GB.red : '#F59E0B',

                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 16px',
                  color: '#fff',
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {proximoPagamento.status === 'vencido'
                  ? 'Regularizar'
                  : 'Pagar agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 6 : 10,
          marginBottom: 16,
        }}
      >
        <NavCard
          Icon={CalendarIcon}
          label="Minhas Aulas"
          desc="Horários e presenças"
          accent="#3B82F6"
          onClick={() => onNavigate?.('minhas-aulas')}
        />
        <NavCard
          Icon={TrophyIcon}
          label="Minha Evolução"
          desc="Faixa e graduações"
          accent="#A78BFA"
          onClick={() => onNavigate?.('evolucao')}
        />
        <NavCard
          Icon={CurrencyEuroIcon}
          label="Financeiro"
          desc="Pagamentos e faturas"
          accent="#22C55E"
          onClick={() => onNavigate?.('meu-financeiro')}
        />
        <NavCard
          Icon={VideoCameraIcon}
          label="Conteúdo"
          desc="Técnicas e vídeos"
          accent={GB.red}
          onClick={() => onNavigate?.('conteudo')}
        />
        <NavCard
          Icon={ChatBubbleLeftRightIcon}
          label="Mensagens"
          desc="Comunicação"
          accent="#F59E0B"
          onClick={() => onNavigate?.('mensagens')}
        />
        <NavCard
          Icon={Cog6ToothIcon}
          label="Minha Conta"
          desc="Editar dados pessoais"
          accent="#6B7280"
          onClick={() => setShowEditPerfil(true)}
        />
        <NavCard
          Icon={DocumentIcon}
          label="Meu Contrato"
          desc="Ver contrato completo"
          accent="#7C3AED"
          onClick={() => setShowContrato(true)}
        />
      </div>

      {/* Recent activity */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Atividade Recente
        </div>
        {minhasPresencas.length > 0 ? (
          minhasPresencas.slice(0, 4).map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22C55E',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {p.turmaNome}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {p.data} às {p.hora}
                </div>
              </div>
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--bg-elevated)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {p.metodo}
              </span>
            </div>
          ))
        ) : (
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            Sem atividade recente
          </p>
        )}
      </div>
    </div>
  );
}
