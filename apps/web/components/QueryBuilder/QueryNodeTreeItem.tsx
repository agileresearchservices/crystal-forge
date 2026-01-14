'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { QueryNode } from '@crystal-forge/query-dsl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryNodeTreeItemProps {
  node: QueryNode;
  path: string[];
  depth: number;
  onRemove: () => void;
  onEdit?: (node: QueryNode) => void;
}

/**
 * Compact tree item renderer for query nodes
 * Shows single-line display with click-to-expand edit mode
 */
export function QueryNodeTreeItem({
  node,
  path,
  depth,
  onRemove,
  onEdit,
}: QueryNodeTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Get query type icon
  const getTypeIcon = (): string => {
    switch (node.type) {
      case 'match':
      case 'multi_match':
      case 'match_phrase':
      case 'match_phrase_prefix':
      case 'query_string':
      case 'simple_query_string':
        return '🔍';
      case 'term':
      case 'terms':
      case 'ids':
        return '=';
      case 'range':
        return '≥';
      case 'prefix':
        return '→';
      case 'wildcard':
        return '*';
      case 'fuzzy':
        return '~';
      case 'regexp':
        return '⌘';
      case 'exists':
        return '✓';
      case 'bool':
        return '⊞';
      case 'nested':
        return '⧉';
      case 'geo_distance':
      case 'geo_bounding_box':
      case 'geo_shape':
        return '🌐';
      case 'constant_score':
        return '★';
      case 'boosting':
      case 'function_score':
        return '📈';
      case 'dis_max':
        return '⊕';
      case 'match_all':
        return '✱';
      case 'match_none':
        return '∅';
      default:
        return '○';
    }
  };

  // Get field and value for display
  const getDisplayText = (): string => {
    const nodeWithField = node as any;
    const field = nodeWithField.field || nodeWithField.path || '';
    const value = nodeWithField.value || nodeWithField.values?.[0] || '';
    const operator = nodeWithField.operator || '';

    if (node.type === 'bool') {
      return `Bool Query`;
    }
    if (node.type === 'nested') {
      return `nested: ${field}`;
    }
    if (node.type === 'exists') {
      return `exists: ${field}`;
    }
    if (!field) {
      return `${node.type} (no field)`;
    }

    const truncateValue = (v: string | number | boolean) => {
      const str = String(v);
      return str.length > 30 ? str.substring(0, 30) + '...' : str;
    };

    if (operator) {
      return `${field} ${operator} ${truncateValue(value)}`;
    }
    if (value) {
      return `${field} = "${truncateValue(value)}"`;
    }
    return `${field}`;
  };

  const leftMargin = `${depth * 16}px`;

  return (
    <div
      ref={ref}
      style={{ marginLeft: leftMargin }}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs',
        'transition-colors duration-150',
        isEditing
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-500 dark:border-indigo-600'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
      )}
      onClick={() => setIsEditing(true)}
      role="treeitem"
      aria-level={depth + 2}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onRemove();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditing(false);
        }
      }}
    >
      {/* Icon */}
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
        {getTypeIcon()}
      </span>

      {/* Display Text */}
      <span className="flex-1 text-gray-700 dark:text-gray-300 font-mono truncate">
        {getDisplayText()}
      </span>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          'flex-shrink-0 p-0.5 rounded-md transition-colors',
          'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        )}
        title="Remove clause"
        aria-label={`Remove ${getDisplayText()}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default QueryNodeTreeItem;
