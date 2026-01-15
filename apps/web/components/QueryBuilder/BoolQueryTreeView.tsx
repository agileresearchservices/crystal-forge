'use client';

import React, { useCallback } from 'react';
import { useQuery } from '@/context/QueryContext';
import { useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { QueryNodeComponent } from './QueryNode';
import { QueryNodeTreeItem } from './QueryNodeTreeItem';
import { ChevronDown } from 'lucide-react';
import type { BoolQueryNode, QueryNode } from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';

const CLAUSE_INFO: Record<BoolClause, { label: string; icon: string; color: string }> = {
  must: {
    label: 'Must',
    icon: '✓',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  },
  should: {
    label: 'Should',
    icon: '◇',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  },
  must_not: {
    label: 'Must Not',
    icon: '✗',
    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  },
  filter: {
    label: 'Filter',
    icon: '⊕',
    color: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-300',
  },
};

interface BoolQueryTreeViewProps {
  node: BoolQueryNode;
  path: string[];
  depth: number;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (clausePath: string) => void;
  viewMode?: 'tree' | 'tabbed';
}

/**
 * Tree view renderer for bool queries
 * Shows all 4 clauses simultaneously with collapsible sections
 */
export function BoolQueryTreeView({
  node,
  path,
  depth,
  collapsed,
  onToggleCollapse,
  viewMode = 'tree',
}: BoolQueryTreeViewProps) {
  const { removeNode } = useQuery();
  const { setActiveClause } = useActiveClause();

  /**
   * Remove a node from a clause
   */
  const handleRemoveNode = useCallback(
    (clause: BoolClause, nodeId: string) => {
      removeNode([...path, clause], nodeId);
    },
    [removeNode, path]
  );

  /**
   * Get total clause count
   */
  const getTotalCount = () => {
    return node.must.length + node.should.length + node.must_not.length + node.filter.length;
  };

  /**
   * Determine if a clause section should be collapsed
   */
  const isCollapsed = (clause: BoolClause): boolean => {
    const clausePath = [...path, clause].join('.');
    return collapsed[clausePath] ?? (depth > 2); // Auto-collapse depth 3+
  };

  /**
   * Toggle collapse state for a clause
   */
  const toggleClauseCollapse = (clause: BoolClause) => {
    const clausePath = [...path, clause].join('.');
    onToggleCollapse(clausePath);
  };

  /**
   * Render nodes in a clause section
   */
  const renderClauseNodes = (clause: BoolClause, nodes: QueryNode[]) => {
    if (nodes.length === 0) {
      return (
        <div className="text-xs text-gray-700 dark:text-gray-400 italic py-2 px-3">
          (empty)
        </div>
      );
    }

    return (
      <div className="space-y-1.5 px-3 py-2">
        {nodes.map((childNode, index) => (
          <div key={childNode.id} className="relative">
            {/* Connector line between nodes */}
            {index > 0 && (
              <div className="absolute left-0 -top-1 text-xs text-gray-700 dark:text-gray-400 font-medium mb-1">
                {clause === 'should' ? 'OR' : clause === 'must_not' ? 'AND NOT' : 'AND'}
              </div>
            )}

            {/* Render node based on type */}
            {childNode.type === 'bool' ? (
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <BoolQueryTreeView
                  node={childNode as BoolQueryNode}
                  path={[...path, clause, String(index)]}
                  depth={depth + 1}
                  collapsed={collapsed}
                  onToggleCollapse={onToggleCollapse}
                  viewMode={viewMode}
                />
              </div>
            ) : (
              <QueryNodeTreeItem
                node={childNode}
                path={[...path, clause, String(index)]}
                depth={depth}
                onRemove={() => handleRemoveNode(clause, childNode.id)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('rounded-lg border', depth === 0 ? 'border-gray-300 bg-white dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50')}>
      {/* Header */}
      {depth === 0 && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bool Query</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {getTotalCount()} clauses
            </span>
          </div>
        </div>
      )}

      {/* Clauses */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {(Object.keys(CLAUSE_INFO) as BoolClause[]).map((clause) => {
          const info = CLAUSE_INFO[clause];
          const nodes = node[clause];
          const clausePath = [...path, clause].join('.');
          const collapsed_ = isCollapsed(clause);

          return (
            <div key={clause} className={cn('border-l-4', {
              'border-l-green-500': clause === 'must',
              'border-l-blue-500': clause === 'should',
              'border-l-red-500': clause === 'must_not',
              'border-l-gray-400': clause === 'filter',
            })}>
              {/* Clause Header */}
              <button
                onClick={() => toggleClauseCollapse(clause)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm font-medium',
                  'transition-colors duration-150',
                  'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                  info.color
                )}
                aria-expanded={!collapsed_}
                aria-controls={`clause-${clausePath}`}
                role="button"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">{info.icon}</span>
                  <span>{info.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 opacity-75">
                    {nodes.length}
                  </span>
                </div>

                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    collapsed_ && '-rotate-90'
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Clause Content */}
              {!collapsed_ && (
                <div id={`clause-${clausePath}`} role="region">
                  {renderClauseNodes(clause, nodes)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BoolQueryTreeView;
