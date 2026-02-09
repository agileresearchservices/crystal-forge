import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce string value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    act(() => {
      rerender({ value: 'updated', delay: 500 });
    });

    // Should still be old value immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('should debounce number value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    expect(result.current).toBe(0);

    act(() => {
      rerender({ value: 42, delay: 300 });
    });

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('should debounce object value', () => {
    const obj1 = { name: 'test' };
    const obj2 = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: obj1, delay: 500 } }
    );

    expect(result.current).toBe(obj1);

    act(() => {
      rerender({ value: obj2, delay: 500 });
    });

    expect(result.current).toBe(obj1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(obj2);
  });

  it('should cancel previous timeout on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    act(() => {
      rerender({ value: 'second', delay: 500 });
    });

    // Advance 200ms - timer still pending
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Change value again before debounce completes
    act(() => {
      rerender({ value: 'third', delay: 500 });
    });

    // Advance another 500ms (total 700ms since 'first', but only 500ms since 'third')
    // 'second' timer was cancelled when we set 'third'
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be 'third' (500ms passed since 'third' was set)
    expect(result.current).toBe('third');
  });

  it('should respect custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    act(() => {
      rerender({ value: 'updated', delay: 1000 });
    });

    // Advance 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should still be old value
    expect(result.current).toBe('initial');

    // Advance another 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('should handle rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );

    // Simulate rapid changes
    act(() => {
      for (let i = 1; i <= 10; i++) {
        rerender({ value: i, delay: 500 });
        vi.advanceTimersByTime(50);
      }
    });

    // After 500ms total, should still be initial
    expect(result.current).toBe(0);

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be the last value (10)
    expect(result.current).toBe(10);
  });

  it('should work with zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    act(() => {
      rerender({ value: 'updated', delay: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });
});
