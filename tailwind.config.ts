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
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "orbit-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--gold) / 0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgb(var(--gold) / 0)" },
        },
        "page-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "logo-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        "vortex-in": {
          "0%": { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "translate(var(--vx, 0), var(--vy, 0)) scale(0.1) rotate(400deg)", opacity: "0" },
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
        orbit: "orbit 14s linear infinite",
        "orbit-reverse": "orbit-reverse 14s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "page-fade-in": "page-fade-in 0.5s ease-out",
        "logo-pulse": "logo-pulse 2.6s ease-in-out infinite",
        "vortex-in": "vortex-in 0.7s cubic-bezier(0.6,0,0.9,0.4) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
