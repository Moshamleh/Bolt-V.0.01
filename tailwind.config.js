/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'glow': '0 0 15px 2px rgba(59, 130, 246, 0.5)'
      },
      backgroundImage: {
        'glowing-gradient': 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
        'bolt-gradient': 'linear-gradient(135deg, #3b82f6, #fbbf24, #6b7280)'
      }
    },
  },
  plugins: [],
};