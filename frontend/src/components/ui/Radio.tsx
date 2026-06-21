interface RadioProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

/**
 * Ledger radio (brief §7.7). The brief's original peer + nested-span markup could
 * not work — Tailwind's `peer-checked:` is a sibling selector and cannot reach a
 * dot nested inside the label. We instead style the native input directly with
 * `appearance-none` + `bg-clip-content`, so the label can wrap the input (clicking
 * the text selects it) and the inner dot is the input's own clipped background.
 */
export function Radio({
  name,
  value,
  label,
  checked,
  onChange,
  id,
  disabled,
}: RadioProps) {
  const inputId = id ?? `${name}-${value}`;
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-center gap-2.5 text-sm text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
    >
      <input
        type="radio"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-border-strong bg-surface bg-clip-content p-[3px] outline-none transition-colors duration-200 checked:border-primary checked:bg-primary"
      />
      {label}
    </label>
  );
}
