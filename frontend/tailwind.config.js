/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#F6F7FA',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#141821',
          muted: '#5B6472',
          faint: '#8A94A6',
        },
        border: {
          DEFAULT: '#E3E6EC',
          strong: '#CBD1DC',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#5B7CF5',
          500: '#3457E8',
          600: '#2643C4',
          700: '#1F359A',
        },
        sidebar: {
          DEFAULT: '#12151D',
          hover: '#1B2030',
          ink: '#B7BECC',
          inkMuted: '#6B7386',
        },
        status: {
          safe: '#1D8A5C',
          safeBg: '#E6F6EE',
          warn: '#B4740F',
          warnBg: '#FBF0DD',
          critical: '#C13B3B',
          criticalBg: '#FBEAEA',
          info: '#0E7C8A',
          infoBg: '#E4F4F6',
          neutral: '#5B6472',
          neutralBg: '#EEF0F3',
        },
      },
      borderRadius: {
        xl2: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 24, 33, 0.04), 0 1px 1px rgba(20,24,33,0.03)',
        popover: '0 10px 30px rgba(20, 24, 33, 0.12)',
      },
    },
  },
  plugins: [],
};
