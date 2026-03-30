/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f0f',
          secondary: '#1a1a1a',
          tertiary: '#252525',
          hover: '#2a2a2a'
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          dim: '#4f46e5'
        },
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#3a3a3a'
        }
      }
    }
  },
  plugins: []
}
