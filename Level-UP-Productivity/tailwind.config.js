/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5D1BE3',
          light: '#7F45E8',
          dark: '#4A15B7',
        },
        secondary: {
          DEFAULT: '#1072F1',
          light: '#3E8FF3',
          dark: '#0C5BC0',
        },
        background: {
          DEFAULT: '#120E1B',
          light: '#1C1629',
          card: 'rgba(54, 47, 47, 0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
} 