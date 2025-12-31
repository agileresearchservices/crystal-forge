'use client'

import { useState, useEffect, useCallback } from 'react'

interface PanelSizes {
  vertical: number[]
  horizontal: number[]
}

const STORAGE_KEY = 'crystal-forge-panel-sizes'

const DEFAULT_SIZES: PanelSizes = {
  vertical: [70, 30],
  horizontal: [60, 40],
}

/**
 * Hook for managing resizable panel sizes with localStorage persistence.
 * Stores and retrieves panel dimensions for vertical (top/bottom) and horizontal (builder/rightPanel) splits.
 */
export function useResizablePanels() {
  const [sizes, setSizes] = useState<PanelSizes>(() => {
    if (typeof window === 'undefined') return DEFAULT_SIZES

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as PanelSizes

        // Validate that the structure is correct
        if (
          Array.isArray(parsed.vertical) &&
          Array.isArray(parsed.horizontal) &&
          parsed.vertical.length === 2 &&
          parsed.horizontal.length === 2 &&
          parsed.vertical.every((v) => typeof v === 'number' && v > 0 && v < 100) &&
          parsed.horizontal.every((h) => typeof h === 'number' && h > 0 && h < 100)
        ) {
          return parsed
        }
      }
    } catch (error) {
      console.warn('Failed to load panel sizes from localStorage:', error)
    }

    return DEFAULT_SIZES
  })

  // Persist sizes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
    } catch (error) {
      console.warn('Failed to save panel sizes to localStorage:', error)
    }
  }, [sizes])

  const handleLayoutChange = useCallback(
    (direction: 'vertical' | 'horizontal', newSizes: number[]) => {
      setSizes((prev) => {
        const updated = { ...prev }
        updated[direction] = newSizes
        return updated
      })
    },
    []
  )

  const resetSizes = useCallback(() => {
    setSizes(DEFAULT_SIZES)
  }, [])

  return {
    sizes,
    handleLayoutChange,
    resetSizes,
  }
}
