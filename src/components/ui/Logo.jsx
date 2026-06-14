/**
 * FORGE — Logo
 *
 * Replaces ForgeWordmark. The mark is a tiny dependency graph:
 * one solid "changed" node connected to two "affected" nodes via
 * traced edges — the same motif used throughout the product.
 *
 * sizes: xs (sidebar collapsed) · sm (topbar) · md (default) · lg (auth pages)
 */

const SIZES = {
  xs: { mark: 16, text: "text-sm" },
  sm: { mark: 18, text: "text-base" },
  md: { mark: 22, text: "text-lg" },
  lg: { mark: 28, text: "text-2xl" },
}

export function LogoMark({ size = 22, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="6" cy="6" r="3.5" fill="currentColor" className="text-current" />
      <circle cx="18" cy="6" r="3.5" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-soft)" />
      <circle cx="12" cy="18" r="3.5" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-soft)" />
      <path d="M9 7 L15 7" stroke="var(--line-strong, var(--bg-border-2))" strokeWidth="1.5" />
      <path d="M8 8.5 L10.5 15.5" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M16 8.5 L13.5 15.5" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  )
}

export default function Logo({ size = "md", withWordmark = true, className = "" }) {
  const cfg = SIZES[size] ?? SIZES.md
  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold ${cfg.text} ${className}`}>
      <LogoMark size={cfg.mark} />
      {withWordmark && "Forge"}
    </span>
  )
}
