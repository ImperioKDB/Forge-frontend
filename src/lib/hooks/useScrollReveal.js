'use client'

/**
 * FORGE — Scroll Reveal Hook
 * Phase 4: Polish & Landing Page
 */

import { useEffect, useRef } from 'react'

export function useScrollReveal(options = {}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements = container.querySelectorAll('.reveal')
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            if (options.once !== false) {
              observer.unobserve(entry.target)
            }
          } else if (options.once === false) {
            entry.target.classList.remove('visible')
          }
        })
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin, options.once])

  return containerRef
}

export function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
