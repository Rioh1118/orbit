import type { ReactNode } from "react";

interface ErrorTextProps {
  children: ReactNode;
}

// danger-on-surface is only 2.78:1 — below the WCAG 1.4.3 AA text minimum (4.5:1).
// So error text uses high-contrast parchment with a danger accent bar instead of danger
// text. role="alert" makes screen readers announce it the moment it appears.
export function ErrorText({ children }: ErrorTextProps) {
  return (
    <p
      role="alert"
      className="border-l-2 border-danger pl-2.5 text-sm text-parchment"
    >
      {children}
    </p>
  );
}
