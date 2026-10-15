import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Navy backgrounds
        navy: {
          950: '#050810',
          900: '#0a0f1e',
          800: '#0d1530',
          700: '#111d3d',
          600: '#162347',
          500: '#1e2f5a',
        },
        // Gold accent
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f5a623',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Surface tokens (used in dark mode)
        surface: {
          DEFAULT: '#111827',
          raised: '#1a2234',
          overlay: '#1f2b40',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f5a623 0%, #d97706 100%)',
        'navy-gradient': 'linear-gradient(135deg, #0a0f1e 0%, #1e2f5a 100%)',
        'hero-gradient': 'linear-gradient(135deg, #050810 0%, #0a0f1e 40%, #111d3d 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(245,166,35,0.15)',
        'gold':    '0 0 20px rgba(245,166,35,0.25)',
        'gold-lg': '0 0 40px rgba(245,166,35,0.35)',
        'glass':   '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':    '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,166,35,0.15)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        'orb-pulse':    'orbPulse 8s ease-in-out infinite',
        'orb-pulse-2':  'orbPulse 12s ease-in-out infinite reverse',
        'shimmer':      'shimmer 2s linear infinite',
        'glow':         'glow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float:    { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        orbPulse: {
          '0%,100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.6' },
          '33%':     { transform: 'translate(30px, -20px) scale(1.1)', opacity: '0.8' },
          '66%':     { transform: 'translate(-20px, 15px) scale(0.95)', opacity: '0.5' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(245,166,35,0.2)' },
          '50%':     { boxShadow: '0 0 40px rgba(245,166,35,0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
