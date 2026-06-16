/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0b0f",
          secondary: "#111318",
          tertiary: "#1a1d24",
          quaternary: "#22262f",
        },
        accent: {
          DEFAULT: "#6c63ff",
          light: "#8b85ff",
          dark: "#4a42e8",
        },
        border: {
          primary: "rgba(255,255,255,0.12)",
          secondary: "rgba(255,255,255,0.07)",
        },
        text: {
          primary: "#f0f2f7",
          secondary: "#8b91a1",
          muted: "#545a6a",
        },
      },
      fontFamily: {
        sans: ["DM-Sans"],
        display: ["Syne-Bold"],
        mono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
