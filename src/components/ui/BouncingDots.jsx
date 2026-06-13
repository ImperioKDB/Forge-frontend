"use client"

import React from "react"
import { motion } from "framer-motion"

/**
 * FORGE — BouncingDots
 * Animated loading indicator with configurable dots and optional message.
 * Uses Framer Motion for smooth spring physics.
 * Adapted to Forge design tokens (CSS variables).
 */

export function BouncingDots({
  dots = 3,
  message,
  messagePlacement = "bottom",
  dotSize = 12,
  color = "var(--accent)",
  className = "",
}) {
  const containerDir =
    messagePlacement === "bottom"
      ? "flex-col"
      : messagePlacement === "right"
      ? "flex-row"
      : "flex-row-reverse"

  return (
    <div className={`inline-flex items-center justify-center gap-3 ${containerDir} ${className}`}>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: dots }).map((_, index) => (
          <motion.div
            key={index}
            className="rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
            }}
            animate={{ y: [0, -dotSize * 1.6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {message && (
        <span
          className="font-mono text-xs tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          {message}
        </span>
      )}
    </div>
  )
}

export default BouncingDots
