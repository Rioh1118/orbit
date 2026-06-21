import { Badge } from "@/components/ui/Badge";
import { Menu } from "@/components/ui/Menu";
import { CATEGORY_SHORT_LABEL } from "./labels";
import { TASK_CATEGORIES, type TaskCategory } from "./types";

interface CategoryMenuProps {
  category: TaskCategory;
  onChange: (category: TaskCategory) => void;
}

/**
 * Clickable category badge that opens a radio menu for quick re-categorising
 * (brief §7.12.3: keep category change no deeper than the old select). Reuses the
 * APG Menu primitive with menuitemradio semantics.
 */
export function CategoryMenu({ category, onChange }: CategoryMenuProps) {
  return (
    <Menu
      label={`カテゴリ: ${CATEGORY_SHORT_LABEL[category]}。変更する`}
      align="end"
      triggerClassName="shrink-0 rounded-full focus-visible:outline-offset-2"
      items={TASK_CATEGORIES.map((c) => ({
        id: c.value,
        label: c.label,
        checked: c.value === category,
        onSelect: () => onChange(c.value as TaskCategory),
      }))}
    >
      <Badge tone="neutral">{CATEGORY_SHORT_LABEL[category]}</Badge>
    </Menu>
  );
}
