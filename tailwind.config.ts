import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0C1B2A",
          800: "#122437",
          700: "#1B3348",
          600: "#2A4762",
          400: "#5D7387",
          300: "#8CA0B1",
        },
        paper: "#FAF8F5",
        accent: {
          DEFAULT: "#ED5B26",
          dark: "#C9471A",
          soft: "#FDE9E0",
        },
        verify: {
          DEFAULT: "#0F7A58",
          soft: "#DDF2E9",
        },
        warn: {
          DEFAULT: "#B7791F",
          soft: "#FBF0D9",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,27,42,0.06), 0 8px 24px -18px rgba(12,27,42,0.35)",
        lift: "0 18px 40px -24px rgba(12,27,42,0.45)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
