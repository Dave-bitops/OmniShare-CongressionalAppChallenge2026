/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        olive: {
          50: '#f7f8f4',
          100: '#eef0e6',
          200: '#dde0cd',
          300: '#c4c9ad',
          400: '#a8af88',
          500: '#8d9669',
          600: '#717a52',
          700: '#5a6141',
          800: '#484d36',
          900: '#3a3e2d',
          950: '#1f2118',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f4ecdd',
          300: '#ecdfc6',
          400: '#e0cda6',
          500: '#d0b67e',
        },
        clay: {
          400: '#c89b7b',
          500: '#b07d5a',
          600: '#96654a',
        },
      },
    },
  },
  plugins: [],
};
