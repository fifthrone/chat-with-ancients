/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        surface: "#121a2f",
        textPrimary: "#ecf0ff",
        textSecondary: "#9faecd",
        accent: "#7c9dff",
      },
      fontFamily: {
        display: ["System"],
        body: ["System"],
      },
    },
  },
  plugins: [],
};
