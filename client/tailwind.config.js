/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fun: ['"Fredoka"', 'Quicksand', 'cursive', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        pastel: {
          pink: '#FFB6C1',
          purple: '#C3B1E1',
          blue: '#A7EFFF',
          yellow: '#FFFACD',
          mint: '#B6FCD5',
          peach: '#FFDAB9',
        },
      },
    },
  },
  plugins: [],
} 