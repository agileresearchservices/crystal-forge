'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ResultsPanel } from '@/components/ResultsPanel';
import { FieldList } from '@/components/FieldList';
import { ConnectionModal } from '@/components/ConnectionModal';
import { QueryBuilder } from '@/components/QueryBuilder/QueryBuilder';
import { HelpMenu } from '@/components/HelpMenu/HelpMenu';

const JSONPreview = dynamic(
  () => import('@/components/JSONPreview').then((mod) => ({ default: mod.JSONPreview })),
  { ssr: false }
);
import { AutoStartTour } from '@/components/Tour/AutoStartTour';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useConnection } from '@/context/ConnectionContext';
import { ActiveClauseProvider } from '@/context/ActiveClauseContext';
import { useResizablePanels } from '@/hooks/useResizablePanels';
import { useQueryExecution } from '@/hooks/useQueryExecution';

export default function Home() {
  return (
    <ActiveClauseProvider>
      <HomeContent />
    </ActiveClauseProvider>
  );
}

function HomeContent() {
  const { state } = useConnection();
  const { sizes, handleLayoutChange } = useResizablePanels();
  const { executeQuery, isLoading, canExecute } = useQueryExecution();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAttemptedAutoOpen, setHasAttemptedAutoOpen] = useState(false);

  // Auto-open modal when connected but no index selected
  useEffect(() => {
    if (
      state.connection.isConnected &&
      !state.connection.index &&
      !hasAttemptedAutoOpen
    ) {
      setIsModalOpen(true);
      setHasAttemptedAutoOpen(true);
    }
  }, [state.connection.isConnected, state.connection.index, hasAttemptedAutoOpen]);

  // Reset auto-open flag when index is selected or connection is lost
  useEffect(() => {
    if (state.connection.index || !state.connection.isConnected) {
      setHasAttemptedAutoOpen(false);
    }
  }, [state.connection.index, state.connection.isConnected]);

  // Add keyboard shortcut for executing query (Ctrl+Enter or Cmd+Enter)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (canExecute) {
          executeQuery();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canExecute, executeQuery]);

  return (
    <>
      {/* Auto-start tour for first-time users */}
      <AutoStartTour />

      <main className="h-screen flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Header */}
        <header
          id="tour-welcome"
          className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm"
          role="banner"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md flex-shrink-0"
              aria-label="Crystal Forge logo"
            >
              <span className="text-white font-bold text-lg">⚔️</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                Crystal Forge
              </h1>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">OpenSearch Query Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
            {state.connection.isConnected && (
              <div
                id="tour-connection-status"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
                aria-live="polite"
                aria-label={`Connected to ${state.connection.index || 'OpenSearch'}`}
              >
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse flex-shrink-0" aria-hidden="true"></div>
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 truncate">
                  {state.connection.index || 'Connected'}
                </span>
              </div>
            )}
            {state.connection.isConnected && (
              <button
                onClick={executeQuery}
                disabled={!canExecute || isLoading}
                aria-label="Execute query and aggregations (Ctrl+Enter)"
                title="Execute query and aggregations (Ctrl+Enter)"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Executing...</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span className="hidden sm:inline">Execute</span>
                  </>
                )}
              </button>
            )}
            <div id="tour-help-menu">
              <HelpMenu />
            </div>
            <button
              id="tour-connect-button"
              onClick={() => setIsModalOpen(true)}
              aria-label={state.connection.isConnected ? 'Reconnect to OpenSearch' : 'Connect to OpenSearch'}
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {state.connection.isConnected ? 'Reconnect' : 'Connect'}
            </button>
            <ConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </div>
        </header>

        {/* Screen reader announcement for index selection */}
        {state.connection.index && (
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Index {state.connection.index} selected with {state.fields.length} fields loaded
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Outer Vertical Resizable Panel Group - handles top section vs results */}
          <ResizablePanelGroup
            direction="vertical"
            className="flex-1 min-h-0"
            onLayout={(newSizes) => handleLayoutChange('vertical', newSizes)}
          >
            {/* Top Section - 3-Column Layout */}
            <ResizablePanel
              defaultSize={sizes.vertical[0]}
              minSize={40}
              id="top-section"
            >
              {/* Inner Horizontal Panel Group - handles field list vs query builder vs right panel */}
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full"
                onLayout={(newSizes) => handleLayoutChange('horizontal', newSizes)}
              >
                {/* Panel 1: Field List */}
                <ResizablePanel
                  defaultSize={sizes.horizontal[0] || 20}
                  minSize={15}
                  maxSize={40}
                  id="tour-field-list"
                  className="overflow-hidden"
                >
                  <aside
                    className="h-full border-r border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col bg-white dark:bg-gray-900"
                    aria-label="Available fields"
                  >
                    <FieldList />
                  </aside>
                </ResizablePanel>

                {/* Horizontal Handle 1 */}
                <ResizableHandle
                  withHandle
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-colors"
                  aria-label="Resize field list and query builder"
                />

                {/* Panel 2: Query Builder + Aggregations (tabbed) */}
                <ResizablePanel
                  defaultSize={sizes.horizontal[1] || 50}
                  minSize={30}
                  id="tour-query-builder"
                  className="overflow-hidden"
                >
                  <QueryBuilder />
                </ResizablePanel>

                {/* Horizontal Handle 2 */}
                <ResizableHandle
                  withHandle
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-purple-400 dark:hover:bg-purple-600 transition-colors"
                  aria-label="Resize query builder and JSON panel"
                />

                {/* Panel 3: JSON Preview */}
                <ResizablePanel
                  defaultSize={sizes.horizontal[2] || 30}
                  minSize={20}
                  id="tour-json-panel"
                  className="overflow-hidden"
                >
                  <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
                    <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400">
                        JSON
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <JSONPreview />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Vertical Resize Handle */}
            <ResizableHandle
              withHandle
              className="bg-gray-200 dark:bg-gray-800 hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-colors"
              aria-label="Resize top section and results panel"
            />

            {/* Bottom Section - Results Panel */}
            <ResizablePanel
              defaultSize={sizes.vertical[1]}
              minSize={15}
              maxSize={60}
              id="tour-results-panel"
              className="overflow-hidden"
            >
              <div className="h-full overflow-hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <ResultsPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
    </>
  );
}
