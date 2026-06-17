"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/supabase/api"

/**
 * FORGE — ExplainWhyPanel
 *
 * Inline, expandable "Explain why" for a single affected file in
 * PlanReview. Fetches the import/call chain from GET /repos/:id/trace
 * and renders it as a vertical timeline with a 100ms stagger per step.
 *
 * Props:
 *   repoId    -- number
 *   fromPath  -- the anchor (changed) file's path
 *   toPath    -- this subtask's file path
 */
export default function ExplainWhyPanel({ repoId, fromPath, toPath }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chain, setChain] = useState(null)

  async function handleToggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (chain || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(
        `/repos/${repoId}/trace?from=${encodeURIComponent(fromPath)}&to=${encodeURIComponent(toPath)}`
      )
      setChain(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fromPath === toPath) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={handleToggle}
        className="font-mono text-[11px] text-muted transition-colors duration-fast hover:text-accent"
      >
        {open ? "Hide why" : "Explain why →"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 rounded-md p-3"
              style={{ border: "1px solid #3A3E4A", borderRadius: "6px" }}
            >
              {loading && (
                <p className="font-mono text-xs" style={{ color: "#888" }}>
                  Tracing import chain…
                </p>
              )}

              {error && (
                <p className="font-mono text-xs text-error">Couldn't load trace: {error}</p>
              )}

              {chain && !chain.found && (
                <p className="font-mono text-xs" style={{ color: "#888" }}>
                  {chain.message || "No direct chain found in the indexed graph."}
                </p>
              )}

              {chain && chain.found && chain.chain.length > 0 && (
                <div className="flex flex-col">
                  {chain.chain.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold"
                          style={{ backgroundColor: "#6E94D6", color: "#0B0D12" }}
                        >
                          {step.step}
                        </span>
                        {i < chain.chain.length - 1 && (
                          <span className="my-0.5 w-px flex-1" style={{ backgroundColor: "#3A3E4A" }} />
                        )}
                      </div>
                      <p
                        className="pb-3 font-body text-xs leading-relaxed"
                        style={{ color: "#E8E6E0" }}
                      >
                        {step.explanation}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
