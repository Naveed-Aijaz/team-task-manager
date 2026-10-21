/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b2a33',
        paper: '#f4f5f2',
        line: '#dde1dc',
        muted: '#68757d',
        brand: { DEFAULT: '#0e6b63', dark: '#0a524c', soft: '#dcefec' },
        rust: '#b4461f',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
