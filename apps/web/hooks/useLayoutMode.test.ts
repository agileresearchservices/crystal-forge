import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLayoutMode } from './useLayoutMode';

describe('useLayoutMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with visual mode as default', async () => {
      const { result } = renderHook(() => useLayoutMode());

      // Wait for effect to complete
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.mode).toBe('visual');
    });

    it('should load mode from localStorage on mount', async () => {
      localStorage.setItem('crystal-forge:layout-mode', 'dsl');

      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.mode).toBe('dsl');
    });

    it('should ignore invalid localStorage values', async () => {
      localStorage.setItem('crystal-forge:layout-mode', 'invalid-mode');

      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Should default to visual
      expect(result.current.mode).toBe('visual');
    });

    it('should handle missing localStorage value', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.mode).toBe('visual');
    });
  });

  describe('setMode', () => {
    it('should update mode state', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.setMode('dsl');
      });

      expect(result.current.mode).toBe('dsl');
    });

    it('should persist mode to localStorage', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.setMode('dsl');
      });

      expect(localStorage.getItem('crystal-forge:layout-mode')).toBe('dsl');
    });

    it('should handle visual mode', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.setMode('visual');
      });

      expect(result.current.mode).toBe('visual');
      expect(localStorage.getItem('crystal-forge:layout-mode')).toBe('visual');
    });
  });

  describe('toggleMode', () => {
    it('should toggle from visual to dsl', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.mode).toBe('visual');

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('dsl');
    });

    it('should toggle from dsl to visual', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.setMode('dsl');
      });

      expect(result.current.mode).toBe('dsl');

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('visual');
    });

    it('should persist toggled mode to localStorage', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.toggleMode();
      });

      expect(localStorage.getItem('crystal-forge:layout-mode')).toBe('dsl');

      act(() => {
        result.current.toggleMode();
      });

      expect(localStorage.getItem('crystal-forge:layout-mode')).toBe('visual');
    });

    it('should support multiple toggles', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('dsl');

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe('visual');
    });
  });

  describe('isReady flag', () => {
    it('should set isReady after mount effect completes', async () => {
      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should indicate when localStorage is loaded', async () => {
      localStorage.setItem('crystal-forge:layout-mode', 'dsl');

      const { result } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.mode).toBe('dsl'); // Updated after effect
    });
  });

  describe('persistence across instances', () => {
    it('should load previous mode in new instance', async () => {
      const { result: result1 } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result1.current.isReady).toBe(true);
      });

      act(() => {
        result1.current.setMode('dsl');
      });

      // Create new instance
      const { result: result2 } = renderHook(() => useLayoutMode());

      await waitFor(() => {
        expect(result2.current.isReady).toBe(true);
      });

      expect(result2.current.mode).toBe('dsl');
    });
  });
});
