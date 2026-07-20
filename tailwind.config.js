/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        grape: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      boxShadow: {
        pop: '0 10px 25px -8px rgb(249 115 22 / 0.35)',
        'pop-grape': '0 10px 25px -8px rgb(139 92 246 / 0.35)',
        card: '0 6px 20px -6px rgb(100 116 139 / 0.18), 0 2px 6px -2px rgb(100 116 139 / 0.08)',
        'card-hover':
          '0 14px 30px -8px rgb(100 116 139 / 0.25), 0 4px 10px -4px rgb(100 116 139 / 0.1)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(1.6)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        flame: {
          '0%, 100%': { transform: 'scale(1) rotate(-2deg)' },
          '30%': { transform: 'scale(1.15) rotate(2deg)' },
          '60%': { transform: 'scale(1.05) rotate(-1deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        pop: 'pop 0.35s ease-out',
        floatUp: 'floatUp 0.9s ease-out forwards',
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        flame: 'flame 1.4s ease-in-out infinite',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
