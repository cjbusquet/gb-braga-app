import { useState } from 'react';
import { GB } from '../../lib/gbBrand';
import { useModulos, MODULE_CATALOGUE, CORE_MODULE_IDS } from '../../lib/useModulos';
import type { ModuleDef } from '../../lib/useModulos';

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: disabled ? '#ccc' : checked ? GB.red : '#D1D5DB',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
        outline: 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
        display: 'block',
      }} />
    </button>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleRow({ mod }: { mod: ModuleDef }) {
  const { isActive, toggle } = useModulos();
  const [toggling, setToggling] = useState(false);
  const isCore   = CORE_MODULE_IDS.has(mod.id);
  const active   = isActive(mod.id);

  const handleToggle = async () => {
    if (isCore || toggling) return;
    setToggling(true);
    await toggle(mod.id);
    setToggling(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: active ? 'var(--bg-card)' : 'var(--bg-elevated)',
      border: `1px solid ${active ? 'var(--border)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      opacity: toggling ? 0.7 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: active ? `rgba(200,16,46,0.08)` : 'var(--bg-base)',
        border: `1px solid ${active ? 'rgba(200,16,46,0.2)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        filter: active ? 'none' : 'grayscale(1)',
        transition: 'all 0.2s',
      }}>
        {mod.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {mod.label}
          {isCore && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '1px 6px', borderRadius: 99,
            }}>
              Base
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 1 }}>
          {mod.desc}
        </div>
      </div>

      {/* Status badge + Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {!isCore && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.4px',
            color: active ? '#16A34A' : '#6B7280',
          }}>
            {active ? 'Ativo' : 'Inativo'}
          </span>
        )}
        <Toggle
          checked={isCore ? true : active}
          onChange={handleToggle}
          disabled={isCore || toggling}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ModulosPage() {
  const { loading } = useModulos();

  const staffMods = MODULE_CATALOGUE.filter(m => m.category === 'staff');
  const alunoMods = MODULE_CATALOGUE.filter(m => m.category === 'aluno');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          color: 'var(--text-primary)', fontSize: 22, fontWeight: 800,
          margin: 0, fontFamily: 'var(--font-display)',
        }}>
          Módulos
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          Ativa ou desativa funcionalidades para todos os utilizadores.
          Módulos desativados ficam invisíveis no menu e inacessíveis.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(200,16,46,0.05)',
        border: '1px solid rgba(200,16,46,0.15)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
          As alterações aplicam-se <strong>imediatamente</strong> a todas as sessões abertas.
          Módulos marcados como <strong>Base</strong> não podem ser desativados.
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 24, textAlign: 'center' }}>
          A carregar módulos...
        </div>
      ) : (
        <>
          {/* Staff modules */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>👨‍💼</span> Módulos de Staff
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {staffMods.map(m => <ModuleRow key={m.id} mod={m} />)}
            </div>
          </div>

          {/* Aluno modules */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>🥋</span> Módulos de Aluno
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alunoMods.map(m => <ModuleRow key={m.id} mod={m} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
