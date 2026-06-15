"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/supabase/api"

/**
 * FORGE -- useSubgraph
 *
 * Fetches the real file-level dependency subgraph for a set of file
 * paths from the indexed repo graph.
 *
 * Returns { nodes, edges, loading, error } where:
 *   nodes  -- [{ id, path, role }]  (changed files + 1-hop neighbours)
 *   edges  -- [{ from, to, type }]  (IMPORTS edges between those files)
 *
 * The backend endpoint accepts:
 *   GET /repos/:repoId/subgraph?paths[]=a.tsx&paths[]=b.tsx
 *
 * @param {number|null} repoId  -- repo to query
 * @param {string[]}    paths   -- file paths from the planner's task list
 */
export function useSubgraph(repoId, paths) {
  const [nodes,   setNodes]   = useState([])
  const [edges,   setEdges]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!repoId || !paths || paths.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const qs = paths.map((p) => `paths[]=${encodeURIComponent(p)}`).join("&")
    apiFetch(`/repos/${repoId}/subgraph?${qs}`)
      .then((data) => {
        if (cancelled) return
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [repoId, paths?.join(",")])

  return { nodes, edges, loading, error }
}
