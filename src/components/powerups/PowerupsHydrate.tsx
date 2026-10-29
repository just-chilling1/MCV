'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store'
import type { UpsellType } from '@/types'
import { ALL_POWERUPS } from '@/types'

const VALID: UpsellType[] = ALL_POWERUPS

function normalizePowerups(raw: unknown): UpsellType[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((p) => (p === 'dfy' ? 'protector' : p))
    .filter((p): p is UpsellType => typeof p === 'string' && VALID.includes(p as UpsellType))
}

/** One fetch after shell mounts — source of truth is Supabase, not localStorage. */
export default function PowerupsHydrate() {
  const setUnlockedUpsells = useAppStore((s) => s.setUnlockedUpsells)

  useEffect(() => {
    setUnlockedUpsells(ALL_POWERUPS)
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/powerups/me', { credentials: 'include' })
        if (!res.ok) {
          if (!cancelled) setUnlockedUpsells(ALL_POWERUPS)
          return
        }
        const data = await res.json()
        const powerups = normalizePowerups(data.powerups)
        if (!cancelled) setUnlockedUpsells(powerups.length > 0 ? powerups : ALL_POWERUPS)
      } catch {
        if (!cancelled) setUnlockedUpsells(ALL_POWERUPS)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setUnlockedUpsells])

  return null
}
