export const chartTheme = {
  axis: { stroke: "var(--color-mist)", fontSize: 11 },
  grid: { stroke: "var(--color-instrument)", opacity: 0.2 },
  tooltipStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-instrument)",
    borderRadius: 4,
    fontSize: 12,
    color: "var(--color-parchment)",
  } as const,
};

export const modeColors: Record<string, string> = {
  spec_read: "#94b4c1",
  task_breakdown: "#7b9faf",
  code_explore: "#547792",
  design: "#6f8faa",
  implement: "#8fa8b8",
  verify: "#a9c0cc",
  debug: "#d4a574",
  study: "#b8a888",
  review: "#7fb28e",
  consult: "#c9c0ad",
  other: "#6b7a89",
};
