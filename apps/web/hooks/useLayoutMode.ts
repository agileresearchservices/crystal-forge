'use client';

import { useState, useEffect, useCallback } from 'react';

export type LayoutMode = 'visual' | 'dsl';

const LAYOUT_MODE_KEY = 'crystal-forge:layout-mode';

/**
 * Manages layout mode preference (Visual vs DSL-first)
 * Persists to localStorage
 */
export function useLayoutMode() {
  const [mode, setModeState] = useState<LayoutMode>('visual');
  const [isReady, setIsReady] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LAYOUT_MODE_KEY) as LayoutMode | null;
    if (stored === 'visual' || stored === 'dsl') {
      setModeState(stored);
    }
    setIsReady(true);
  }, []);

  // Save preference to localStorage
  const setMode = useCallback((newMode: LayoutMode) => {
    setModeState(newMode);
    localStorage.setItem(LAYOUT_MODE_KEY, newMode);
  }, []);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    setMode(mode === 'visual' ? 'dsl' : 'visual');
  }, [mode, setMode]);

  return {
    mode,
    setMode,
    toggleMode,
    isReady,
  };
}
