import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0e12",
        surface: "#12141c",
        "surface-container-lowest": "#08090d",
        "surface-container-low": "#161924",
        "surface-container": "#1c202e",
        "surface-container-high": "#262b3e",
        "surface-container-highest": "#323850",
        "surface-variant": "#323850",
        "on-surface": "#ffffff",
        "on-surface-variant": "#e2e8f0",
        "on-background": "#ffffff",
        primary: "#ff6600",
        "primary-hover": "#ea580c",
        "primary-container": "#ff6600",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        secondary: "#ff9900",
        "secondary-container": "#d97706",
        "on-secondary": "#ffffff",
        tertiary: "#ffb703",
        "tertiary-container": "#b45309",
        "on-tertiary": "#ffffff",
        outline: "#94a3b8",
        "outline-variant": "#475569",
        error: "#f87171",
        "error-container": "#991b1b",
        "on-error-container": "#fecaca",
        success: "#22c55e",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: {
        container: "1440px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-glow": "pulse-glow 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
