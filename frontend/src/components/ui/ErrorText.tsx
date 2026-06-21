import type { ReactNode } from "react";

interface ErrorTextProps {
  children: ReactNode;
}

// danger #c0392b is 5.44:1 on surface / 5.07:1 on canvas — passes WCAG 1.4.3 (4.5:1),
// so error text uses the danger colour directly. role="alert" announces on appearance;
// fadeIn is motion-safe so reduced-motion users get it instantly.
export function ErrorText({ children }: ErrorTextProps) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-sm text-danger motion-safe:animate-[fadeIn_200ms_ease-out]"
    >
      <span aria-hidden className="mt-px select-none">
        ⚠
      </span>
      <span>{children}</span>
    </p>
  );
}
