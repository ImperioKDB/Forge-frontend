"use client"

import { useState, useEffect, useRef } from "react"
import { useSSEStream } from "@/lib/hooks/useSSEStream"

const FILE_RE = /\*\*([\w.\-/@]+\.(?:tsx?|jsx?|js|ts|css|json))\*\*/g

/**
 * FORGE -- usePlannerTrace
 *
 * Wraps useSSEStream and extracts two derived slices from the token
 * stream while it is arriving:
 *
 *   text   (string)    full streamed text so far (for the trace log)
 *   files  (string[])  unique file paths as they appear in the stream
 *   done   (boolean)   true when the stream has closed cleanly
 *   error  (string?)   if the stream fails
 *
 * File paths are extracted by matching the **path.ext** markdown pattern
 * that the planner backend emits for every subtask file_path.
 */
export function usePlannerTrace(streamUrl) {
  const { content, done, error } = useSSEStream(streamUrl)

  const [files, setFiles] = useState([])
  const seenRef = useRef(new Set())

  useEffect(() => {
    if (!content) return
    const matches = [...content.matchAll(FILE_RE)]
    const newFiles = []
    for (const m of matches) {
      const path = m[1]
      if (!seenRef.current.has(path)) {
        seenRef.current.add(path)
        newFiles.push(path)
      }
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [content])

  useEffect(() => {
    if (!streamUrl) {
      setFiles([])
      seenRef.current = new Set()
    }
  }, [streamUrl])

  return { text: content || "", files, done, error }
}
