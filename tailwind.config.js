/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pet: {
          bg: '#0a0a0f',
          glass: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.12)',
          glow: '#a78bfa',
          accent: '#c4b5fd',
          piano: '#f8fafc',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(167, 139, 250, 0.35)',
        'glow-sm': '0 0 12px rgba(167, 139, 250, 0.25)',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
