import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "friction" | "danger";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

// Tinted background + accessible text. accent/friction cannot be text colours
// (3.26:1 / 3.21:1 on white < 4.5:1), so those tones use ink text over a faint
// tint; danger text passes (5.44:1) so it keeps the danger colour (brief §3.3, §7.3).
const tones: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink-muted",
  accent: "bg-accent/12 text-ink",
  friction: "bg-friction/12 text-ink",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} motion-safe:animate-[scaleIn_150ms_ease-out]`}
    >
      {children}
    </span>
  );
}
