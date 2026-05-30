import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",
        instrument: "var(--color-instrument)",
        mist: "var(--color-mist)",
        parchment: {
          DEFAULT: "var(--color-parchment)",
          muted: "var(--color-parchment-muted)",
        },
        growth: "var(--color-growth)",
        friction: "var(--color-friction)",
        danger: "var(--color-danger)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
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
        instrument: "inset 0 1px 0 0 rgb(148 180 193 / 0.08)",
        glow: "0 0 24px -4px rgb(127 178 142 / 0.25)",
      },
      letterSpacing: {
        instrument: "0.08em",
      },
    },
  },
  plugins: [],
} satisfies Config;
