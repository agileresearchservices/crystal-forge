'use client'

import { useState, useEffect, useCallback } from 'react'

interface PanelSizes {
  vertical: number[]
  horizontal: number[]
}

const STORAGE_KEY = 'crystal-forge-panel-sizes'

const DEFAULT_SIZES: PanelSizes = {
  vertical: [70, 30],
  horizontal: [20, 50, 30], // Field List (20%), Query Builder (50%), Right Panel (30%)
}

/**
 * Hook for managing resizable panel sizes with localStorage persistence.
 * Stores and retrieves panel dimensions for:
 * - Vertical: top section (query builder + right panel) vs bottom section (results)
 * - Horizontal: field list (20%) vs query builder (50%) vs right panel with JSON/Aggs tabs (30%)
 */
export function useResizablePanels() {
  // Initialize with DEFAULT_SIZES on both server and client to prevent hydration mismatch
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_SIZES)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage only after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as PanelSizes

        // Validate that the structure is correct
        if (
          Array.isArray(parsed.vertical) &&
          Array.isArray(parsed.horizontal) &&
          parsed.vertical.length === 2 &&
          parsed.horizontal.length === 3 &&
          parsed.vertical.every((v) => typeof v === 'number' && v > 0 && v < 100) &&
          parsed.horizontal.every((h) => typeof h === 'number' && h > 0 && h < 100)
        ) {
          setSizes(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to load panel sizes from localStorage:', error)
    }

    setIsHydrated(true)
  }, [])

  // Persist sizes to localStorage whenever they change (only after hydration)
  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
    } catch (error) {
      console.warn('Failed to save panel sizes to localStorage:', error)
    }
  }, [sizes, isHydrated])

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
