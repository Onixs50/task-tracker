import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        teal: "rgb(var(--teal) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        fa: ["var(--font-fa)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        tickerRtl: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out-collapse": {
          "0%": { opacity: "1", transform: "scale(1)", maxHeight: "80px" },
          "60%": { opacity: "0", transform: "scale(0.96)", maxHeight: "80px" },
          "100%": { opacity: "0", transform: "scale(0.96)", maxHeight: "0px" },
        },
        "mascot-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "mascot-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-18deg)" },
          "75%": { transform: "rotate(4deg)" },
        },
        "mascot-blink": {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(4deg)" },
        },
      },
      animation: {
        ticker: "ticker 38s linear infinite",
        tickerRtl: "tickerRtl 38s linear infinite",
        "fade-up": "fade-up 0.35s ease-out",
        "fade-out-collapse": "fade-out-collapse 0.6s ease forwards",
        "mascot-bob": "mascot-bob 3.2s ease-in-out infinite",
        "mascot-wave": "mascot-wave 1.8s ease-in-out infinite",
        "mascot-blink": "mascot-blink 4.5s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
