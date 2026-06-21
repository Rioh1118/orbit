interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <hr className="border-border" />;
  }
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  );
}
