export const CATEGORIES = [
  { value: "learning", label: "learning" },
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
  return (
    <div className="flex flex-wrap gap-1 border-b border-instrument/30">
      {CATEGORIES.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`px-3 py-2 font-mono text-xs uppercase tracking-instrument transition-colors ${
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
