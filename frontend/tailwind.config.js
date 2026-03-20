/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d1dae6',
          300: '#a8bacf',
          400: '#7a96b3',
          500: '#587799',
          600: '#465e7d',
          700: '#3a4c65',
          800: '#334155', // Sleek slate
          900: '#2d3848',
          950: '#1e2530',
        },
        accent: '#f59e0b', // Amber for highlights
      },
    },
  },
  plugins: [],
}
