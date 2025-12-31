'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useConnection } from '@/context/ConnectionContext';
import { useQuery, generateNodeId, createEmptyBoolQuery } from '@/context/QueryContext';
import { useActiveClause } from '@/context/ActiveClauseContext';
import { useFieldSelector } from '@/hooks/useFieldSelector';
import { createQueryNodeFromField } from '@/utils/createQueryNodeFromField';
import type { FieldInfo } from '@crystal-forge/opensearch-client';
import { cn } from '@/lib/utils';

/**
 * Props for FieldList
 */
interface FieldListProps {
  className?: string;
}

/**
 * Sidebar showing available fields from the index schema
 */
export function FieldList({ className }: FieldListProps) {
  const { state: connectionState } = useConnection();
  const { state: queryState, addNode, setQuery } = useQuery();
  const { activeClause } = useActiveClause();
  const {
    filteredFields,
    groupedFields,
    fieldSearch,
    setFieldSearch,
    selectedField,
    setSelectedField,
  } = useFieldSelector(connectionState.fields);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /**
   * Toggle group expansion
   */
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  /**
   * Add field to query using smart node creation and active clause
   */
  const handleAddToQuery = useCallback(
    (field: FieldInfo) => {
      const newNode = createQueryNodeFromField(field);

      // If no query exists, create a bool query first
      if (!queryState.query.query) {
        const boolQuery = createEmptyBoolQuery();
        boolQuery[activeClause].push(newNode);
        setQuery(boolQuery);
      } else if (queryState.query.query.type === 'bool') {
        // Add to the active clause
        addNode([activeClause], newNode);
      } else {
        // Non-bool query exists, wrap it in a bool query
        const boolQuery = createEmptyBoolQuery();
        boolQuery.must.push(queryState.query.query);
        boolQuery[activeClause].push(newNode);
        setQuery(boolQuery);
      }
    },
    [addNode, setQuery, queryState.query.query, activeClause]
  );

  /**
   * Get badge color for field type
   */
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-700';
      case 'keyword':
        return 'bg-green-100 text-green-700';
      case 'long':
      case 'integer':
      case 'short':
      case 'byte':
      case 'double':
      case 'float':
        return 'bg-purple-100 text-purple-700';
      case 'date':
        return 'bg-orange-100 text-orange-700';
      case 'boolean':
        return 'bg-yellow-100 text-yellow-700';
      case 'nested':
        return 'bg-red-100 text-red-700';
      case 'object':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Determine if we should show grouped or flat view
  const showGrouped = Object.keys(groupedFields).length > 1;

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Fields</h3>

        {/* Search input */}
        <div className="relative">
          <label htmlFor="field-search" className="sr-only">
            Search fields
          </label>
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="field-search"
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search fields..."
            aria-label="Search fields by name or type"
            className={cn(
              'w-full pl-8 pr-8 py-1.5 text-sm rounded-md',
              'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:focus:ring-indigo-400'
            )}
          />
          {fieldSearch && (
            <button
              onClick={() => setFieldSearch('')}
              aria-label="Clear field search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Field count */}
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400" aria-live="polite" aria-atomic="true">
          {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''}
          {fieldSearch && ` matching "${fieldSearch}"`}
        </div>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-auto">
        {connectionState.fields.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {connectionState.connection.isConnected
              ? connectionState.connection.index
                ? 'Loading fields...'
                : 'Select an index to view fields'
              : 'Connect to OpenSearch to view fields'}
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400" role="status">
            No fields match your search
          </div>
        ) : showGrouped ? (
          <GroupedFieldList
            groupedFields={groupedFields}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onAddToQuery={handleAddToQuery}
            getTypeBadgeColor={getTypeBadgeColor}
          />
        ) : (
          <FlatFieldList
            fields={filteredFields}
            onAddToQuery={handleAddToQuery}
            getTypeBadgeColor={getTypeBadgeColor}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Grouped field list view
 */
interface GroupedFieldListProps {
  groupedFields: Record<string, FieldInfo[]>;
  expandedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onAddToQuery: (field: FieldInfo) => void;
  getTypeBadgeColor: (type: string) => string;
}

function GroupedFieldList({
  groupedFields,
  expandedGroups,
  onToggleGroup,
  onAddToQuery,
  getTypeBadgeColor,
}: GroupedFieldListProps) {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {Object.entries(groupedFields).map(([group, fields]) => (
        <div key={group}>
          {/* Group header */}
          <button
            onClick={() => onToggleGroup(group)}
            aria-expanded={expandedGroups.has(group)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2',
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500'
            )}
          >
            <svg
              className={cn(
                'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0',
                expandedGroups.has(group) && 'rotate-90'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="flex-1 text-left truncate">{group}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400" aria-label={`${fields.length} fields`}>
              {fields.length}
            </span>
          </button>

          {/* Group content */}
          {expandedGroups.has(group) && (
            <div className="pl-6 pb-2" role="region" aria-label={`${group} fields`}>
              {fields.map((field) => (
                <FieldItem
                  key={field.path}
                  field={field}
                  onAdd={() => onAddToQuery(field)}
                  typeBadgeColor={getTypeBadgeColor(field.type)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Flat field list view
 */
interface FlatFieldListProps {
  fields: FieldInfo[];
  onAddToQuery: (field: FieldInfo) => void;
  getTypeBadgeColor: (type: string) => string;
}

function FlatFieldList({
  fields,
  onAddToQuery,
  getTypeBadgeColor,
}: FlatFieldListProps) {
  return (
    <div className="py-1">
      {fields.map((field) => (
        <FieldItem
          key={field.path}
          field={field}
          onAdd={() => onAddToQuery(field)}
          typeBadgeColor={getTypeBadgeColor(field.type)}
        />
      ))}
    </div>
  );
}

/**
 * Individual field item
 */
interface FieldItemProps {
  field: FieldInfo;
  onAdd: () => void;
  typeBadgeColor: string;
}

function FieldItem({ field, onAdd, typeBadgeColor }: FieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.path}`,
    data: {
      type: 'field',
      field,
    },
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  const fieldDescription = [
    field.type,
    field.isNested && 'nested field',
    field.isMultiField && 'multi-field',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 group',
        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
        'focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded',
        isDragging && 'opacity-50'
      )}
    >
      {/* Clickable field name - semantic button for accessibility */}
      <button
        onClick={onAdd}
        className={cn(
          'flex items-center gap-2 flex-1 min-w-0 text-left',
          'cursor-grab active:cursor-grabbing',
          'focus:outline-none text-sm text-gray-700 dark:text-gray-300'
        )}
        aria-label={`Add ${field.path} (${field.type}) to active clause via click, or drag to specific clause`}
        {...attributes}
        {...listeners}
      >
        <span className="truncate">{field.path}</span>
      </button>

      {/* Type badge */}
      <span
        className={cn(
          'px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0',
          typeBadgeColor
        )}
        aria-label={`Field type: ${field.type}`}
      >
        {field.type}
      </span>

      {/* Add button - ALWAYS VISIBLE */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        aria-label={`Add ${field.path} to active clause`}
        className={cn(
          'p-1 rounded transition-all flex-shrink-0',
          'text-gray-400 dark:text-gray-500',
          'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:text-indigo-600 dark:focus:text-indigo-400'
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Indicators */}
      {field.isNested && (
        <span
          className="text-xs text-gray-500 dark:text-gray-400 font-medium flex-shrink-0"
          aria-label="Nested field"
          title="Nested field"
        >
          N
        </span>
      )}
      {field.isMultiField && (
        <span
          className="text-xs text-gray-500 dark:text-gray-400 font-medium flex-shrink-0"
          aria-label="Multi-field"
          title="Multi-field"
        >
          M
        </span>
      )}
    </div>
  );
}

export default FieldList;
