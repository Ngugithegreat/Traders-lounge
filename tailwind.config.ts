
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(220 30% 7%)',
        foreground: 'hsl(0 0% 100%)',
        card: {
          DEFAULT: 'hsl(220 30% 12% / 0.6)',
          foreground: 'hsl(0 0% 100%)',
        },
        popover: {
          DEFAULT: 'hsl(220 30% 10%)',
          foreground: 'hsl(0 0% 100%)',
        },
        primary: {
          DEFAULT: 'hsl(158 100% 44%)',
          foreground: 'hsl(220 30% 7%)',
        },
        secondary: {
          DEFAULT: 'hsl(220 30% 15%)',
          foreground: 'hsl(0 0% 100%)',
        },
        muted: {
          DEFAULT: 'hsl(220 30% 15%)',
          foreground: 'hsl(220 10% 70%)',
        },
        accent: {
          DEFAULT: 'hsl(158 100% 44% / 0.1)',
          foreground: 'hsl(158 100% 44%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(0 0% 100%)',
        },
        border: 'hsl(220 30% 20%)',
        input: 'hsl(220 30% 20%)',
        ring: 'hsl(158 100% 44%)',
        chart: {
          '1': 'hsl(158 100% 44%)',
          '2': 'hsl(197 37% 24%)',
          '3': 'hsl(12 76% 61%)',
          '4': 'hsl(43 74% 66%)',
          '5': 'hsl(27 87% 67%)',
        },
        sidebar: {
          DEFAULT: 'hsl(220 30% 10%)',
          foreground: 'hsl(220 10% 70%)',
          primary: 'hsl(158 100% 44%)',
          'primary-foreground': 'hsl(220 30% 7%)',
          accent: 'hsl(158 100% 44% / 0.1)',
          'accent-foreground': 'hsl(158 100% 44%)',
          border: 'hsl(220 30% 20%)',
          ring: 'hsl(158 100% 44%)',
        },
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 30s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
