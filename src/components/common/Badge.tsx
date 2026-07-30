import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  children: ReactNode;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  neutral: 'text-muted bg-elevated border border-border',
  brand: 'text-gb-red bg-gb-red-glow border border-gb-red/20',
  success: 'text-green-700 bg-green-50 border border-green-200',
  warning: 'text-amber-700 bg-amber-50 border border-amber-200',
  danger: 'text-red-700 bg-red-50 border border-red-200',
};

export default function Badge({ color = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        'rounded px-2 py-0.5',
        'text-[10px] font-semibold uppercase tracking-wide',
        COLOR_CLASSES[color],
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
