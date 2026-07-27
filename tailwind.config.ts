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
        background: "#0c1324",
        surface: "#0c1324",
        "surface-container-lowest": "#070d1f",
        "surface-container-low": "#151b2d",
        "surface-container": "#191f31",
        "surface-container-high": "#23293c",
        "surface-container-highest": "#2e3447",
        "surface-variant": "#2e3447",
        "on-surface": "#dce1fb",
        "on-surface-variant": "#c3c6d7",
        "on-background": "#dce1fb",
        primary: "#b4c5ff",
        "primary-container": "#2563eb",
        "on-primary": "#002a78",
        "on-primary-container": "#eeefff",
        secondary: "#4cd7f6",
        "secondary-container": "#03b5d3",
        "on-secondary": "#003640",
        tertiary: "#d2bbff",
        "tertiary-container": "#8343f4",
        "on-tertiary": "#3f008e",
        outline: "#8d90a0",
        "outline-variant": "#434655",
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        success: "#4ade80",
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
