import { useState } from 'react';
import { useModulos, MODULE_CATALOGUE, CORE_MODULE_IDS } from '../../lib/useModulos';
import type { ModuleDef } from '../../lib/useModulos';
import Toggle from '../../components/common/Toggle';
import { Ico, InformationCircleIcon, BriefcaseIcon, MartialArtsIcon } from '../../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    <div
      className={[
        'flex gap-3.5 items-center py-3.5 px-4 rounded-sm border transition-all',
        active ? 'border-border bg-card' : 'border-border-subtle bg-elevated',
        toggling ? 'opacity-70' : 'opacity-100',
      ].join(' ')}
    >
      {/* Icon */}
      <div
        className={[
          'flex justify-center items-center w-10 h-10 text-lg rounded-[10px] border shrink-0 transition-all',
          active ? 'grayscale-0 border-gb-red/20 bg-gb-red/8' : 'grayscale border-border bg-base',
        ].join(' ')}
      >
        <FontAwesomeIcon icon={mod.icon} className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className={['flex gap-1.5 items-center text-[13px] font-bold', active ? 'text-primary' : 'text-muted'].join(' ')}
        >
          {mod.label}
          {isCore && (
            <span className="py-px px-1.5 text-[9.5px] font-bold tracking-[0.5px] uppercase rounded-full border border-border bg-elevated text-muted">
              Base
            </span>
          )}
        </div>
        <div className="mt-px text-[11.5px] text-muted">
          {mod.desc}
        </div>
      </div>

      {/* Status badge + Toggle */}
      <div className="flex gap-2.5 items-center shrink-0">
        {!isCore && (
          <span className={['text-[10.5px] font-bold tracking-[0.4px]', active ? 'text-green-600' : 'text-neutral-500'].join(' ')}>
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
    <div className="mx-auto max-w-[680px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="m-0 font-display text-[22px] font-extrabold text-primary">
          Módulos
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-muted">
          Ativa ou desativa funcionalidades para todos os utilizadores.
          Módulos desativados ficam invisíveis no menu e inacessíveis.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex gap-2.5 items-start py-2.5 px-3.5 mb-6 rounded-sm border border-gb-red/15 bg-gb-red/5">
        <span className="shrink-0 text-gb-red"><Ico icon={InformationCircleIcon} /></span>
        <div className="text-xs leading-[1.5] text-secondary">
          As alterações aplicam-se <strong>imediatamente</strong> a todas as sessões abertas.
          Módulos marcados como <strong>Base</strong> não podem ser desativados.
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-[13px] text-center text-muted">
          A carregar módulos...
        </div>
      ) : (
        <>
          {/* Staff modules */}
          <div className="mb-7">
            <div className="flex gap-2 items-center mb-2.5 text-[10.5px] font-bold tracking-[1px] uppercase text-muted">
              <Ico icon={BriefcaseIcon} sm /> Módulos de Staff
            </div>
            <div className="flex flex-col gap-1.5">
              {staffMods.map(m => <ModuleRow key={m.id} mod={m} />)}
            </div>
          </div>

          {/* Aluno modules */}
          <div className="mb-7">
            <div className="flex gap-2 items-center mb-2.5 text-[10.5px] font-bold tracking-[1px] uppercase text-muted">
              <Ico icon={MartialArtsIcon} sm /> Módulos de Aluno
            </div>
            <div className="flex flex-col gap-1.5">
              {alunoMods.map(m => <ModuleRow key={m.id} mod={m} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
