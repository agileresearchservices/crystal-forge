import { renderHook, act } from '@testing-library/react'
import { useResizablePanels } from '../useResizablePanels'

describe('useResizablePanels', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('loads default sizes when localStorage is empty', () => {
    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([60, 40])
  })

  it('loads sizes from localStorage', () => {
    const customSizes = {
      vertical: [75, 25],
      horizontal: [50, 50],
    }
    localStorage.setItem('crystal-forge-panel-sizes', JSON.stringify(customSizes))

    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([75, 25])
    expect(result.current.sizes.horizontal).toEqual([50, 50])
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
        horizontal: [30, 70],
      })
    )

    const { result } = renderHook(() => useResizablePanels())

    act(() => {
      result.current.resetSizes()
    })

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([60, 40])
  })

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('crystal-forge-panel-sizes', 'invalid json')

    const { result } = renderHook(() => useResizablePanels())

    expect(result.current.sizes.vertical).toEqual([70, 30])
    expect(result.current.sizes.horizontal).toEqual([60, 40])
  })

  it('validates numeric ranges in stored data', () => {
    const invalidSizes = {
      vertical: [0, 100], // 0 is invalid
      horizontal: [60, 40],
    }
    localStorage.setItem('crystal-forge-panel-sizes', JSON.stringify(invalidSizes))

    const { result } = renderHook(() => useResizablePanels())

    // Should fall back to defaults
    expect(result.current.sizes.vertical).toEqual([70, 30])
  })
})
