'use client';

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
import { JSONPreview } from '@/components/JSONPreview';
import { ResultsPanel } from '@/components/ResultsPanel';
import { FieldList } from '@/components/FieldList';
import { ConnectionModal } from '@/components/ConnectionModal';
import { AggregationsPanel } from '@/components/AggregationsPanel';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery, createEmptyBoolQuery } from '@/context/QueryContext';
import { ActiveClauseProvider, useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { createQueryNodeFromField } from '@/utils/createQueryNodeFromField';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<'json' | 'explore'>('json');
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
      <main className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b px-6 py-3 flex items-center justify-between bg-white">
          <h1 className="text-xl font-semibold">Crystal Forge</h1>
          <div className="flex items-center gap-4">
            {state.connection.isConnected && (
              <span className="text-sm text-muted-foreground">
                Connected to {state.connection.host}
              </span>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {state.connection.isConnected ? 'Connection' : 'Connect'}
            </button>
            <ConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Field List */}
          <aside className="w-64 flex-shrink-0 border-r overflow-hidden flex flex-col">
            <FieldList />
          </aside>

          {/* Center - Query Builder + Results */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top: Query Builder + JSON Preview / Explore */}
            <div className="flex-1 flex min-h-0">
              {/* Visual Query Builder */}
              <DroppableQueryBuilder />

              {/* Right Panel with Tabs */}
              <div className="w-80 flex-shrink-0 overflow-hidden border-l bg-gray-50 flex flex-col">
                {/* Tab Bar */}
                <div className="flex border-b bg-white">
                  <button
                    onClick={() => setRightPanel('json')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      rightPanel === 'json'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setRightPanel('explore')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      rightPanel === 'explore'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Explore
                  </button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-auto p-4">
                  {rightPanel === 'json' ? (
                    <JSONPreview />
                  ) : (
                    <AggregationsPanel />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Results Panel */}
            <div className="h-72 flex-shrink-0 border-t overflow-hidden">
              <ResultsPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Drag Overlay - shows field being dragged */}
      <DragOverlay>
        {activeField && (
          <div className="px-3 py-2 bg-white rounded-md shadow-lg border-2 border-blue-500 text-sm font-medium">
            {activeField.name}
            <span className="ml-2 text-xs text-gray-400">{activeField.type}</span>
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
      className={`flex-1 p-4 border-r overflow-auto min-w-0 transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''
      }`}
    >
      <QueryBuilder />
    </div>
  );
}
