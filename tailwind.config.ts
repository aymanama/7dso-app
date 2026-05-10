import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:           '#0B0E14',
        bg2:          '#0F1320',
        surface:      'rgba(255,255,255,0.04)',
        'surface-hi': 'rgba(255,255,255,0.07)',
        stroke:       'rgba(255,255,255,0.08)',
        'stroke-hi':  'rgba(255,255,255,0.16)',
        text:         '#E8ECF5',
        muted:        '#7A82A0',
        dim:          '#525978',
        gold:         '#F5C84B',
        'gold-dim':   '#9A7A24',
        purple:       '#B58CFF',
        'purple-dim': '#5A3FB0',
        amber:        '#FFA958',
        teal:         '#5EEAD4',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 360ms cubic-bezier(.2,.8,.2,1) both',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
