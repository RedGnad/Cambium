import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f6",
          100: "#eeeeec",
          200: "#d8d8d4",
          300: "#b9b9b3",
          400: "#8d8d85",
          500: "#6b6b62",
          600: "#54544c",
          700: "#41413a",
          800: "#2c2c27",
          900: "#1a1a17",
        },
        cambium: {
          DEFAULT: "#2f5d3e",
          50: "#eef5f0",
          100: "#d6e7db",
          400: "#5a8c69",
          600: "#244a31",
          700: "#1c3a26",
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
