import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "subtle" | "ghost" | "danger";
  children: ReactNode;
}

const base =
  "relative isolate inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none disabled:shadow-none";

// Filled variants get the sample-style ::after glow: a same-colour layer behind the
// button (hidden at rest) that expands and fades on hover. content-[''] is required
// for the pseudo-element to render. No accent variant — accent is non-text (brief §3.3).
const glow =
  "after:absolute after:inset-0 after:-z-10 after:rounded-md after:transition-all after:duration-[400ms] after:content-[''] hover:after:scale-x-[1.4] hover:after:scale-y-[1.6] hover:after:opacity-0";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: `bg-primary text-white font-semibold after:bg-primary hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md active:-translate-y-px active:shadow-sm ${glow}`,
  danger: `bg-danger text-white font-semibold after:bg-danger hover:-translate-y-0.5 hover:shadow-md active:-translate-y-px active:shadow-sm ${glow}`,
  subtle:
    "border border-border-strong bg-surface text-ink font-medium hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
  ghost: "text-ink-muted font-medium hover:bg-ink/5 hover:text-ink",
};

export function Button({ variant = "primary", children, className = "", ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
