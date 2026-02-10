'use client';

import React, { useCallback } from 'react';
import { useQuery, generateNodeId } from '@/context/QueryContext';
import { useActiveClause, type BoolClause } from '@/context/ActiveClauseContext';
import { QueryNodeComponent } from './QueryNode';
import type {
  BoolQueryNode,
  QueryNode,
  MatchQueryNode,
} from '@crystal-forge/query-dsl';
import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { CLAUSE_TOOLTIPS } from '@/constants/tooltips';

/**
 * Clause metadata for display
 */
const CLAUSE_INFO: Record<BoolClause, { label: string; description: string; color: string }> = {
  must: {
    label: 'Must',
    description: 'All clauses must match (AND)',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  should: {
    label: 'Should',
    description: 'At least one clause should match (OR)',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  must_not: {
    label: 'Must Not',
    description: 'No clause must match (NOT)',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  filter: {
    label: 'Filter',
    description: 'Must match but does not affect score',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

/**
 * Props for BooleanGroup
 */
interface BooleanGroupProps {
  node: BoolQueryNode;
  path: string[];
}

/**
 * Bool query container component
 * Renders sections for must/should/must_not/filter clauses
 */
export function BooleanGroup({
  node,
  path,
}: BooleanGroupProps) {
  const { addNode, removeNode } = useQuery();
  const { activeClause: activeTab, setActiveClause: setActiveTab } = useActiveClause();

  /**
   * Add a new clause to a specific bool section
   */
  const handleAddClause = useCallback(
    (clause: BoolClause) => {
      const newNode: MatchQueryNode = {
        id: generateNodeId(),
        type: 'match',
        field: '',
        value: '',
      };
      addNode([...path, clause], newNode);
    },
    [addNode, path]
  );

  /**
   * Add a nested bool query
   */
  const handleAddNestedBool = useCallback(
    (clause: BoolClause) => {
      const newBoolNode: BoolQueryNode = {
        id: generateNodeId(),
        type: 'bool',
        must: [],
        should: [],
        must_not: [],
        filter: [],
      };
      addNode([...path, clause], newBoolNode);
    },
    [addNode, path]
  );

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

  return (
    <div className={cn('rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800')}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-white">Bool Query</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {getTotalCount()} clauses
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(Object.keys(CLAUSE_INFO) as BoolClause[]).map((clause) => {
          const info = CLAUSE_INFO[clause];
          const count = node[clause].length;
          const isActive = activeTab === clause;

          return (
            <div key={clause} className="flex items-center flex-1 relative">
              {isActive && (
                <div className="absolute inset-0 -top-1 rounded-t-lg bg-indigo-50 dark:bg-indigo-900/30 pointer-events-none" aria-hidden="true" />
              )}
              <button
                onClick={() => setActiveTab(clause)}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium relative',
                  'border-b-2 transition-all flex items-center justify-between',
                  isActive
                    ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="flex items-center gap-1">
                  {info.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
                        isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
              <div className="px-1">
                <InfoTooltip
                  content={CLAUSE_TOOLTIPS[clause]}
                  side="right"
                  className="flex-shrink-0"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="p-3">
        <ClauseSection
          clause={activeTab}
          nodes={node[activeTab]}
          path={path}
          onAddClause={() => handleAddClause(activeTab)}
          onAddNestedBool={() => handleAddNestedBool(activeTab)}
          onRemoveNode={(nodeId) => handleRemoveNode(activeTab, nodeId)}
        />
      </div>
    </div>
  );
}

/**
 * Props for ClauseSection
 */
interface ClauseSectionProps {
  clause: BoolClause;
  nodes: QueryNode[];
  path: string[];
  onAddClause: () => void;
  onAddNestedBool: () => void;
  onRemoveNode: (nodeId: string) => void;
}

/**
 * Section for a single bool clause type
 */
function ClauseSection({
  clause,
  nodes,
  path,
  onAddClause,
  onAddNestedBool,
  onRemoveNode,
}: ClauseSectionProps) {
  const info = CLAUSE_INFO[clause];

  return (
    <div className="space-y-3">
      {/* Description */}
      <p className="text-xs text-gray-700 dark:text-gray-300">{info.description}</p>

      {/* Clause Nodes */}
      {nodes.length > 0 ? (
        <div className="space-y-2">
          {nodes.map((childNode, index) => (
            <div key={childNode.id} className="relative">
              {/* Connector line for visual hierarchy */}
              {index > 0 && (
                <div className="absolute left-4 -top-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {clause === 'should' ? 'OR' : clause === 'must_not' ? 'AND NOT' : 'AND'}
                </div>
              )}
              <QueryNodeComponent
                node={childNode}
                path={[...path, clause, String(index)]}
                onRemove={() => onRemoveNode(childNode.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
          No clauses in {info.label.toLowerCase()}
        </div>
      )}

      {/* Add Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onAddClause}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md',
            'border border-dashed border-gray-300 dark:border-gray-600',
            'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Clause
        </button>
        <button
          onClick={onAddNestedBool}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md',
            'border border-dashed border-gray-300 dark:border-gray-600',
            'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-colors'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          Add Nested Bool
        </button>
      </div>
    </div>
  );
}

export default BooleanGroup;
