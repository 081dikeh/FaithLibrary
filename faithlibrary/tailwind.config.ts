// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        walnut:  '#5D4037',
        roasted: '#3E2723',
        ochre:   '#8D6E63',
        sand:    '#D7CCC8',
        'sand-light': '#EFE9E7',
        bone:    '#F5F5F5',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        ui:      ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(62,39,35,0.06), 0 4px 16px rgba(62,39,35,0.08)',
        lift: '0 8px 32px rgba(62,39,35,0.14)',
        nav:  '0 2px 20px rgba(62,39,35,0.18)',
      },
      animation: {
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-down': 'slideDown 0.25s ease forwards',
        'shimmer':    'shimmer 1.6s ease infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity:'0', transform:'translateY(16px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:    { from: { opacity:'0' }, to: { opacity:'1' } },
        scaleIn:   { from: { opacity:'0', transform:'scale(0.96)' }, to: { opacity:'1', transform:'scale(1)' } },
        slideDown: { from: { opacity:'0', transform:'translateY(-8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition:'-400% 0' }, '100%': { backgroundPosition:'400% 0' } },
      },
    },
  },
  plugins: [],
}

export default config