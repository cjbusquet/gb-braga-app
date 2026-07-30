import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = '', ...rest }: InputProps) {
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
      <input
        id={id}
        className={[
          'block w-full',
          'border-[1.5px] border-border rounded-sm bg-white px-3.5 py-3',
          'font-ui text-base text-primary min-h-11 sm:min-h-0',
          'outline-none transition-all duration-200',
          'focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}
