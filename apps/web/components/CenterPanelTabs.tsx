'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueryBuilder } from '@/components/QueryBuilder/QueryBuilder';
import { AggregationBuilderPanel } from '@/components/AggregationBuilderPanel/AggregationBuilderPanel';
import { Hammer, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type CenterTab = 'query' | 'aggregations';

const STORAGE_KEY = 'crystal-forge:center-panel-tab';

/**
 * Tabbed center panel containing Query Builder and Aggregations Builder.
 * Active tab persists to localStorage.
 */
export function CenterPanelTabs() {
  const [activeTab, setActiveTab] = useState<CenterTab>('query');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'query' || stored === 'aggregations') {
      setActiveTab(stored);
    }
  }, []);

  const switchTab = useCallback((tab: CenterTab) => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEY, tab);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Tab buttons */}
      <div
        className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-800"
        role="tablist"
        aria-label="Center panel tabs"
      >
        <TabButton
          active={activeTab === 'query'}
          onClick={() => switchTab('query')}
          icon={<Hammer className="w-4 h-4" />}
          label="Query"
          id="tab-query"
          controls="tabpanel-query"
        />
        <TabButton
          active={activeTab === 'aggregations'}
          onClick={() => switchTab('aggregations')}
          icon={<BarChart3 className="w-4 h-4" />}
          label="Aggregations"
          id="tab-center-aggregations"
          controls="tabpanel-center-aggregations"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'query' && (
          <div
            id="tabpanel-query"
            role="tabpanel"
            aria-labelledby="tab-query"
            className="h-full overflow-hidden"
          >
            <QueryBuilder />
          </div>
        )}
        {activeTab === 'aggregations' && (
          <div
            id="tabpanel-center-aggregations"
            role="tabpanel"
            aria-labelledby="tab-center-aggregations"
            className="h-full overflow-hidden"
          >
            <AggregationBuilderPanel />
          </div>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  id: string;
  controls: string;
}

function TabButton({ active, onClick, icon, label, id, controls }: TabButtonProps) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
        active
          ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-900'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
