'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { QueryBuilder } from '@/components/QueryBuilder/QueryBuilder';
const JSONPreview = dynamic(() => import('@/components/JSONPreview').then((mod) => ({ default: mod.JSONPreview })), { ssr: false });
import { ResultsPanel } from '@/components/ResultsPanel';
import { FieldList } from '@/components/FieldList';
import { ConnectionModal } from '@/components/ConnectionModal';
import { AggregationBuilderPanel } from '@/components/AggregationBuilderPanel/AggregationBuilderPanel';
import { HelpMenu } from '@/components/HelpMenu/HelpMenu';
import { AutoStartTour } from '@/components/Tour/AutoStartTour';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery, createEmptyBoolQuery } from '@/context/QueryContext';
import { ActiveClauseProvider, useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { useResizablePanels } from '@/hooks/useResizablePanels';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { createQueryNodeFromField } from '@/utils/createQueryNodeFromField';
import { Code2, Wand2 } from 'lucide-react';
import type { FieldInfo } from '@crystal-forge/opensearch-client';

interface DragData {
  type: 'field';
  field: FieldInfo;
}

interface DropData {
  type: 'query-builder';
  activeClause: BoolClause;
}

export default function Home() {
  return (
    <ActiveClauseProvider>
      <HomeContent />
    </ActiveClauseProvider>
  );
}

function HomeContent() {
  const { state } = useConnection();
  const { state: queryState, addNode, setQuery } = useQuery();
  const { activeClause } = useActiveClause();
  const { sizes, handleLayoutChange } = useResizablePanels();
  const { mode, toggleMode, isReady } = useLayoutMode();
  const { executeQuery, isLoading, canExecute } = useQueryExecution();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<FieldInfo | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data?.type === 'field') {
      setActiveField(data.field);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveField(null);

      const { active, over } = event;
      if (!over) return;

      const dragData = active.data.current as DragData | undefined;
      const dropData = over.data.current as DropData | undefined;

      if (dragData?.type === 'field' && dropData?.type === 'query-builder') {
        const newNode = createQueryNodeFromField(dragData.field);

        // If no query exists, create a bool query first
        if (!queryState.query.query) {
          const boolQuery = createEmptyBoolQuery();
          boolQuery[dropData.activeClause].push(newNode);
          setQuery(boolQuery);
        } else if (queryState.query.query.type === 'bool') {
          // Add to the active clause
          addNode([dropData.activeClause], newNode);
        } else {
          // Non-bool query exists, wrap it in a bool query
          const boolQuery = createEmptyBoolQuery();
          boolQuery.must.push(queryState.query.query);
          boolQuery[dropData.activeClause].push(newNode);
          setQuery(boolQuery);
        }
      }
    },
    [addNode, setQuery, queryState.query.query]
  );

  const handleDragCancel = useCallback(() => {
    setActiveField(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
            {isReady && (
              <button
                onClick={toggleMode}
                aria-label={`Switch to ${mode === 'visual' ? 'DSL' : 'Visual'} mode`}
                title={`${mode === 'visual' ? 'DSL' : 'Visual'} Mode: ${mode === 'visual' ? 'JSON-first layout for experienced developers' : 'Visual query builder'}`}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 inline-flex items-center gap-2"
              >
                {mode === 'visual' ? <Code2 className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {mode === 'visual' ? 'DSL Mode' : 'Visual Mode'}
                </span>
              </button>
            )}
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
              {/* Inner Horizontal Panel Group - handles field list vs query vs aggregations */}
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

                {/* Panel 2: Query Builder */}
                <ResizablePanel
                  defaultSize={sizes.horizontal[1] || 40}
                  minSize={30}
                  id="tour-query-builder"
                  className="overflow-hidden"
                >
                  {mode === 'dsl' ? (
                    <div className="h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col">
                      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="flex-1 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-900">
                          Query DSL (JSON)
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto p-4">
                        <div id="tour-json-panel" role="tabpanel">
                          <JSONPreview />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DroppableQueryBuilder />
                  )}
                </ResizablePanel>

                {/* Horizontal Handle 2 */}
                <ResizableHandle
                  withHandle
                  className="bg-gray-200 dark:bg-gray-800 hover:bg-purple-400 dark:hover:bg-purple-600 transition-colors"
                  aria-label="Resize query builder and aggregations"
                />

                {/* Panel 3: Aggregation Builder */}
                <ResizablePanel
                  defaultSize={sizes.horizontal[2] || 40}
                  minSize={25}
                  id="aggregation-builder-panel"
                  className="overflow-hidden"
                >
                  <div className="h-full overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col">
                    <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900">
                        Aggregations
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {mode === 'dsl' ? (
                        <div className="h-full flex items-center justify-center p-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Aggregations builder available in Visual mode
                          </p>
                        </div>
                      ) : (
                        <AggregationBuilderPanel />
                      )}
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

      {/* Drag Overlay - shows field being dragged */}
      <DragOverlay>
        {activeField && (
          <div
            className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border-2 border-indigo-500 text-sm font-medium text-gray-900 dark:text-white"
            aria-live="polite"
            aria-label={`Dragging field: ${activeField.name}`}
          >
            {activeField.name}
            <span className="ml-2 text-xs text-gray-700 dark:text-gray-400">{activeField.type}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Droppable wrapper for QueryBuilder
 * Allows fields to be dropped onto the query builder area
 */
function DroppableQueryBuilder() {
  const { activeClause } = useActiveClause();

  const { setNodeRef, isOver } = useDroppable({
    id: 'query-builder-drop-zone',
    data: {
      type: 'query-builder',
      activeClause,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-full flex flex-col p-4 border-r overflow-hidden min-w-0 transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''
      }`}
    >
      <QueryBuilder />
    </div>
  );
}
