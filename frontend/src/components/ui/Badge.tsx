import type { ReactNode } from "react";

type Tone = "default" | "growth" | "friction" | "mist";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  default: "border-instrument/60 bg-instrument/30 text-parchment",
  growth: "border-growth/40 bg-growth/15 text-growth",
  friction: "border-friction/40 bg-friction/15 text-friction",
  mist: "border-mist/30 bg-mist/10 text-mist",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
