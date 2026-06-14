"use client"

/**
 * FORGE — Button
 *
 * Drawn rectangles with hairline borders. No glow, no lift-on-hover
 * shadows — state is communicated by fill/border color only, matching
 * the "blueprint/schematic" language (see globals.css .btn / .btn-primary).
 *
 * Variants: primary | ghost | danger | surface
 * Sizes: sm | md | lg
 */

import { forwardRef } from "react"

const Button = forwardRef(function Button(
  { children, variant = "primary", size = "md", loading = false, disabled = false, fullWidth = false, className = "", type = "button", ...props },
  ref
) {
  const isDisabled = disabled || loading

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

  const variants = {
    primary: "bg-accent text-base border-accent hover:bg-[#7FA4E8] focus-visible:outline-accent",
    ghost: "bg-transparent text-secondary border-border-2 hover:border-accent-line hover:text-primary focus-visible:outline-accent",
    danger: "bg-transparent text-error border-error/30 hover:bg-error-soft hover:border-error/50 focus-visible:outline-error",
    surface: "bg-elevated text-secondary border-border-2 hover:border-accent-line hover:text-primary focus-visible:outline-accent",
  }

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
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
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
