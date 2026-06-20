import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', "'Syne'", "'Space Grotesk'", 'sans-serif'],
        body: ['var(--font-body)', "'Inter'", 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#04060F',
        deep: '#080C18',
        surface: '#0D1220',
        card: '#111827',
        'card-hover': '#151D2E',
        border: {
          DEFAULT: '#1A2540',
          bright: '#243560',
        },
        accent: {
          DEFAULT: '#4F6EF7',
          dim: '#3A54C4',
          glow: 'rgba(79,110,247,0.12)',
        },
        amber: {
          DEFAULT: '#F0A500',
          brand: '#F0A500',
          glow: 'rgba(240,165,0,0.10)',
        },
        muted: '#7A869A',
        dimmer: '#3D4F6B',
        success: '#22C55E',
        danger: '#EF4444',
        warn: '#F59E0B',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'pulse-dot': 'pulseDot 2s infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      typography: {
        invert: {
          css: { '--tw-prose-body': '#7A869A', '--tw-prose-headings': '#EDF2FF' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
