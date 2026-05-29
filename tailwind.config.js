/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta EstoqueSync — baseada nas imagens de referência
        dark: {
          bg: '#0d1117',
          card: '#161b22',
          card2: '#1c2333',
          border: '#30363d',
          hover: '#21262d',
        },
        brand: {
          blue: '#3b82f6',
          purple: '#a855f7',
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
