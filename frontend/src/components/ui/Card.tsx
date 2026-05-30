import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "elevated";
}

export function Card({ children, variant = "default", className = "", ...rest }: CardProps) {
  const bg = variant === "elevated" ? "bg-surface" : "bg-transparent";
  return (
    <div
      className={`${bg} rounded-md border border-instrument/40 shadow-instrument ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
