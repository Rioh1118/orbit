import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "static" | "interactive";
}

export function Card({ children, variant = "static", className = "", ...rest }: CardProps) {
  const interactive =
    variant === "interactive"
      ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      : "";
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${interactive} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
