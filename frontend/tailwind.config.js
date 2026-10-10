/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#263343",
        muted: "#6c7c8c",
        primary: {
          DEFAULT: "#587d9b",
          dark: "#172a43",
        },
        attention: {
          DEFAULT: "#aa8959",
          dark: "#80653e",
        },
        safe: "#577c69",
        danger: "#9b626b",
        line: "rgba(38, 51, 67, 0.12)",
        glass: "rgba(255, 255, 255, 0.55)",
        "glass-strong": "rgba(255, 255, 255, 0.72)",
        "glass-border": "rgba(255, 255, 255, 0.65)",
      },
      fontFamily: {
        display: ["Manrope", "Segoe UI", "sans-serif"],
        body: ["Inter", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      backdropBlur: {
        glass: "24px",
      },
      boxShadow: {
        glass: "0 8px 28px rgba(31, 51, 72, 0.11)",
        "glass-lg": "0 16px 42px rgba(31, 51, 72, 0.15)",
      },
    },
  },
  plugins: [],
};
