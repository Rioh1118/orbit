import type { SliceMode } from "@/features/slices/types";

// Recharts receives concrete colour strings (var() is unreliable in SVG presentation
// attributes), so these are resolved Ledger hex values rather than tokens.
export const chartTheme = {
  axis: { stroke: "#5a6b80", fontSize: 11 }, // ink-muted
  grid: { stroke: "#e3e8ef", opacity: 1 }, // border
  tooltipStyle: {
    background: "#ffffff",
    border: "1px solid #76879c",
    borderRadius: 6,
    fontSize: 12,
    color: "#0b1d35",
  } as const,
  // Force tooltip text to high-contrast ink. Recharts otherwise colours each item by its
  // series colour, and mid-tone series are unreadable on the white tooltip (WCAG 1.4.3).
  // The colour swatch still identifies the series.
  tooltipItemStyle: { color: "#0b1d35" } as const, // ink
  tooltipLabelStyle: { color: "#5a6b80" } as const, // ink-muted
};

// Record<SliceMode, string> forces exhaustiveness: a new mode is a compile error here —
// the one place the signal is drawn (review LOW). Ledger chart palette (brief §7.9):
// primary navy / accent green / friction amber anchor the meaningful modes; the rest are
// low-saturation slate/tan variations so they read as "other" without competing.
export const modeColors: Record<SliceMode, string> = {
  spec_read: "#5a6b80",
  task_breakdown: "#2f5d7a",
  study: "#9a7b4f",
  code_explore: "#0d3b66",
  design: "#4a7a9b",
  implement: "#00a368",
  review: "#3f8f6e",
  verify: "#7d94a8",
  debug: "#cb7016",
  consult: "#8b6f9c",
  other: "#9aa7b8",
};

// Donut/swatch colour for a mode key. Unknown keys — including the grouped
// "その他" bucket (REST_KEY) — fall back to the neutral slate so they read as "other".
export function sliceColor(key: string): string {
  return modeColors[key as SliceMode] ?? "#9aa7b8";
}
