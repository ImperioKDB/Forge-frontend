/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base:          '#080808',
        surface:       '#111111',
        border:        '#1f1f1f',
        accent:        '#2563EB',
        'accent-glow': '#2563eb33',
        secondary:     '#F0F0F0',
        // CHANGED: three-tier text system
        tertiary:      '#A0A0A0',   // new — subtle hints and placeholders
        danger:        '#dc2626',
        // CHANGED: success is now proper green (was cyan #06b6d4 — semantically wrong)
        success:       '#22c55e',
        // CHANGED: moved old cyan 'success' to 'info'
        info:          '#06b6d4',
        // CHANGED: #555555 failed WCAG 4.5:1 on surface. #616161 passes cleanly.
        muted:         '#616161',
      },
      fontFamily: {
        // CHANGED: Inter replaced — it is a generic font that reduces brand character.
        // Plus Jakarta Sans: clean, contemporary, excellent for developer tools.
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      boxShadow: {
        glow:      '0 0 12px #2563eb33',
        'glow-sm': '0 0 6px #2563eb22',
      },
      animation: {
        pulse:      'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':  'fadeIn 150ms ease forwards',
        'slide-in': 'slideIn 150ms ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
