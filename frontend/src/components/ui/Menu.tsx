import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  /** Renders in the danger colour (e.g. delete). */
  destructive?: boolean;
  /** When defined, the item is a menuitemradio with this checked state. */
  checked?: boolean;
}

interface MenuProps {
  /** Accessible name for the trigger and the menu. */
  label: string;
  /** Visible trigger content (e.g. "⋯" or a category badge). */
  children: ReactNode;
  items: MenuItem[];
  /** Horizontal anchor of the popup relative to the trigger. */
  align?: "start" | "end";
  triggerClassName?: string;
}

/**
 * APG Menu Button (brief §7.12.3). A real `role="menu"` with full keyboard support:
 * Enter/Space/ArrowDown open and focus the first item, ArrowUp opens the last,
 * Arrow/Home/End move a roving tabindex, Escape closes and returns focus to the
 * trigger, Tab closes and lets focus leave naturally (only the active item is
 * tabbable, so the browser moves focus past the menu), and an outside pointer
 * press closes it. This replaces the `<details>` shape, which has neither role=menu
 * nor arrow keys (review note, brief §7.12.3).
 */
export function Menu({ label, children, items, align = "end", triggerClassName = "" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !itemRefs.current.some((el) => el?.contains(target))
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openAt(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, items.length - 1)));
    setOpen(true);
  }

  function openDefault() {
    const checkedIndex = items.findIndex((it) => it.checked);
    openAt(checkedIndex >= 0 ? checkedIndex : 0);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDefault();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(items.length - 1);
    }
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        // Only the active item is tabbable, so the browser moves focus out of the
        // menu on its own — just close it (no preventDefault).
        close(false);
        break;
    }
  }

  function activate(item: MenuItem) {
    item.onSelect();
    close(true);
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => (open ? close(true) : openDefault())}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassName}
      >
        {children}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute z-20 mt-1 min-w-[11rem] rounded-md border border-border-strong bg-surface p-1 shadow-md ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role={item.checked === undefined ? "menuitem" : "menuitemradio"}
              aria-checked={item.checked === undefined ? undefined : item.checked}
              tabIndex={i === activeIndex ? 0 : -1}
              onClick={() => activate(item)}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                item.destructive ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-ink/5"
              }`}
            >
              {item.checked !== undefined && (
                <span aria-hidden className="w-3.5 shrink-0 text-primary">
                  {item.checked ? "✓" : ""}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
