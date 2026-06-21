import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        accent: "var(--color-accent)",
        friction: "var(--color-friction)",
        danger: "var(--color-danger)",
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
