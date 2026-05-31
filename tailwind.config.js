/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Armazém Machado — baseada nas imagens de referência
        dark: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          card2: 'var(--color-card2)',
          border: 'var(--color-border)',
          hover: 'var(--color-hover)',
          text: 'var(--color-text)',
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
