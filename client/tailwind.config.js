/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['"Fredoka One"', "cursive"],
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
          pink: '#FECFEF',
          blue: '#A7F0BA',
          yellow: '#FFF7AE',
          green: '#CFFFB3',
        },
        'light-pink': '#FB9EBB',
        'light-yellow': '#F3F3AB',
        'aqua': '#A4D4DC',
        'light-peach': '#F4CEB8',
      },
      backgroundImage: {
        'hero': "url('/img/hero-desktop.jpg')",
        'mobileHero': "url('/img/hero-mobile.jpg')",
      },
      ringColor: {
        'pastel-pink': '#FECFEF',
      },
    },
  },
  plugins: [],
} 