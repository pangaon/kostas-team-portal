import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dbe6ff", 200: "#bfd2ff", 300: "#94b3ff",
          400: "#618cff", 500: "#3b66f5", 600: "#2348e0", 700: "#1c39bd",
          800: "#1d3399", 900: "#1d2f78",
        },
        pitch: { light: "#2faa55", DEFAULT: "#1f9d4d", dark: "#147a39", line: "#ffffff" },
        ink: { DEFAULT: "#0b1120", soft: "#334155", muted: "#64748b", faint: "#94a3b8" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        lift: "0 10px 30px -12px rgba(16,24,40,.22)",
        token: "0 4px 10px -2px rgba(0,0,0,.35)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem", "3xl": "1.5rem" },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(.9)" }, "60%": { transform: "scale(1.04)" }, "100%": { transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        fadeUp: "fadeUp .28s cubic-bezier(.2,.7,.3,1) both",
        pop: "pop .22s cubic-bezier(.2,.7,.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
