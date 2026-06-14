/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="workshop"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── All colours reference CSS variables ─────────────────
      colors: {
        // Marketing / paper surfaces
        paper:    'var(--paper)',
        'paper-2': 'var(--paper-2)',
        ink:      'var(--ink)',
        line:     'var(--line)',
        'line-strong': 'var(--line-strong)',

        // App / workshop surfaces
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border:   'var(--bg-border)',
        'border-2': 'var(--bg-border-2)',

        // Structural accent (dependency-graph / active state)
        accent: {
          DEFAULT: 'var(--accent)',
          soft:    'var(--accent-soft)',
          line:    'var(--accent-line)',
        },

        // Selection accent (distinct from accent — "I clicked this")
        selected: {
          DEFAULT: 'var(--selected)',
          soft:    'var(--selected-soft)',
          line:    'var(--selected-line)',
        },

        // Text
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        'ink-soft':  'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',

        // Status — tuned to roughly equal perceptual intensity
        success: 'var(--success)',
        error:   'var(--error)',
        danger:  'var(--error)',
        info:    'var(--info)',
        warning: 'var(--warning)',
        'success-soft': 'var(--success-soft)',
        'error-soft':   'var(--error-soft)',
        'warning-soft': 'var(--warning-soft)',
        'info-soft':    'var(--info-soft)',
      },

      // ─── Typography ───────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-geist)', 'Geist', '-apple-system', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'serif'],
        mono:    ['var(--font-geist-mono)', 'Geist Mono', 'monospace'],
      },

      // ─── Radius ───────────────────────────────────────────────
      borderRadius: {
        DEFAULT: 'var(--radius-md)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },

      // ─── Motion ───────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '150ms',
        normal:  '250ms',
        slow:    '400ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring:          'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Shadows ────────────────────────────────────────────
      // Intentionally minimal — the design language avoids glow.
      // Used only for true elevation (modals, dropdowns).
      boxShadow: {
        panel:   '0 8px 32px rgba(0,0,0,0.35)',
        surface: '0 1px 3px rgba(0,0,0,0.3)',
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },

      animation: {
        'fade-in':   'fade-in 200ms ease forwards',
        'slide-up':  'slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in':  'slide-in 150ms ease forwards',
      },
    },
  },
  plugins: [],
}
