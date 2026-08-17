import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/* Mobile-first: min-h-11 (44px) guarantees a comfortable tap target on small
   screens; sm: releases the constraint so padding alone drives height in
   denser desktop/tablet layouts (tables, toolbars). */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3 py-1.5 rounded-sm text-[11px] min-h-11 sm:min-h-0',
  md: 'gap-1.5 px-4 py-2.5 rounded-sm text-[12px] min-h-11 sm:min-h-0',
  lg: 'gap-2 px-5 py-3 rounded-sm text-[13px] min-h-11 sm:min-h-0',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'font-display font-bold uppercase tracking-wide text-white bg-gb-red ' +
    'hover:bg-gb-red-dark hover:scale-[0.97] active:bg-gb-red-dark ' +
    'focus-visible:ring-gb-red disabled:bg-neutral-400 disabled:hover:scale-100',
  secondary:
    'font-medium text-secondary bg-transparent border border-border ' +
    'hover:bg-elevated hover:border-border-strong active:bg-elevated ' +
    'focus-visible:ring-gb-red disabled:text-muted disabled:border-border-subtle',
  ghost:
    'font-medium text-muted bg-transparent ' +
    'hover:text-primary active:text-primary ' +
    'focus-visible:ring-gb-red disabled:text-border-strong',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'group inline-flex items-center justify-center',
        fullWidth ? 'w-full' : '',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        'cursor-pointer transition-all duration-200 active:scale-[0.98]',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
