import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

/**
 * Ledger floating-label input (brief §7.8, review-corrected markup). The input
 * must precede the label as a sibling so Tailwind's `peer-placeholder-shown:` /
 * `peer-focus:` reach the label; the label must NOT wrap the input. An empty
 * `placeholder=" "` keeps `:placeholder-shown` truthy while empty without showing
 * placeholder text, so the label rests over the field and lifts on focus/content.
 *
 * forwardRef lets callers focus the field (e.g. the edit dialog focuses the title
 * on open) — PR A follow-up.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, className, ...props },
  ref,
) {
  return (
    <div className="relative pt-6">
      <input
        {...props}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        // placeholder=" " is the floating-label sentinel and must win over any caller
        // placeholder in {...props}, so it is set AFTER the spread (review HIGH-2).
        placeholder=" "
        className={`peer block w-full border-b-2 border-border-strong bg-transparent pb-1 text-sm text-ink outline-none transition-colors placeholder:text-transparent focus:border-primary aria-[invalid=true]:border-danger ${className ?? ""}`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-0 text-xs text-ink-muted transition-all duration-200 peer-placeholder-shown:top-7 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
