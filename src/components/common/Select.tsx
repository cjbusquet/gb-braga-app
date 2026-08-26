import type { SelectHTMLAttributes } from 'react';

type SelectVariant = 'sm' | 'md';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  /** 'md' (default) — labeled form field, bg-elevated. 'sm' — unlabeled
   * toolbar filter, bg-card, tighter text (AlunosPage sort/filter,
   * CheckinPage turma filter). */
  variant?: SelectVariant;
}

const VARIANT_CLASSES: Record<SelectVariant, string> = {
  sm: 'px-3 py-2 text-[12.5px] bg-card',
  md: 'px-3 py-2.5 text-[13px] bg-elevated',
};

/** Matches the internal app's dominant field style — the FIELD_CLASS/
 * MINI_FIELD_CLASS local constants duplicated across GraduacaoPage,
 * TurmasPage, ComunicacaoPage, NovaMatriculaModal, etc. — not Input.tsx's
 * white-card style, which is only actually used on the public-facing
 * LoginPage. */
export default function Select({ label, id, variant = 'md', className = '', children, ...rest }: SelectProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.8px] text-muted"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={[
          'box-border w-full cursor-pointer',
          'border border-border rounded-sm text-primary',
          VARIANT_CLASSES[variant],
          'font-ui min-h-11 sm:min-h-0',
          'outline-none transition-colors duration-200',
          'focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
