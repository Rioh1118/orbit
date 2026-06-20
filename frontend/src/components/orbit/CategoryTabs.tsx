export const CATEGORIES = [
  { value: "new_feature", label: "new feature" },
  { value: "bug_fix", label: "bug fix" },
  { value: "refactor", label: "refactor" },
  { value: "investigation", label: "investigation" },
  { value: "support", label: "support" },
  { value: "other", label: "other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

interface CategoryTabsProps {
  value: Category;
  onChange: (c: Category) => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  // Mutually-exclusive filter → radiogroup/radio + aria-checked (review H2 / SC 4.1.2),
  // not aria-pressed (toggle semantics).
  return (
    <div
      role="radiogroup"
      aria-label="カテゴリ"
      className="flex flex-wrap gap-1 border-b border-instrument/30"
    >
      {CATEGORIES.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.value)}
            className={`px-3 py-2 text-sm transition-colors ${
              active
                ? "-mb-px border-b-2 border-parchment text-parchment"
                : "text-mist hover:text-parchment"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
