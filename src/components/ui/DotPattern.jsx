"use client"

import { useId } from "react"

/**
 * FORGE — DotPattern
 * SVG dot pattern background for decorative sections.
 * Uses CSS variables for theme consistency.
 */

export function DotPattern({
  width = 24,
  height = 24,
  x = 0,
  y = 0,
  cx = 1,
  cy = 0.5,
  cr = 0.5,
  className = "",
  ...props
}) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{
        fill: "var(--text-muted)",
        opacity: 0.15,
      }}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle id="pattern-circle" cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}

export default DotPattern
