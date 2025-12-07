import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Bookworm theme - warm, cozy colors
        cream: {
          50: "#fefdfb",
          100: "#fdf9f3",
          200: "#faf3e6",
          300: "#f5e9d4",
          400: "#efdbb8",
          500: "#e6c896",
        },
        parchment: {
          50: "#faf8f5",
          100: "#f5f0e8",
          200: "#ebe1d1",
          300: "#dcceb3",
          400: "#c9b48e",
          500: "#b69a6a",
        },
        leather: {
          50: "#f9f5f2",
          100: "#f0e6df",
          200: "#e0cabf",
          300: "#c9a590",
          400: "#b08060",
          500: "#8b5a3c",
          600: "#6d4730",
          700: "#553826",
          800: "#3d2a1e",
          900: "#2d1f0f",
        },
        ink: {
          50: "#f7f6f5",
          100: "#e8e5e1",
          200: "#d1cbc3",
          300: "#b3a999",
          400: "#948670",
          500: "#756551",
          600: "#5c4f3f",
          700: "#483d32",
          800: "#362e26",
          900: "#251f1b",
        },
        bookmark: {
          red: "#c25450",
          gold: "#d4a84b",
          green: "#5a8a6a",
          blue: "#4a7c9b",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture": "url('/textures/paper.png')",
      },
    },
  },
  plugins: [],
} satisfies Config;
