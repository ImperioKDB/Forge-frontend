"use client"

/**
 * FORGE — Input
 *
 * Focus ring uses the accent color via outline (no box-shadow glow).
 * All other behavior (password toggle, hints, errors, 16px font to
 * prevent iOS zoom, 44px touch target) preserved from prior version.
 */

import { forwardRef, useState } from "react"

const Input = forwardRef(function Input({ label, hint, error, type = "text", className = "", id, ...props }, ref) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)
  const isPassword = type === "password"
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={`w-full min-h-[44px] rounded-md border bg-surface px-3 py-2.5 font-body text-sm text-primary transition-colors duration-fast placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${
            error ? "border-error focus-visible:outline-error" : "border-border focus:border-accent-line"
          } ${isPassword ? "pr-10" : ""} ${className}`}
          style={{ fontSize: "16px" }}
          aria-invalid={!!error}
          aria-describedby={[hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors duration-fast hover:text-secondary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 2L14 14M6.5 6.6a2 2 0 002.9 2.9M4.2 4.3C2.8 5.3 1.8 6.6 1.3 8c1 2.7 3.6 4.5 6.7 4.5 1.2 0 2.3-.3 3.3-.8M7.3 3.6C7.5 3.5 7.8 3.5 8 3.5c3.1 0 5.7 1.8 6.7 4.5-.3.9-.8 1.7-1.5 2.4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1.3 8C2.3 5.3 4.9 3.5 8 3.5s5.7 1.8 6.7 4.5C13.7 10.7 11.1 12.5 8 12.5S2.3 10.7 1.3 8z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            )}
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs text-error" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 4v2.5M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = "Input"
export default Input
