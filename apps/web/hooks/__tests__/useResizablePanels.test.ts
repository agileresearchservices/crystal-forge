import { renderHook, act } from '@testing-library/react'
import { useResizablePanels } from '../useResizablePanels'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('useResizablePanels', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads default sizes when localStorage is empty', () => {
    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([16, 54, 30])
  })

  it('loads sizes from localStorage', () => {
    const customSizes = {
      vertical: [75, 25],
      horizontal: [25, 45, 30],
    }
    localStorage.setItem('crystal-forge-panel-sizes', JSON.stringify(customSizes))

    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([75, 25])
    expect(result.current.sizes.horizontal).toEqual([25, 45, 30])
  })

  it('saves sizes to localStorage on change', () => {
    const { result } = renderHook(() => useResizablePanels())

    act(() => {
      result.current.handleLayoutChange('vertical', [80, 20])
    })

    const stored = JSON.parse(localStorage.getItem('crystal-forge-panel-sizes') || '{}')
    expect(stored.vertical).toEqual([80, 20])
  })

  it('resets to default sizes', () => {
    localStorage.setItem(
      'crystal-forge-panel-sizes',
      JSON.stringify({
        vertical: [90, 10],
        horizontal: [30, 40, 30],
      })
    )

    const { result } = renderHook(() => useResizablePanels())

    act(() => {
      result.current.resetSizes()
    })

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([16, 54, 30])
  })

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('crystal-forge-panel-sizes', 'invalid json')

    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([16, 54, 30])
  })

  it('validates numeric ranges in stored data', () => {
    const invalidSizes = {
      vertical: [0, 100], // 0 is invalid
      horizontal: [20, 50, 30],
    }
    localStorage.setItem('crystal-forge-panel-sizes', JSON.stringify(invalidSizes))

    const { result } = renderHook(() => useResizablePanels())

    // Should fall back to defaults
    expect(result.current.sizes.vertical).toEqual([70, 30])
  })
})
