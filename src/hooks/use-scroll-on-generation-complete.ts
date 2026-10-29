'use client'

import { useEffect, useRef } from 'react'
import { scrollToResult } from '@/lib/scroll-to-result'

/** Scroll to a result element when generation finishes successfully. */
export function useScrollOnGenerationComplete(
  isGenerating: boolean,
  hasResult: boolean,
  targetId?: string | null,
) {
  const pendingScrollRef = useRef(false)

  useEffect(() => {
    if (isGenerating) {
      pendingScrollRef.current = true
    }
  }, [isGenerating])

  useEffect(() => {
    if (!targetId) return
    if (!isGenerating && hasResult && pendingScrollRef.current) {
      pendingScrollRef.current = false
      scrollToResult(targetId)
    }
  }, [isGenerating, hasResult, targetId])
}
