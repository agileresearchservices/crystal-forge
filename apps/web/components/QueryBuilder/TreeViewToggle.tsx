'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trees, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeViewToggleProps {
  mode: 'tree' | 'tabbed';
  onChange: (mode: 'tree' | 'tabbed') => void;
}

/**
 * Toggle button to switch between tree and tabbed query view modes
 */
export function TreeViewToggle({ mode, onChange }: TreeViewToggleProps) {
  return (
    <div
      className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md"
      role="group"
      aria-label="Query view mode"
    >
      <button
        onClick={() => onChange('tabbed')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'tabbed'
            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 border-r border-gray-200 dark:border-gray-700'
        )}
        title="Tabbed view: Show one clause at a time"
        aria-label="Switch to tabbed view"
        aria-pressed={mode === 'tabbed'}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Tabs</span>
      </button>

      <button
        onClick={() => onChange('tree')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
          mode === 'tree'
            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        )}
        title="Tree view: See all clauses at once with collapsible sections"
        aria-label="Switch to tree view"
        aria-pressed={mode === 'tree'}
      >
        <Trees className="w-4 h-4" />
        <span className="hidden sm:inline">Tree</span>
      </button>
    </div>
  );
}

export default TreeViewToggle;
