interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <hr className="border-instrument/30" />;
  }
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-instrument/30" />
      <span className="text-xs font-medium text-mist">{label}</span>
      <hr className="flex-1 border-instrument/30" />
    </div>
  );
}
