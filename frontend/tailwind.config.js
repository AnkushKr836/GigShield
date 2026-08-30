/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Overcast sky" background — a working weather-app tone, not pure white
        bg: "#E9EDF1",
        surface: "#FFFFFF",
        // Storm slate — the deep near-navy that carries the brand, never pure black
        ink: "#1B2430",
        storm: {
          DEFAULT: "#2F3E52",
          light: "#48566B",
        },
        // Beacon amber — the one warm signal color, used sparingly for calls to action
        signal: {
          DEFAULT: "#E8871E",
          dark: "#C56F12",
        },
        // Coverage-active green and rejected/danger red — status-only, never decorative
        safe: "#2F7D5C",
        danger: "#B3432B",
        line: "#C9D2DB",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
