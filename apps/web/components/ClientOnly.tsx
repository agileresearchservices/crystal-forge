'use client';

import { useEffect, useState } from 'react';

/**
 * Component that only renders on the client side
 * Prevents hydration errors and SSR issues
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
