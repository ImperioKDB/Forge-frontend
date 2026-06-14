"use client"

/**
 * FORGE - Button
 *
 * Drawn rectangles with hairline borders. No glow, no lift-on-hover
 * shadows - state is communicated by fill/border color only, matching
 * the "blueprint/schematic" language (see globals.css .btn / .btn-primary).
 *
 * Variants: primary | ghost | danger | surface
 * Sizes:    sm | md | lg
 *
 * surface prop
 * ------------
 * "workshop" (default) - accent blue fill, dark base text. For /app/* pages.
 * "paper"              - ink fill, paper text, hover -> accent blue.
 *                        Matches .btn-primary in globals.css for paper contexts.
 *                        Use on login, signup, and any future marketing forms.
 *
 * Usage:
 *   <Button surface="paper" variant="primary" size="lg">Sign In</Button>
 */

import { forwardRef } from "react"

const Button = forwardRef(function Button(
  {
    children,
    variant   = "primary",
    size      = "md",
    surface   = "workshop",
    loading   = false,
    disabled  = false,
    fullWidth = false,
    className = "",
    type      = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading
  const isPaper    = surface === "paper"

  const base = [
    "inline-flex items-center justify-center gap-2",
    "font-mono font-medium tracking-[0.02em]",
    "border rounded-md",
    "transition-all duration-fast",
    "select-none cursor-pointer touch-action-manipulation",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.98]",
    fullWidth ? "w-full" : "",
  ].join(" ")

  // Workshop variants - identical to before, zero regression
  const workshopVariants = {
    primary: "bg-accent text-base border-accent hover:bg-[#7FA4E8] focus-visible:outline-accent",
    ghost:   "bg-transparent text-secondary border-border-2 hover:border-accent-line hover:text-primary focus-visible:outline-accent",
    danger:  "bg-transparent text-error border-error/30 hover:bg-error-soft hover:border-error/50 focus-visible:outline-error",
    surface: "bg-elevated text-secondary border-border-2 hover:border-accent-line hover:text-primary focus-visible:outline-accent",
  }

  // Paper variants - only "primary" differs meaningfully
  // ink fill + paper text mirrors globals.css .btn-primary (paper context)
  // ghost/danger/surface fall back to workshop variants - they read fine on paper
  const paperVariants = {
    primary: "border-ink hover:bg-accent hover:border-accent focus-visible:outline-accent",
    ghost:   "bg-transparent border-line hover:border-accent-line focus-visible:outline-accent",
    danger:  "bg-transparent text-error border-error/30 hover:bg-error-soft hover:border-error/50 focus-visible:outline-error",
    surface: "bg-transparent border-line hover:border-accent-line focus-visible:outline-accent",
  }

  // Paper primary needs inline style for ink bg + paper text (not in Tailwind color map as-is)
  const paperPrimaryStyle = isPaper && variant === "primary"
    ? { background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" }
    : undefined

  const variantClass = isPaper
    ? (paperVariants[variant] ?? paperVariants.primary)
    : (workshopVariants[variant] ?? workshopVariants.primary)

  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[34px]",
    md: "px-4 py-2.5 text-[13px] min-h-[44px]",
    lg: "px-6 py-3.5 text-sm min-h-[46px]",
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`${base} ${variantClass} ${sizes[size] ?? sizes.md} ${className}`}
      style={paperPrimaryStyle}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

export default Button
