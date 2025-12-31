'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type BoolClause = 'must' | 'should' | 'must_not' | 'filter';

interface ActiveClauseContextValue {
  /** Currently active clause tab */
  activeClause: BoolClause;
  /** Set the active clause */
  setActiveClause: (clause: BoolClause) => void;
}

const ActiveClauseContext = createContext<ActiveClauseContextValue | null>(null);

/**
 * Provider for tracking the active bool clause tab
 */
export function ActiveClauseProvider({ children }: { children: ReactNode }) {
  const [activeClause, setActiveClause] = useState<BoolClause>('must');

  return (
    <ActiveClauseContext.Provider value={{ activeClause, setActiveClause }}>
      {children}
    </ActiveClauseContext.Provider>
  );
}

/**
 * Hook to access the active clause context
 */
export function useActiveClause() {
  const context = useContext(ActiveClauseContext);
  if (!context) {
    throw new Error('useActiveClause must be used within an ActiveClauseProvider');
  }
  return context;
}

export type { BoolClause };
