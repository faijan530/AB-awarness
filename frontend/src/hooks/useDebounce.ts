import { useState, useEffect } from 'react';

/**
 * Hook to debounce any fast-changing value (e.g. search inputs)
 * @param value The value to debounce
 * @param delayMs Debounce delay in milliseconds (default 250ms)
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
