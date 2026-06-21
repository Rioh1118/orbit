import type { Config } from "tailwindcss";

/**
 * Colors are stored as RGB channels in globals.css (e.g. --color-primary: 13 59 102)
 * and consumed here as rgb(var(--x) / <alpha-value>) so every utility supports the
 * opacity modifier: bg-primary, bg-accent/12, hover:bg-ink/5, border-border-strong, …
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: withAlpha("--color-canvas"),
        surface: withAlpha("--color-surface"),
        elevated: withAlpha("--color-elevated"),
        border: {
          DEFAULT: withAlpha("--color-border"),
          strong: withAlpha("--color-border-strong"),
        },
        ink: {
          DEFAULT: withAlpha("--color-ink"),
          muted: withAlpha("--color-ink-muted"),
        },
        primary: {
          DEFAULT: withAlpha("--color-primary"),
          hover: withAlpha("--color-primary-hover"),
        },
        accent: withAlpha("--color-accent"),
        friction: withAlpha("--color-friction"),
        danger: withAlpha("--color-danger"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["11px", "16px"],
        sm: ["12px", "18px"],
        base: ["14px", "20px"],
        lg: ["16px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["28px", "36px"],
        "3xl": ["40px", "48px"],
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
} satisfies Config;
