interface KeyCapProps {
  k: string;
  size?: "sm" | "md";
}

export function KeyCap({ k, size = "md" }: KeyCapProps) {
  const sz = size === "sm" ? "h-5 w-5 text-xs" : "h-6 w-6 text-sm";
  return (
    <kbd
      className={`inline-flex items-center justify-center ${sz} rounded-sm border border-mist/30 bg-instrument/20 font-mono font-medium text-parchment`}
    >
      {k}
    </kbd>
  );
}
