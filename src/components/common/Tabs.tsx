import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Underline tab bar — the pattern already duplicated near-identically across
 * CheckinPage/GraduacaoPage/FinanceiroPage/ProfessorView/IntegracoesPage. */
export default function Tabs<T extends string>({ tabs, active, onChange, className = '' }: TabsProps<T>) {
  return (
    <div className={['flex overflow-x-auto gap-1 mb-5 border-b border-border', className].filter(Boolean).join(' ')}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={[
            'flex gap-1.5 items-center py-2 px-4 -mb-px min-h-11 sm:min-h-0 text-[13px] bg-none border-none border-b-2 cursor-pointer whitespace-nowrap transition-colors duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
            active === t.id ? 'font-bold border-gb-red text-gb-red' : 'font-normal border-transparent text-muted hover:text-secondary active:text-secondary',
          ].join(' ')}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}
