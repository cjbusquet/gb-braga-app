import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border bg-card shadow-xs',
        PADDING_CLASSES[padding],
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
