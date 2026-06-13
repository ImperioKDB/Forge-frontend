import { useEffect, useRef } from 'react'

export function useScrollReveal() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const reveals = containerRef.current?.querySelectorAll('.reveal')
    reveals?.forEach((el) => observer.observe(el))

    return () => {
      reveals?.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return containerRef
}
