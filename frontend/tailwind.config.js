/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F2A43",
        muted: "#4C7089",
        primary: {
          DEFAULT: "#1690E0",
          dark: "#0F72B8",
        },
        attention: {
          DEFAULT: "#F0A93B",
          dark: "#C98A20",
        },
        safe: "#14B8A6",
        danger: "#EF5B72",
        line: "rgba(15, 42, 67, 0.12)",
        glass: "rgba(255, 255, 255, 0.55)",
        "glass-strong": "rgba(255, 255, 255, 0.72)",
        "glass-border": "rgba(255, 255, 255, 0.65)",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      backdropBlur: {
        glass: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(15, 42, 67, 0.12)",
        "glass-lg": "0 16px 48px rgba(15, 42, 67, 0.16)",
      },
    },
  },
  plugins: [],
};
