interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        'relative shrink-0 w-11 h-6 rounded-full border-none outline-none transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed bg-neutral-300' : checked ? 'cursor-pointer bg-gb-red' : 'cursor-pointer bg-neutral-300',
      ].join(' ')}
    >
      <span
        className="block absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full transition-[left] duration-200"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  );
}
