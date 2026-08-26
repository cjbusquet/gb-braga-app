import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 justify-between items-start mb-[18px] sm:flex-row sm:items-end">
      <div className="min-w-0">
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">{eyebrow}</div>
        <h1 className="flex flex-wrap gap-2.5 items-center font-display text-xl font-extrabold uppercase text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">{actions}</div>}
    </div>
  );
}
