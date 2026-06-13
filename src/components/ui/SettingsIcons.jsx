/**
 * FORGE -- SettingsIcons
 * CSS-variable icon components. Import in settings/page.jsx to replace
 * hardcoded stroke="#06b6d4" and stroke="#555" SVGs.
 *
 * Usage:
 *   import { CheckIcon, MutedIcon, DangerIcon } from '@/components/ui/SettingsIcons'
 */

export function CheckIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 8L6.5 11.5L13 5"
        stroke="var(--success)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MutedIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" stroke="var(--text-muted)" strokeWidth="1.5" />
      <path d="M8 5v3.5L10 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function DangerIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 2L14 13H2L8 2Z"
        stroke="var(--error)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 6v3M8 11h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
