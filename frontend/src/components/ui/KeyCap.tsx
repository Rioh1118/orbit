interface KeyCapProps {
  k: string;
  size?: "sm" | "md";
}

export function KeyCap({ k, size = "md" }: KeyCapProps) {
  const sz = size === "sm" ? "h-5 min-w-5 px-1 text-xs" : "h-6 min-w-6 px-1.5 text-sm";
  return (
    <kbd
      className={`inline-flex items-center justify-center ${sz} rounded-md border border-border-strong bg-surface font-mono font-medium text-ink shadow-sm`}
    >
      {k}
    </kbd>
  );
}
