'use client';

import { useState } from 'react';
import { QueryBuilder } from '@/components/QueryBuilder/QueryBuilder';
import { JSONPreview } from '@/components/JSONPreview';
import { ResultsPanel } from '@/components/ResultsPanel';
import { FieldList } from '@/components/FieldList';
import { ConnectionModal } from '@/components/ConnectionModal';
import { useConnection } from '@/context/ConnectionContext';

export default function Home() {
  const { state } = useConnection();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
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
          {/* Top: Query Builder + JSON Preview */}
          <div className="flex-1 flex min-h-0">
            {/* Visual Query Builder */}
            <div className="flex-1 p-4 border-r overflow-auto min-w-0">
              <QueryBuilder />
            </div>

            {/* JSON Preview */}
            <div className="w-80 flex-shrink-0 p-4 overflow-auto border-l bg-gray-50">
              <JSONPreview />
            </div>
          </div>

          {/* Bottom: Results Panel */}
          <div className="h-72 flex-shrink-0 border-t overflow-hidden">
            <ResultsPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
